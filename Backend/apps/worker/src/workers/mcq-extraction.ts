import type { Job } from 'bullmq';
import type { McqExtractionPayload, ValidationPayload } from '@mcq-platform/queue';
import { enqueue, QUEUE_NAMES } from '@mcq-platform/queue';
import {
  db,
  segments,
  vlmOutputs,
  providerConfigs,
  documentPages,
  documents,
  mcqRecords,
  jobTasks,
} from '@mcq-platform/db';
import { createLogger } from '@mcq-platform/logger';
import { env } from '@mcq-platform/config';
import { eq, inArray } from 'drizzle-orm';
import crypto from 'node:crypto';

const logger = createLogger('worker:mcq-extraction');

/**
 * MCQ Extraction Worker
 *
 * Takes segments (from OCR path) or VLM output (from VLM path) and
 * calls an LLM to produce structured MCQ records. Supports:
 * - OpenAI GPT-4o
 * - Anthropic Claude 3.5 Sonnet
 * - Google Gemini
 */
export async function processMcqExtraction(job: Job<McqExtractionPayload>) {
  const { jobId, documentPageId, workspaceId, providerConfigId, segmentIds, vlmOutputId } = job.data;
  logger.info({ jobId, documentPageId, providerConfigId }, 'Starting MCQ extraction');

  const startTime = Date.now();

  // Fetch provider
  const [provider] = await db
    .select()
    .from(providerConfigs)
    .where(eq(providerConfigs.id, providerConfigId))
    .limit(1);

  if (!provider) {
    throw new Error(`Provider config ${providerConfigId} not found`);
  }

  // Get page + document context
  const [page] = await db
    .select()
    .from(documentPages)
    .where(eq(documentPages.id, documentPageId))
    .limit(1);

  if (!page) {
    throw new Error(`Document page ${documentPageId} not found`);
  }

  const [document] = await db
    .select()
    .from(documents)
    .where(eq(documents.id, page.documentId))
    .limit(1);

  // Gather input text
  let inputText = '';
  let extractionPathway: 'ocr_then_llm' | 'vlm_direct' = 'ocr_then_llm';

  if (vlmOutputId) {
    // VLM pathway — use VLM output as structured input
    extractionPathway = 'vlm_direct';
    const [vlmOutput] = await db
      .select()
      .from(vlmOutputs)
      .where(eq(vlmOutputs.id, vlmOutputId))
      .limit(1);

    if (vlmOutput?.extractedMcqs) {
      inputText = JSON.stringify(vlmOutput.extractedMcqs);
    }
  } else if (segmentIds && segmentIds.length > 0) {
    // OCR pathway — combine segments
    const segs = await db
      .select()
      .from(segments)
      .where(inArray(segments.id, segmentIds));

    inputText = segs.map((s) => s.rawText).join('\n\n---\n\n');
  }

  if (!inputText.trim()) {
    logger.warn({ jobId, documentPageId }, 'No input text for MCQ extraction');
    return;
  }

  const apiKey = decryptApiKey(provider.apiKeyEncrypted);

  // Call LLM
  let extractedMcqs: ExtractedMcq[] = [];
  let costUsd = 0;

  switch (provider.providerType) {
    case 'openai':
      ({ mcqs: extractedMcqs, costUsd } = await callOpenAi(apiKey, inputText, extractionPathway));
      break;
    case 'anthropic':
      ({ mcqs: extractedMcqs, costUsd } = await callAnthropic(apiKey, inputText, extractionPathway));
      break;
    case 'google_gemini':
      ({ mcqs: extractedMcqs, costUsd } = await callGemini(apiKey, inputText, extractionPathway));
      break;
    default:
      throw new Error(`Unsupported LLM provider type: ${provider.providerType}`);
  }

  const latencyMs = Date.now() - startTime;

  // Insert MCQ records into DB
  const insertedRecords: string[] = [];

  for (const mcq of extractedMcqs) {
    const [record] = await db
      .insert(mcqRecords)
      .values({
        workspaceId,
        projectId: document?.projectId ?? '',
        documentId: page.documentId,
        jobId,
        sourcePage: page.pageNumber,
        questionNumber: mcq.questionNumber ?? null,
        questionText: mcq.questionText,
        options: mcq.options,
        correctAnswer: mcq.correctAnswer ?? null,
        explanation: mcq.explanation ?? null,
        questionType: mcq.questionType ?? 'single_choice',
        subject: mcq.subject ?? null,
        topic: mcq.topic ?? null,
        difficulty: mcq.difficulty ?? null,
        language: 'en',
        extractionPathway,
        providerUsed: provider.providerType,
        modelUsed: getModelName(provider.providerType),
        confidence: mcq.confidence ?? 0.8,
        confidenceBreakdown: {},
        costAttribution: { extractionCost: costUsd / Math.max(extractedMcqs.length, 1) },
      })
      .returning({ id: mcqRecords.id });

    insertedRecords.push(record.id);
  }

  // Create job task record
  await db.insert(jobTasks).values({
    jobId,
    documentPageId,
    taskType: 'mcq_extraction',
    status: 'completed',
    providerConfigId,
    outputData: { mcqRecordIds: insertedRecords, count: insertedRecords.length },
    latencyMs,
    costUsd,
    completedAt: new Date(),
  });

  // Enqueue validation for each MCQ
  for (const mcqId of insertedRecords) {
    await enqueue<ValidationPayload>(QUEUE_NAMES.VALIDATION, {
      jobId,
      mcqRecordId: mcqId,
      workspaceId,
    });
  }

  logger.info(
    { jobId, documentPageId, mcqCount: insertedRecords.length, latencyMs, costUsd },
    'MCQ extraction complete',
  );
}

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

