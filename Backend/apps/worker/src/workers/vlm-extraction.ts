import type { Job } from 'bullmq';
import type { VlmExtractionPayload, McqExtractionPayload } from '@mcq-platform/queue';
import { enqueue, QUEUE_NAMES } from '@mcq-platform/queue';
import { db, vlmOutputs, providerConfigs, jobTasks } from '@mcq-platform/db';
import { decryptProviderSecret } from '@mcq-platform/auth';
import { download } from '@mcq-platform/storage';
import { createLogger } from '@mcq-platform/logger';
import { env } from '@mcq-platform/config';
import { eq } from 'drizzle-orm';

const logger = createLogger('worker:vlm-extraction');

/**
 * VLM Extraction Worker
 *
 * Uses Vision-Language Models (Qwen 2.5 VL, GPT-4o Vision)
 * to directly extract MCQs from page images — bypassing OCR.
 */
export async function processVlmExtraction(job: Job<VlmExtractionPayload>) {
  const { jobId, documentPageId, workspaceId, providerConfigId, pageImageS3Key } = job.data;
  logger.info({ jobId, documentPageId, providerConfigId }, 'Starting VLM extraction');

  const startTime = Date.now();

  // Fetch provider config
  const [provider] = await db
    .select()
    .from(providerConfigs)
    .where(eq(providerConfigs.id, providerConfigId))
    .limit(1);

  if (!provider) {
    throw new Error(`Provider config ${providerConfigId} not found`);
  }

  // Download page image
  const { body } = await download(pageImageS3Key);
  const chunks: Buffer[] = [];
  for await (const chunk of body) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  const imageBuffer = Buffer.concat(chunks);
  const base64Image = imageBuffer.toString('base64');

  const apiKey = decryptProviderSecret(provider.apiKeyEncrypted);

  let rawOutput: Record<string, unknown> = {};
  let extractedMcqs: unknown[] = [];
  let confidence = 0;
  let costUsd = 0;

  switch (provider.providerType) {
    case 'qwen_vl':
      ({ rawOutput, extractedMcqs, confidence, costUsd } = await callQwenVl(
        base64Image,
      ));
      break;
    case 'openai':
      ({ rawOutput, extractedMcqs, confidence, costUsd } = await callGpt4oVision(
        apiKey,
        base64Image,
      ));
      break;
    case 'google':
      ({ rawOutput, extractedMcqs, confidence, costUsd } = await callGeminiVision(
        apiKey,
        base64Image,
      ));
      break;
    default:
      throw new Error(`Unsupported VLM provider type: ${provider.providerType}`);
  }

  const latencyMs = Date.now() - startTime;

  // Store VLM output
  const [output] = await db
    .insert(vlmOutputs)
    .values({
      documentPageId,
      providerConfigId,
      rawOutput,
      extractedMcqs,
      confidence,
      costUsd,
      latencyMs,
    })
    .returning({ id: vlmOutputs.id });

  // Create job task record
  await db.insert(jobTasks).values({
    jobId,
    documentPageId,
    taskType: 'vlm_extraction',
    status: 'completed',
    providerConfigId,
    outputData: { vlmOutputId: output.id, mcqCount: extractedMcqs.length },
    latencyMs,
    costUsd,
    completedAt: new Date(),
  });

  // Enqueue MCQ extraction to structure the VLM results
  await enqueue<McqExtractionPayload>(QUEUE_NAMES.MCQ_EXTRACTION, {
    jobId,
    documentPageId,
    workspaceId,
    providerConfigId,
    vlmOutputId: output.id,
  });

  logger.info(
    { jobId, documentPageId, vlmOutputId: output.id, latencyMs, costUsd, mcqCount: extractedMcqs.length },
    'VLM extraction complete',
  );
}

// ──────────────────────────────────────────────
// VLM Provider Calls
// ──────────────────────────────────────────────

const MCQ_EXTRACTION_PROMPT = `You are an expert at extracting multiple-choice questions from exam images.
Extract ALL MCQs from this image. For each question, provide:
- questionNumber: the question number as shown
- questionText: the full question text
- options: array of {label, text} for each choice (A, B, C, D, etc.)
- correctAnswer: the correct answer label if visible
- explanation: any explanation if present

Return a JSON array of extracted questions.`;

