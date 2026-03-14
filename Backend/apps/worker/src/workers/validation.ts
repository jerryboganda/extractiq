import { isJobCancelled, updateJobStage } from '../lib/job-guard.js';
import type { Job } from 'bullmq';
import type { ValidationPayload, HallucinationDetectionPayload, ReviewRoutingPayload } from '@mcq-platform/queue';
import { enqueue, QUEUE_NAMES } from '@mcq-platform/queue';
import { db, mcqRecords } from '@mcq-platform/db';
import { createLogger } from '@mcq-platform/logger';
import { eq } from 'drizzle-orm';
import { markProcessingFailure, shouldPersistFailure } from '../lib/failure-state.js';

const logger = createLogger('worker:validation');

/**
 * Validation Worker
 *
 * 8-stage validation pipeline for each extracted MCQ:
 * 1. Schema validation (required fields present)
 * 2. Content quality (question length, option count)
 * 3. Option consistency (no duplicates, reasonable length)
 * 4. Answer validity (correct answer exists in options)
 * 5. Language detection (single language)
 * 6. Formatting checks (no garbage characters, encoding issues)
 * 7. Duplicate detection (similarity to existing MCQs)
 * 8. Confidence scoring (aggregated from all checks)
 */
export async function processValidation(job: Job<ValidationPayload>) {
  const { jobId, mcqRecordId, workspaceId } = job.data;
  logger.info({ jobId, mcqRecordId }, 'Starting validation');

  try {

    // C2: Skip if parent job was cancelled
    if (await isJobCancelled(jobId)) return;
    // H2: Update job to validation stage
    await updateJobStage(jobId, 'validating');

  const [record] = await db
    .select()
    .from(mcqRecords)
    .where(eq(mcqRecords.id, mcqRecordId))
    .limit(1);

  if (!record) {
    throw new Error(`MCQ record ${mcqRecordId} not found`);
  }

  const flags: string[] = [];
  const breakdown: Record<string, number> = {};

  // Stage 1: Schema validation
  const schemaScore = validateSchema(record, flags);
  breakdown.schema = schemaScore;

  // Stage 2: Content quality
  const contentScore = validateContent(record, flags);
  breakdown.content = contentScore;

  // Stage 3: Option consistency
  const optionScore = validateOptions(record, flags);
  breakdown.options = optionScore;

  // Stage 4: Answer validity
  const answerScore = validateAnswer(record, flags);
  breakdown.answer = answerScore;

  // Stage 5: Language check
  const languageScore = validateLanguage(record, flags);
  breakdown.language = languageScore;

  // Stage 6: Formatting
  const formattingScore = validateFormatting(record, flags);
  breakdown.formatting = formattingScore;

  // Stage 7: Duplicate detection (lightweight — full detection is separate)
  breakdown.uniqueness = 1.0; // Placeholder; deep duplicate detection is expensive

  // Stage 8: Aggregate confidence
  const weights = {
    schema: 0.20,
    content: 0.20,
    options: 0.15,
    answer: 0.15,
    language: 0.10,
    formatting: 0.10,
    uniqueness: 0.10,
  };

  let aggregatedConfidence = 0;
  for (const [key, weight] of Object.entries(weights)) {
    aggregatedConfidence += (breakdown[key] ?? 0) * weight;
  }

  // Determine hallucination risk tier
  let hallucinationRiskTier = 'low';
  if (aggregatedConfidence < 0.5) hallucinationRiskTier = 'critical';
  else if (aggregatedConfidence < 0.7) hallucinationRiskTier = 'high';
  else if (aggregatedConfidence < 0.85) hallucinationRiskTier = 'medium';

  // Update MCQ record with validation results
  await db.update(mcqRecords).set({
    confidence: aggregatedConfidence,
    confidenceBreakdown: breakdown,
    flags,
    hallucinationRiskTier,
    updatedAt: new Date(),
  }).where(eq(mcqRecords.id, mcqRecordId));

  // Enqueue hallucination detection for medium+ risk
  if (hallucinationRiskTier !== 'low') {
    await enqueue<HallucinationDetectionPayload>(QUEUE_NAMES.HALLUCINATION_DETECTION, {
      jobId,
      mcqRecordId,
      workspaceId,
      sourceText: record.questionText,
    });
  } else {
    // Low risk — go directly to review routing
    await enqueue<ReviewRoutingPayload>(QUEUE_NAMES.REVIEW_ROUTING, {
      jobId,
      mcqRecordId,
      workspaceId,
    });
  }

    logger.info(
      { jobId, mcqRecordId, confidence: aggregatedConfidence, flags, hallucinationRiskTier },
      'Validation complete',
    );
  } catch (err) {
    if (shouldPersistFailure(job)) {
      await markProcessingFailure({ jobId, mcqRecordId, taskType: 'validation', error: err });
    }
    throw err;
  }
}

