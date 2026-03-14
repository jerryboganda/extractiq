import { isJobCancelled } from '../lib/job-guard.js';
import type { Job } from 'bullmq';
import type { PageClassificationPayload, OcrExtractionPayload, VlmExtractionPayload } from '@mcq-platform/queue';
import { enqueue, QUEUE_NAMES } from '@mcq-platform/queue';
import { db, documentPages, pageImages, providerConfigs } from '@mcq-platform/db';
import { createLogger } from '@mcq-platform/logger';
import { eq, and } from 'drizzle-orm';
import { markProcessingFailure, shouldPersistFailure } from '../lib/failure-state.js';

const logger = createLogger('worker:page-classification');

/**
 * Page Classification Worker
 * 
 * Determines the processing pathway for each page:
 * - Has text layer → OCR then LLM pathway
 * - Complex visual / no text → VLM direct pathway
 * - Answer key / explanation → different handling
 */
export async function processPageClassification(job: Job<PageClassificationPayload>) {
  const { jobId, documentPageId, workspaceId } = job.data;
  logger.info({ jobId, documentPageId }, 'Classifying page');

  try {
    // C2: Skip if parent job was cancelled
    if (await isJobCancelled(jobId)) return;

    const [page] = await db
      .select()
      .from(documentPages)
      .where(eq(documentPages.id, documentPageId))
      .limit(1);

    if (!page) {
      throw new Error(`Document page ${documentPageId} not found`);
    }

    // Determine routing based on text layer presence
    const hasText = page.textLayerPresent === 'true';
    const routingDecision = hasText ? 'ocr_llm' : 'vlm_direct';

    // Update classification
    await db.update(documentPages).set({
      routingDecision,
      classification: 'question', // Default; could be enhanced with ML
    }).where(eq(documentPages.id, documentPageId));

    // Get workspace provider for the appropriate category
    if (routingDecision === 'ocr_llm') {
    // Find OCR provider
    const [ocrProvider] = await db
      .select()
      .from(providerConfigs)
      .where(and(
        eq(providerConfigs.workspaceId, workspaceId),
        eq(providerConfigs.category, 'ocr'),
        eq(providerConfigs.isEnabled, true),
      ))
      .limit(1);

    if (ocrProvider) {
      await enqueue<OcrExtractionPayload>(QUEUE_NAMES.OCR_EXTRACTION, {
        jobId,
        documentPageId,
        workspaceId,
        providerConfigId: ocrProvider.id,
      });
    } else {
      throw new Error(`No enabled OCR provider configured for workspace ${workspaceId}`);
    }
    } else {
    // VLM direct — need page image
    const [image] = await db
      .select()
      .from(pageImages)
      .where(eq(pageImages.documentPageId, documentPageId))
      .limit(1);

    const [vlmProvider] = await db
      .select()
      .from(providerConfigs)
      .where(and(
        eq(providerConfigs.workspaceId, workspaceId),
        eq(providerConfigs.category, 'vlm'),
        eq(providerConfigs.isEnabled, true),
      ))
      .limit(1);

    if (vlmProvider && image) {
      await enqueue<VlmExtractionPayload>(QUEUE_NAMES.VLM_EXTRACTION, {
        jobId,
        documentPageId,
        workspaceId,
        providerConfigId: vlmProvider.id,
        pageImageS3Key: image.s3Key,
      });
    } else if (!image) {
      throw new Error(`No page image found for page ${documentPageId}`);
    } else {
      throw new Error(`No enabled VLM provider configured for workspace ${workspaceId}`);
    }
    }

    logger.info({ jobId, documentPageId, routingDecision }, 'Page classified');
  } catch (err) {
    if (shouldPersistFailure(job)) {
      await markProcessingFailure({ jobId, documentPageId, taskType: 'page_classification', error: err });
    }
    throw err;
  }
}
