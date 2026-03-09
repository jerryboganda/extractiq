import { createLogger } from '@mcq-platform/logger';
import { closeDb } from '@mcq-platform/db';
import { closeAllQueues, createWorker, QUEUE_NAMES } from '@mcq-platform/queue';
import type { Worker } from 'bullmq';

import { processDocumentPreprocessing } from './workers/document-preprocessing.js';
import { processPageClassification } from './workers/page-classification.js';
import { processOcrExtraction } from './workers/ocr-extraction.js';
import { processVlmExtraction } from './workers/vlm-extraction.js';
import { processTextSegmentation } from './workers/text-segmentation.js';
import { processMcqExtraction } from './workers/mcq-extraction.js';
import { processValidation } from './workers/validation.js';
import { processHallucinationDetection } from './workers/hallucination-detection.js';
import { processReviewRouting } from './workers/review-routing.js';
import { processExportGeneration } from './workers/export-generation.js';
import { processProviderHealthCheck } from './workers/provider-health-check.js';
import { processNotification } from './workers/notification.js';

const logger = createLogger('worker');

const workers: Worker[] = [];

function startWorkers() {
  logger.info('Starting all workers...');

  workers.push(
    createWorker(QUEUE_NAMES.DOCUMENT_PREPROCESSING, processDocumentPreprocessing),
    createWorker(QUEUE_NAMES.PAGE_CLASSIFICATION, processPageClassification),
    createWorker(QUEUE_NAMES.OCR_EXTRACTION, processOcrExtraction),
    createWorker(QUEUE_NAMES.VLM_EXTRACTION, processVlmExtraction),
    createWorker(QUEUE_NAMES.TEXT_SEGMENTATION, processTextSegmentation),
    createWorker(QUEUE_NAMES.MCQ_EXTRACTION, processMcqExtraction),
    createWorker(QUEUE_NAMES.VALIDATION, processValidation),
    createWorker(QUEUE_NAMES.HALLUCINATION_DETECTION, processHallucinationDetection),
    createWorker(QUEUE_NAMES.REVIEW_ROUTING, processReviewRouting),
    createWorker(QUEUE_NAMES.EXPORT_GENERATION, processExportGeneration),
    createWorker(QUEUE_NAMES.PROVIDER_HEALTH_CHECK, processProviderHealthCheck),
    createWorker(QUEUE_NAMES.NOTIFICATION, processNotification),
  );

  logger.info({ count: workers.length }, 'All workers started');
}

async function shutdown(signal: string) {
  logger.info({ signal }, 'Shutdown signal received');

  // Close all workers gracefully
  await Promise.all(workers.map((w) => w.close()));
  await closeAllQueues();
  await closeDb();

  logger.info('All workers stopped, exiting');
  process.exit(0);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

startWorkers();