// ──────────────────────────────────────────────
// Validation Stages
// ──────────────────────────────────────────────

function validateSchema(record: typeof mcqRecords.$inferSelect, flags: string[]): number {
  let score = 1.0;

  if (!record.questionText || record.questionText.trim().length === 0) {
    flags.push('missing_question_text');
    score -= 0.5;
  }

  const options = record.options as Array<{ label: string; text: string }>;
  if (!Array.isArray(options) || options.length === 0) {
    flags.push('missing_options');
    score -= 0.5;
  }

  if (!record.extractionPathway) {
    flags.push('missing_extraction_pathway');
    score -= 0.1;
  }

  return Math.max(0, score);
}

function validateContent(record: typeof mcqRecords.$inferSelect, flags: string[]): number {
  let score = 1.0;
  const text = record.questionText ?? '';

  // Too short
  if (text.length < 10) {
    flags.push('question_too_short');
    score -= 0.3;
  }

  // Too long (potential extraction error)
  if (text.length > 2000) {
    flags.push('question_too_long');
    score -= 0.2;
  }

  const options = record.options as Array<{ label: string; text: string }>;
  if (Array.isArray(options)) {
    // Too few options
    if (options.length < 2) {
      flags.push('too_few_options');
      score -= 0.3;
    }

    // Too many options
    if (options.length > 8) {
      flags.push('too_many_options');
      score -= 0.1;
    }
  }

  return Math.max(0, score);
}

function validateOptions(record: typeof mcqRecords.$inferSelect, flags: string[]): number {
  let score = 1.0;
  const options = record.options as Array<{ label: string; text: string }>;

  if (!Array.isArray(options)) return 0;

  // Check for duplicate option text
  const texts = options.map((o) => (o.text ?? '').trim().toLowerCase());
  const uniqueTexts = new Set(texts);
  if (uniqueTexts.size < texts.length) {
    flags.push('duplicate_options');
    score -= 0.3;
  }

  // Check for empty options
  const emptyOptions = options.filter((o) => !o.text || o.text.trim().length === 0);
  if (emptyOptions.length > 0) {
    flags.push('empty_option_text');
    score -= 0.2;
  }

  // Check for missing labels
  const missingLabels = options.filter((o) => !o.label || o.label.trim().length === 0);
  if (missingLabels.length > 0) {
    flags.push('missing_option_labels');
    score -= 0.1;
  }

  return Math.max(0, score);
}

function validateAnswer(record: typeof mcqRecords.$inferSelect, flags: string[]): number {
  let score = 1.0;
  const correctAnswer = record.correctAnswer;
  const options = record.options as Array<{ label: string; text: string }>;

  if (!correctAnswer) {
    // Missing answer is common for question-only pages
    flags.push('missing_correct_answer');
    score -= 0.2;
    return Math.max(0, score);
  }

  if (Array.isArray(options)) {
    const labels = options.map((o) => (o.label ?? '').trim().toUpperCase());
    if (!labels.includes(correctAnswer.trim().toUpperCase())) {
      flags.push('correct_answer_not_in_options');
      score -= 0.4;
    }
  }

  return Math.max(0, score);
}

function validateLanguage(record: typeof mcqRecords.$inferSelect, flags: string[]): number {
  const text = record.questionText ?? '';

  // Simple heuristic: check for excessive non-Latin characters
  const nonLatinRatio = (text.match(/[^\u0000-\u007F]/g) ?? []).length / Math.max(text.length, 1);
  if (nonLatinRatio > 0.5 && record.language === 'en') {
    flags.push('possible_language_mismatch');
    return 0.5;
  }

  return 1.0;
}

function validateFormatting(record: typeof mcqRecords.$inferSelect, flags: string[]): number {
  let score = 1.0;
  const text = record.questionText ?? '';

  // Check for garbage characters (common OCR artifacts)
  const garbagePatterns = /[\u0000-\u0008\u000E-\u001F\u007F-\u009F]{3,}/;
  if (garbagePatterns.test(text)) {
    flags.push('garbage_characters');
    score -= 0.3;
  }

  // Check for excessive whitespace
  if (/\s{10,}/.test(text)) {
    flags.push('excessive_whitespace');
    score -= 0.1;
  }

  // Check for broken encoding
  if (text.includes('�') || text.includes('\uFFFD')) {
    flags.push('encoding_issues');
    score -= 0.2;
  }

  return Math.max(0, score);
}
