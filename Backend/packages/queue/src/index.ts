import { Queue, Worker, type ConnectionOptions, type WorkerOptions } from 'bullmq';
import IORedis from 'ioredis';
import { env } from '@mcq-platform/config';
import { createLogger } from '@mcq-platform/logger';

const logger = createLogger('queue');

// ──────────────────────────────────────────────
// Redis Connection
// ──────────────────────────────────────────────

function createRedisConnection(): IORedis {
  return new IORedis(env.REDIS_URL, {
    maxRetriesPerRequest: null, // Required by BullMQ
    enableReadyCheck: false,
  });
}

const connection: ConnectionOptions = {
  host: new URL(env.REDIS_URL.replace(/^redis:/, 'http:')).hostname,
  port: parseInt(new URL(env.REDIS_URL.replace(/^redis:/, 'http:')).port || '6379'),
};

// ──────────────────────────────────────────────
// Queue Definitions — 12 specialized queues
// ──────────────────────────────────────────────

export const QUEUE_NAMES = {
  DOCUMENT_PREPROCESSING: 'document-preprocessing',
  PAGE_CLASSIFICATION: 'page-classification',
  OCR_EXTRACTION: 'ocr-extraction',
  VLM_EXTRACTION: 'vlm-extraction',
  TEXT_SEGMENTATION: 'text-segmentation',
  MCQ_EXTRACTION: 'mcq-extraction',
  VALIDATION: 'validation',
  HALLUCINATION_DETECTION: 'hallucination-detection',
  REVIEW_ROUTING: 'review-routing',
  EXPORT_GENERATION: 'export-generation',
  PROVIDER_HEALTH_CHECK: 'provider-health-check',
  NOTIFICATION: 'notification',
} as const;

export type QueueName = (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES];

// ──────────────────────────────────────────────
// Job Payload Types
// ──────────────────────────────────────────────

export interface DocumentPreprocessingPayload {
  jobId: string;
  documentId: string;
  workspaceId: string;
  s3Key: string;
}

export interface PageClassificationPayload {
  jobId: string;
  documentId: string;
  documentPageId: string;
  workspaceId: string;
}

export interface OcrExtractionPayload {
  jobId: string;
  documentPageId: string;
  workspaceId: string;
  providerConfigId: string;
}

export interface VlmExtractionPayload {
  jobId: string;
  documentPageId: string;
  workspaceId: string;
  providerConfigId: string;
  pageImageS3Key: string;
}

export interface TextSegmentationPayload {
  jobId: string;
  documentPageId: string;
  workspaceId: string;
  ocrArtifactId: string;
}

export interface McqExtractionPayload {
  jobId: string;
  documentPageId: string;
  workspaceId: string;
  providerConfigId: string;
  segmentIds?: string[];
  vlmOutputId?: string;
}

export interface ValidationPayload {
  jobId: string;
  mcqRecordId: string;
  workspaceId: string;
}

export interface HallucinationDetectionPayload {
  jobId: string;
  mcqRecordId: string;
  workspaceId: string;
  sourceText: string;
}

export interface ReviewRoutingPayload {
  jobId: string;
  mcqRecordId: string;
  workspaceId: string;
}

export interface ExportGenerationPayload {
  exportJobId: string;
  workspaceId: string;
  projectId: string;
  format: string;
  scope: Record<string, unknown>;
}

export interface ProviderHealthCheckPayload {
  providerConfigId: string;
  workspaceId: string;
}

export interface NotificationPayload {
  workspaceId: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  data?: Record<string, unknown>;
}

// ──────────────────────────────────────────────
// Queue Configuration (concurrency + retry)
// ──────────────────────────────────────────────

interface QueueConfig {
  concurrency: number;
  maxRetries: number;
  backoffType: 'exponential' | 'fixed';
  backoffDelay: number; // ms
}

