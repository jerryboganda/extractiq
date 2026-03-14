import type { Job } from 'bullmq';
import type { DocumentPreprocessingPayload } from '@mcq-platform/queue';
import { enqueue, QUEUE_NAMES, type PageClassificationPayload } from '@mcq-platform/queue';
import { db, documents, documentPages, pageImages } from '@mcq-platform/db';
import { download } from '@mcq-platform/storage';
import { upload, buildPageImageKey } from '@mcq-platform/storage';
import { createLogger } from '@mcq-platform/logger';
import { eq } from 'drizzle-orm';

const logger = createLogger('worker:document-preprocessing');

/**
 * Document Preprocessing Worker
 * 
 * 1. Downloads the document from S3
 * 2. Detects format (PDF, image, etc.)
 * 3. Splits PDF into pages
 * 4. Renders page images (for VLM pathway)
 * 5. Extracts text layer if present
 * 6. Creates DocumentPage + PageImage records
 * 7. Enqueues page classification for each page
 */
export async function processDocumentPreprocessing(job: Job<DocumentPreprocessingPayload>) {
  const { jobId, documentId, workspaceId, s3Key } = job.data;
  logger.info({ jobId, documentId }, 'Starting document preprocessing');

  try {
    // Download document
    const { body, contentType } = await download(s3Key);
    const chunks: Buffer[] = [];
    for await (const chunk of body) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    const buffer = Buffer.concat(chunks);

    let pageCount = 1;
    const isPdf = contentType?.includes('pdf') || s3Key.endsWith('.pdf');

    if (isPdf) {
      // Dynamic import pdf-parse
      const pdfParse = (await import('pdf-parse')).default;
      const pdfData = await pdfParse(buffer);
      pageCount = pdfData.numpages;

      // Create page records
      for (let i = 1; i <= pageCount; i++) {
        const [page] = await db.insert(documentPages).values({
          documentId,
          pageNumber: i,
          pageType: 'question',
          textLayerPresent: pdfData.text.length > 0 ? 'true' : 'false',
          routingDecision: pdfData.text.length > 0 ? 'ocr_llm' : 'vlm_direct',
          rawText: null, // Will be populated by OCR
        }).returning();

        // Enqueue page classification
        await enqueue<PageClassificationPayload>(QUEUE_NAMES.PAGE_CLASSIFICATION, {
          jobId,
          documentId,
          documentPageId: page.id,
          workspaceId,
        });
      }
    } else {
      // Single image document
      const [page] = await db.insert(documentPages).values({
        documentId,
        pageNumber: 1,
        pageType: 'question',
        textLayerPresent: 'false',
        routingDecision: 'vlm_direct',
      }).returning();

      // Store image as page image
      const format = s3Key.split('.').pop() ?? 'png';
      const pageImageKey = buildPageImageKey(workspaceId, documentId, 1, format);
      await upload({ key: pageImageKey, body: buffer, contentType: contentType ?? 'image/png' });

      await db.insert(pageImages).values({
        documentPageId: page.id,
        s3Key: pageImageKey,
        dpi: 300,
        width: 0,
        height: 0,
        format,
      });

      await enqueue<PageClassificationPayload>(QUEUE_NAMES.PAGE_CLASSIFICATION, {
        jobId,
        documentId,
        documentPageId: page.id,
        workspaceId,
      });
    }

    // Update document
    await db.update(documents).set({
      pageCount,
      status: 'processing',
    }).where(eq(documents.id, documentId));

    logger.info({ jobId, documentId, pageCount }, 'Document preprocessing complete');
  } catch (err) {
    logger.error({ jobId, documentId, err }, 'Document preprocessing failed');
    await db.update(documents).set({ status: 'failed' }).where(eq(documents.id, documentId));
    throw err;
  }
}