async function callQwenVl(
  base64Image: string,
): Promise<{ rawOutput: Record<string, unknown>; extractedMcqs: unknown[]; confidence: number; costUsd: number }> {
  const endpoint = env.QWEN_VL_ENDPOINT;
  const apiKey = env.QWEN_VL_API_KEY;

  if (!endpoint || !apiKey) {
    throw new Error('Qwen VL endpoint/key not configured');
  }

  const response = await fetch(`${endpoint}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'qwen2.5-vl-7b-instruct',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: MCQ_EXTRACTION_PROMPT },
            { type: 'image_url', image_url: { url: `data:image/png;base64,${base64Image}` } },
          ],
        },
      ],
      max_tokens: 4096,
      temperature: 0.1,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Qwen VL failed: ${response.status} ${err}`);
  }

  const result = await response.json() as {
    choices?: Array<{ message?: { content?: string } }>;
    usage?: { total_tokens?: number };
  };

  const content = result.choices?.[0]?.message?.content ?? '[]';
  const mcqs = parseJsonFromResponse(content);

  return {
    rawOutput: result as Record<string, unknown>,
    extractedMcqs: mcqs,
    confidence: 0.85,
    costUsd: estimateCost('qwen_vl', result.usage?.total_tokens ?? 0),
  };
}

async function callGpt4oVision(
  apiKey: string,
  base64Image: string,
): Promise<{ rawOutput: Record<string, unknown>; extractedMcqs: unknown[]; confidence: number; costUsd: number }> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: MCQ_EXTRACTION_PROMPT },
            { type: 'image_url', image_url: { url: `data:image/png;base64,${base64Image}`, detail: 'high' } },
          ],
        },
      ],
      max_tokens: 4096,
      temperature: 0.1,
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`GPT-4o Vision failed: ${response.status} ${err}`);
  }

  const result = await response.json() as {
    choices?: Array<{ message?: { content?: string } }>;
    usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number };
  };

  const content = result.choices?.[0]?.message?.content ?? '[]';
  const mcqs = parseJsonFromResponse(content);
  const totalTokens = result.usage?.total_tokens ?? 0;

  return {
    rawOutput: result as Record<string, unknown>,
    extractedMcqs: mcqs,
    confidence: 0.9,
    costUsd: estimateCost('openai_gpt4o', totalTokens),
  };
}

async function callGeminiVision(
  apiKey: string,
  base64Image: string,
): Promise<{ rawOutput: Record<string, unknown>; extractedMcqs: unknown[]; confidence: number; costUsd: number }> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: MCQ_EXTRACTION_PROMPT },
              { inline_data: { mime_type: 'image/png', data: base64Image } },
            ],
          },
        ],
        generationConfig: { temperature: 0.1, maxOutputTokens: 4096 },
      }),
    },
  );

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Gemini Vision failed: ${response.status} ${err}`);
  }

  const result = await response.json() as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    usageMetadata?: { totalTokenCount?: number };
  };

  const content = result.candidates?.[0]?.content?.parts?.[0]?.text ?? '[]';
  const mcqs = parseJsonFromResponse(content);

  return {
    rawOutput: result as Record<string, unknown>,
    extractedMcqs: mcqs,
    confidence: 0.88,
    costUsd: estimateCost('google_gemini', result.usageMetadata?.totalTokenCount ?? 0),
  };
}

// ──────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────

function parseJsonFromResponse(content: string): unknown[] {
  try {
    // Try direct JSON parse
    const parsed = JSON.parse(content);
    if (Array.isArray(parsed)) return parsed;
    if (parsed.questions && Array.isArray(parsed.questions)) return parsed.questions;
    return [parsed];
  } catch {
    // Try to extract JSON from markdown code blocks
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[1]);
        if (Array.isArray(parsed)) return parsed;
        if (parsed.questions && Array.isArray(parsed.questions)) return parsed.questions;
        return [parsed];
      } catch {
        // Fall through
      }
    }
    logger.warn({ content: content.slice(0, 200) }, 'Failed to parse VLM response as JSON');
    return [];
  }
}

function estimateCost(provider: string, tokens: number): number {
  // Approximate per-token costs (USD)
  const rates: Record<string, number> = {
    openai_gpt4o: 0.000010,    // ~$10 / 1M tokens (blended)
    google: 0.0000025,   // ~$2.5 / 1M tokens
    qwen_vl: 0.000002,          // ~$2 / 1M tokens (self-hosted, compute cost)
  };
  return tokens * (rates[provider] ?? 0.000005);
}
