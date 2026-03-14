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

const SHUTDOWN_TIMEOUT_MS = parseInt(process.env.WORKER_SHUTDOWN_TIMEOUT_MS ?? '30000', 10);

const workers: Worker[] = [];
let isShuttingDown = false;

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
  if (isShuttingDown) {
    logger.warn('Shutdown already in progress, ignoring signal');
    return;
  }
  
  isShuttingDown = true;
  logger.info({ signal, timeoutMs: SHUTDOWN_TIMEOUT_MS }, 'Shutdown signal received');
  
  try {
    logger.info('Closing workers and waiting for active jobs to finish...');
    await Promise.race([
      Promise.all(workers.map(async (worker, index) => {
        try {
          await worker.close();
        } catch (err) {
          logger.error({ workerIndex: index, err }, 'Error closing worker');
        }
      })),
      new Promise((_, reject) => {
        setTimeout(() => reject(new Error(`Worker shutdown timed out after ${SHUTDOWN_TIMEOUT_MS}ms`)), SHUTDOWN_TIMEOUT_MS);
      }),
    ]);
    
    logger.info('Closing queues...');
    await closeAllQueues();
    
    logger.info('Closing database connection...');
    await closeDb();
    
    logger.info('Shutdown complete, exiting');
    process.exit(0);
  } catch (err) {
    logger.error({ err }, 'Error during shutdown');
    process.exit(1);
  }
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

startWorkers();
