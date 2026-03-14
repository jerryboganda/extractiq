import type { Job } from 'bullmq';
import type { PageClassificationPayload, OcrExtractionPayload, VlmExtractionPayload } from '@mcq-platform/queue';
import { enqueue, QUEUE_NAMES } from '@mcq-platform/queue';
import { db, documentPages, pageImages, providerConfigs } from '@mcq-platform/db';
import { createLogger } from '@mcq-platform/logger';
import { eq, and } from 'drizzle-orm';

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

  const [page] = await db
    .select()
    .from(documentPages)
    .where(eq(documentPages.id, documentPageId))
    .limit(1);

  if (!page) {
    logger.error({ documentPageId }, 'Page not found');
    return;
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
    }
  }

  logger.info({ jobId, documentPageId, routingDecision }, 'Page classified');
}
