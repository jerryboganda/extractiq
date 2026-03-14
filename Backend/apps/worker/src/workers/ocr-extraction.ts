import type { Job } from 'bullmq';
import type { OcrExtractionPayload, TextSegmentationPayload } from '@mcq-platform/queue';
import { enqueue, QUEUE_NAMES } from '@mcq-platform/queue';
import { db, documentPages, ocrArtifacts, providerConfigs, jobTasks } from '@mcq-platform/db';
import { decryptProviderSecret } from '@mcq-platform/auth';
import { createLogger } from '@mcq-platform/logger';
import { env } from '@mcq-platform/config';
import { eq } from 'drizzle-orm';

const logger = createLogger('worker:ocr-extraction');

/**
 * OCR Extraction Worker
 *
 * Calls configured OCR provider (Mistral OCR, GLM-OCR) to extract
 * raw text + markdown from a document page, then stores the artifact
 * and enqueues text segmentation.
 */
export async function processOcrExtraction(job: Job<OcrExtractionPayload>) {
  const { jobId, documentPageId, workspaceId, providerConfigId } = job.data;
  logger.info({ jobId, documentPageId, providerConfigId }, 'Starting OCR extraction');

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

  // Fetch the page's raw text (from PDF text layer if available)
  const [page] = await db
    .select()
    .from(documentPages)
    .where(eq(documentPages.id, documentPageId))
    .limit(1);

  if (!page) {
    throw new Error(`Document page ${documentPageId} not found`);
  }

  // Decrypt API key
  const apiKey = decryptProviderSecret(provider.apiKeyEncrypted);

  // Call the appropriate OCR provider
  let rawText = '';
  let markdownText = '';
  let confidence = 0;

  switch (provider.providerType) {
    case 'mistral':
      ({ rawText, markdownText, confidence } = await callMistralOcr(
        apiKey,
        page.rawText ?? '',
        page.id,
      ));
      break;
    case 'glm_ocr':
      ({ rawText, markdownText, confidence } = await callGlmOcr(
        page.rawText ?? '',
        page.id,
      ));
      break;
    default:
      // Fallback: use the text layer directly if available
      rawText = page.rawText ?? '';
      markdownText = rawText;
      confidence = rawText.length > 0 ? 0.85 : 0;
  }

  const latencyMs = Date.now() - startTime;

  // Store OCR artifact
  const [artifact] = await db
    .insert(ocrArtifacts)
    .values({
      documentPageId,
      providerConfigId,
      rawText,
      markdownText,
      confidence,
      latencyMs,
    })
    .returning({ id: ocrArtifacts.id });

  // Create job task record
  await db.insert(jobTasks).values({
    jobId,
    documentPageId,
    taskType: 'ocr_extraction',
    status: 'completed',
    providerConfigId,
    outputData: { ocrArtifactId: artifact.id },
    latencyMs,
    completedAt: new Date(),
  });

  // Enqueue text segmentation
  await enqueue<TextSegmentationPayload>(QUEUE_NAMES.TEXT_SEGMENTATION, {
    jobId,
    documentPageId,
    workspaceId,
    ocrArtifactId: artifact.id,
  });

  logger.info(
    { jobId, documentPageId, ocrArtifactId: artifact.id, latencyMs, confidence },
    'OCR extraction complete',
  );
}

// ──────────────────────────────────────────────
// Provider-specific OCR calls
// ──────────────────────────────────────────────

async function callMistralOcr(
  apiKey: string,
  existingText: string,
  _pageId: string,
): Promise<{ rawText: string; markdownText: string; confidence: number }> {
  // Use Mistral OCR Latest API
  const response = await fetch('https://api.mistral.ai/v1/ocr', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'mistral-ocr-latest',
      document: { type: 'text', text: existingText },
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Mistral OCR failed: ${response.status} ${err}`);
  }

  const result = await response.json() as {
    text?: string;
    markdown?: string;
    confidence?: number;
  };

  return {
    rawText: result.text ?? existingText,
    markdownText: result.markdown ?? result.text ?? existingText,
    confidence: result.confidence ?? 0.9,
  };
}

async function callGlmOcr(
  existingText: string,
  _pageId: string,
): Promise<{ rawText: string; markdownText: string; confidence: number }> {
  const endpoint = env.GLM_OCR_ENDPOINT;
  const apiKey = env.GLM_OCR_API_KEY;

  if (!endpoint || !apiKey) {
    // Fallback to text layer
    return { rawText: existingText, markdownText: existingText, confidence: 0.7 };
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text: existingText,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`GLM OCR failed: ${response.status} ${err}`);
  }

  const result = await response.json() as {
    text?: string;
    markdown?: string;
    confidence?: number;
  };

  return {
    rawText: result.text ?? existingText,
    markdownText: result.markdown ?? existingText,
    confidence: result.confidence ?? 0.85,
  };
}

// ──────────────────────────────────────────────
// Decrypt provider API key (AES-256-GCM)
// ──────────────────────────────────────────────