interface ExtractedMcq {
  questionNumber?: string;
  questionText: string;
  options: Array<{ label: string; text: string }>;
  correctAnswer?: string;
  explanation?: string;
  questionType?: string;
  subject?: string;
  topic?: string;
  difficulty?: string;
  confidence?: number;
}

// ──────────────────────────────────────────────
// LLM Provider Calls
// ──────────────────────────────────────────────

const STRUCTURING_PROMPT = `You are an expert at extracting and structuring multiple-choice questions from educational content.

Given the following text content extracted from an exam document, produce a JSON array of structured MCQ objects.

Each MCQ object MUST have:
- "questionNumber": string (the detected question number)
- "questionText": string (complete question text without the number)
- "options": array of {"label": "A"|"B"|"C"|"D"|..., "text": "option text"}
- "correctAnswer": string (the correct option label, or null if not shown)
- "explanation": string (explanation if present, or null)
- "questionType": "single_choice" | "multiple_choice" | "true_false"
- "subject": string or null (detected subject area)
- "topic": string or null (detected topic)
- "difficulty": "easy" | "medium" | "hard" or null
- "confidence": number 0-1 (your confidence in the extraction quality)

RULES:
- Preserve ALL original text exactly — do not rephrase or modify question/option text.
- If the answer key is on a separate page, set correctAnswer to null.
- Return ONLY valid JSON. No markdown, no explanation outside JSON.`;

async function callOpenAi(
  apiKey: string,
  inputText: string,
  pathway: string,
): Promise<{ mcqs: ExtractedMcq[]; costUsd: number }> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: STRUCTURING_PROMPT },
        { role: 'user', content: `Extraction pathway: ${pathway}\n\nContent:\n${inputText}` },
      ],
      max_tokens: 4096,
      temperature: 0.1,
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`OpenAI failed: ${response.status} ${err}`);
  }

  const result = await response.json() as {
    choices?: Array<{ message?: { content?: string } }>;
    usage?: { total_tokens?: number };
  };

  const content = result.choices?.[0]?.message?.content ?? '[]';
  const mcqs = parseExtractedMcqs(content);
  const totalTokens = result.usage?.total_tokens ?? 0;

  return { mcqs, costUsd: totalTokens * 0.000010 };
}

async function callAnthropic(
  apiKey: string,
  inputText: string,
  pathway: string,
): Promise<{ mcqs: ExtractedMcq[]; costUsd: number }> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: STRUCTURING_PROMPT,
      messages: [
        { role: 'user', content: `Extraction pathway: ${pathway}\n\nContent:\n${inputText}` },
      ],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Anthropic failed: ${response.status} ${err}`);
  }

  const result = await response.json() as {
    content?: Array<{ text?: string }>;
    usage?: { input_tokens?: number; output_tokens?: number };
  };

  const content = result.content?.[0]?.text ?? '[]';
  const mcqs = parseExtractedMcqs(content);
  const inputTokens = result.usage?.input_tokens ?? 0;
  const outputTokens = result.usage?.output_tokens ?? 0;

  return { mcqs, costUsd: inputTokens * 0.000003 + outputTokens * 0.000015 };
}

async function callGemini(
  apiKey: string,
  inputText: string,
  pathway: string,
): Promise<{ mcqs: ExtractedMcq[]; costUsd: number }> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: `${STRUCTURING_PROMPT}\n\nExtraction pathway: ${pathway}\n\nContent:\n${inputText}` },
            ],
          },
        ],
        generationConfig: { temperature: 0.1, maxOutputTokens: 4096 },
      }),
    },
  );

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Gemini failed: ${response.status} ${err}`);
  }

  const result = await response.json() as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    usageMetadata?: { totalTokenCount?: number };
  };

  const content = result.candidates?.[0]?.content?.parts?.[0]?.text ?? '[]';
  const mcqs = parseExtractedMcqs(content);

  return { mcqs, costUsd: (result.usageMetadata?.totalTokenCount ?? 0) * 0.0000025 };
}

// ──────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────

function parseExtractedMcqs(content: string): ExtractedMcq[] {
  try {
    const parsed = JSON.parse(content);
    const arr = Array.isArray(parsed) ? parsed : (parsed.questions ?? parsed.mcqs ?? [parsed]);
    return arr.filter((q: Record<string, unknown>) => q.questionText && q.options);
  } catch {
    // Try extracting from code block
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[1]);
        const arr = Array.isArray(parsed) ? parsed : (parsed.questions ?? parsed.mcqs ?? [parsed]);
        return arr.filter((q: Record<string, unknown>) => q.questionText && q.options);
      } catch {
        // Fall through
      }
    }
    logger.warn({ content: content.slice(0, 200) }, 'Failed to parse LLM MCQ response');
    return [];
  }
}

function getModelName(providerType: string): string {
  const models: Record<string, string> = {
    openai: 'gpt-4o',
    anthropic: 'claude-3.5-sonnet',
    google_gemini: 'gemini-2.0-flash',
  };
  return models[providerType] ?? providerType;
}

function decryptApiKey(encrypted: string): string {
  const [ivHex, authTagHex, cipherTextHex] = encrypted.split(':');
  if (!ivHex || !authTagHex || !cipherTextHex) {
    throw new Error('Invalid encrypted API key format');
  }

  const key = Buffer.from(env.ENCRYPTION_KEY, 'hex');
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const cipherText = Buffer.from(cipherTextHex, 'hex');

  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(cipherText, undefined, 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}