export const QUEUE_CONFIG: Record<QueueName, QueueConfig> = {
  [QUEUE_NAMES.DOCUMENT_PREPROCESSING]: {
    concurrency: 5,
    maxRetries: 3,
    backoffType: 'exponential',
    backoffDelay: 5000,
  },
  [QUEUE_NAMES.PAGE_CLASSIFICATION]: {
    concurrency: 10,
    maxRetries: 2,
    backoffType: 'exponential',
    backoffDelay: 3000,
  },
  [QUEUE_NAMES.OCR_EXTRACTION]: {
    concurrency: 8,
    maxRetries: 3,
    backoffType: 'exponential',
    backoffDelay: 5000,
  },
  [QUEUE_NAMES.VLM_EXTRACTION]: {
    concurrency: 4,
    maxRetries: 3,
    backoffType: 'exponential',
    backoffDelay: 10000,
  },
  [QUEUE_NAMES.TEXT_SEGMENTATION]: {
    concurrency: 10,
    maxRetries: 2,
    backoffType: 'fixed',
    backoffDelay: 2000,
  },
  [QUEUE_NAMES.MCQ_EXTRACTION]: {
    concurrency: 6,
    maxRetries: 3,
    backoffType: 'exponential',
    backoffDelay: 5000,
  },
  [QUEUE_NAMES.VALIDATION]: {
    concurrency: 15,
    maxRetries: 2,
    backoffType: 'fixed',
    backoffDelay: 1000,
  },
  [QUEUE_NAMES.HALLUCINATION_DETECTION]: {
    concurrency: 10,
    maxRetries: 2,
    backoffType: 'fixed',
    backoffDelay: 2000,
  },
  [QUEUE_NAMES.REVIEW_ROUTING]: {
    concurrency: 10,
    maxRetries: 2,
    backoffType: 'fixed',
    backoffDelay: 1000,
  },
  [QUEUE_NAMES.EXPORT_GENERATION]: {
    concurrency: 3,
    maxRetries: 2,
    backoffType: 'exponential',
    backoffDelay: 5000,
  },
  [QUEUE_NAMES.PROVIDER_HEALTH_CHECK]: {
    concurrency: 5,
    maxRetries: 1,
    backoffType: 'fixed',
    backoffDelay: 10000,
  },
  [QUEUE_NAMES.NOTIFICATION]: {
    concurrency: 20,
    maxRetries: 3,
    backoffType: 'exponential',
    backoffDelay: 2000,
  },
};

// ──────────────────────────────────────────────
// Queue Factory
// ──────────────────────────────────────────────

const queues = new Map<string, Queue>();

export function getQueue<T = unknown>(name: QueueName): Queue<T, unknown, string> {
  if (!queues.has(name)) {
    const q = new Queue<T, unknown, string>(name, { connection });
    queues.set(name, q as Queue);
    logger.info({ queue: name }, 'Queue initialized');
  }
  return queues.get(name)! as Queue<T, unknown, string>;
}

/**
 * Add a job to a queue with standard retry config.
 */
export async function enqueue<T>(
  queueName: QueueName,
  data: T,
  options?: { priority?: number; delay?: number; jobId?: string },
): Promise<string> {
  const cfg = QUEUE_CONFIG[queueName];
  const queue = getQueue<T>(queueName);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const job = await queue.add(queueName as any, data as any, {
    attempts: cfg.maxRetries + 1,
    backoff: {
      type: cfg.backoffType,
      delay: cfg.backoffDelay,
    },
    removeOnComplete: { count: 1000 },
    removeOnFail: { count: 5000 },
    ...options,
  });

  logger.debug({ queue: queueName, jobId: job.id }, 'Job enqueued');
  return job.id!;
}

/**
 * Create a BullMQ Worker for a queue.
 */
export function createWorker<T>(
  queueName: QueueName,
  processor: (job: import('bullmq').Job<T>) => Promise<void>,
  overrides?: Partial<WorkerOptions>,
): Worker<T> {
  const cfg = QUEUE_CONFIG[queueName];

  const worker = new Worker<T>(queueName, processor, {
    connection,
    concurrency: cfg.concurrency,
    ...overrides,
  });

  worker.on('completed', (job) => {
    logger.debug({ queue: queueName, jobId: job.id }, 'Job completed');
  });

  worker.on('failed', (job, err) => {
    logger.error({ queue: queueName, jobId: job?.id, err: err.message }, 'Job failed');
  });

  worker.on('error', (err) => {
    logger.error({ queue: queueName, err: err.message }, 'Worker error');
  });

  return worker;
}

/**
 * Gracefully close all queues.
 */
export async function closeAllQueues(): Promise<void> {
  const promises = Array.from(queues.values()).map((q) => q.close());
  await Promise.all(promises);
  queues.clear();
  logger.info('All queues closed');
}
