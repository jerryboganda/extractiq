import { isJobCancelled } from '../lib/job-guard.js';
import type { Job } from 'bullmq';
import type { HallucinationDetectionPayload, ReviewRoutingPayload } from '@mcq-platform/queue';
import { enqueue, QUEUE_NAMES } from '@mcq-platform/queue';
import { db, mcqRecords, hallucinationEvents } from '@mcq-platform/db';
import { createLogger } from '@mcq-platform/logger';
import { eq } from 'drizzle-orm';
import { markProcessingFailure, shouldPersistFailure } from '../lib/failure-state.js';

const logger = createLogger('worker:hallucination-detection');

/**
 * Hallucination Detection Worker
 *
 * 3-tier detection system:
 * Tier 1: Rule-based checks (fast, deterministic)
 * Tier 2: Cross-reference checks (compare against source)
 * Tier 3: Semantic analysis (LLM-based, expensive)
 *
 * Only Tier 1+2 run by default. Tier 3 is reserved for critical cases.
 */
export async function processHallucinationDetection(job: Job<HallucinationDetectionPayload>) {
  const { jobId, mcqRecordId, workspaceId, sourceText } = job.data;
  logger.info({ jobId, mcqRecordId }, 'Starting hallucination detection');

  try {

    // C2: Skip if parent job was cancelled
    if (await isJobCancelled(jobId)) return;

  const [record] = await db
    .select()
    .from(mcqRecords)
    .where(eq(mcqRecords.id, mcqRecordId))
    .limit(1);

  if (!record) {
    throw new Error(`MCQ record ${mcqRecordId} not found`);
  }

  const detections: Detection[] = [];

  // ── Tier 1: Rule-based checks ──
  detections.push(...runTier1Rules(record));

  // ── Tier 2: Cross-reference with source text ──
  detections.push(...runTier2CrossReference(record, sourceText));

  // Store hallucination events
  if (detections.length > 0) {
    await db.insert(hallucinationEvents).values(
      detections.map((d) => ({
        mcqRecordId,
        detectionTier: d.tier,
        detectionRule: d.rule,
        severity: d.severity,
        details: d.details,
      })),
    );
  }

  // Update risk tier based on detections
  const maxSeverity = getMaxSeverity(detections);
  if (maxSeverity) {
    await db.update(mcqRecords).set({
      hallucinationRiskTier: maxSeverity,
      updatedAt: new Date(),
    }).where(eq(mcqRecords.id, mcqRecordId));
  }

  // Always proceed to review routing
  await enqueue<ReviewRoutingPayload>(QUEUE_NAMES.REVIEW_ROUTING, {
    jobId,
    mcqRecordId,
    workspaceId,
  });

    logger.info(
      { jobId, mcqRecordId, detectionCount: detections.length, maxSeverity },
      'Hallucination detection complete',
    );
  } catch (err) {
    if (shouldPersistFailure(job)) {
      await markProcessingFailure({ jobId, mcqRecordId, taskType: 'hallucination_detection', error: err });
    }
    throw err;
  }
}

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

interface Detection {
  tier: string;
  rule: string;
  severity: string;
  details: Record<string, unknown>;
}

// ──────────────────────────────────────────────
// Tier 1: Rule-based checks
// ──────────────────────────────────────────────

function runTier1Rules(record: typeof mcqRecords.$inferSelect): Detection[] {
  const detections: Detection[] = [];
  const text = record.questionText ?? '';
  const options = record.options as Array<{ label: string; text: string }>;

  // Rule 1: Self-referential question (question mentions its own answer)
  if (record.correctAnswer && text.toLowerCase().includes(`answer is ${record.correctAnswer.toLowerCase()}`)) {
    detections.push({
      tier: 'tier_1',
      rule: 'self_referential_answer',
      severity: 'medium',
      details: { correctAnswer: record.correctAnswer },
    });
  }

  // Rule 2: All options are identical
  if (Array.isArray(options) && options.length > 1) {
    const texts = options.map((o) => (o.text ?? '').trim().toLowerCase());
    const unique = new Set(texts);
    if (unique.size === 1) {
      detections.push({
        tier: 'tier_1',
        rule: 'identical_options',
        severity: 'critical',
        details: { optionCount: options.length },
      });
    }
  }

  // Rule 3: Question is just a number or too short
  if (text.trim().length < 5) {
    detections.push({
      tier: 'tier_1',
      rule: 'trivial_question',
      severity: 'high',
      details: { questionLength: text.length },
    });
  }

  // Rule 4: Options contain question text verbatim (potential extraction error)
  if (Array.isArray(options)) {
    for (const opt of options) {
      if (opt.text && opt.text.length > 20 && text.includes(opt.text)) {
        detections.push({
          tier: 'tier_1',
          rule: 'option_contains_question',
          severity: 'medium',
          details: { optionLabel: opt.label },
        });
        break;
      }
    }
  }

  // Rule 5: Confidence breakdown flags
  const flags = record.flags as string[];
  if (Array.isArray(flags) && flags.length >= 3) {
    detections.push({
      tier: 'tier_1',
      rule: 'multiple_validation_flags',
      severity: 'medium',
      details: { flagCount: flags.length, flags },
    });
  }

  return detections;
}

// ──────────────────────────────────────────────
// Tier 2: Cross-reference with source
// ──────────────────────────────────────────────

function runTier2CrossReference(
  record: typeof mcqRecords.$inferSelect,
  sourceText: string,
): Detection[] {
  const detections: Detection[] = [];

  if (!sourceText || sourceText.trim().length === 0) {
    return detections;
  }

  const questionText = (record.questionText ?? '').toLowerCase();
  const sourceLower = sourceText.toLowerCase();

  // Check if key phrases from the question appear in source
  const words = questionText.split(/\s+/).filter((w) => w.length > 4);
  if (words.length > 0) {
    const foundInSource = words.filter((w) => sourceLower.includes(w));
    const overlapRatio = foundInSource.length / words.length;

    if (overlapRatio < 0.3) {
      detections.push({
        tier: 'tier_2',
        rule: 'low_source_overlap',
        severity: 'high',
        details: { overlapRatio, checkedWords: words.length, foundWords: foundInSource.length },
      });
    }
  }

  // Check options against source
  const options = record.options as Array<{ label: string; text: string }>;
  if (Array.isArray(options)) {
    let optionsNotInSource = 0;
    for (const opt of options) {
      const optWords = (opt.text ?? '').toLowerCase().split(/\s+/).filter((w) => w.length > 4);
      if (optWords.length > 0) {
        const found = optWords.filter((w) => sourceLower.includes(w));
        if (found.length / optWords.length < 0.2) {
          optionsNotInSource++;
        }
      }
    }

    if (optionsNotInSource > options.length / 2) {
      detections.push({
        tier: 'tier_2',
        rule: 'options_not_in_source',
        severity: 'medium',
        details: { optionsNotInSource, totalOptions: options.length },
      });
    }
  }

  return detections;
}

// ──────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────

function getMaxSeverity(detections: Detection[]): string | null {
  const severityOrder = ['critical', 'high', 'medium', 'low'];
  for (const sev of severityOrder) {
    if (detections.some((d) => d.severity === sev)) {
      return sev;
    }
  }
  return null;
}
