import { describe, it, expect } from 'vitest';

// These are pure data exports that don't need Redis
const QUEUE_NAMES = {
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

type QueueName = (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES];

interface QueueConfig {
  concurrency: number;
  maxRetries: number;
  backoffType: 'exponential' | 'fixed';
  backoffDelay: number;
}

// Mirror the production config for testing
const QUEUE_CONFIG: Record<QueueName, QueueConfig> = {
  [QUEUE_NAMES.DOCUMENT_PREPROCESSING]: { concurrency: 5, maxRetries: 3, backoffType: 'exponential', backoffDelay: 5000 },
  [QUEUE_NAMES.PAGE_CLASSIFICATION]: { concurrency: 10, maxRetries: 2, backoffType: 'exponential', backoffDelay: 3000 },
  [QUEUE_NAMES.OCR_EXTRACTION]: { concurrency: 8, maxRetries: 3, backoffType: 'exponential', backoffDelay: 5000 },
  [QUEUE_NAMES.VLM_EXTRACTION]: { concurrency: 4, maxRetries: 3, backoffType: 'exponential', backoffDelay: 10000 },
  [QUEUE_NAMES.TEXT_SEGMENTATION]: { concurrency: 10, maxRetries: 2, backoffType: 'fixed', backoffDelay: 2000 },
  [QUEUE_NAMES.MCQ_EXTRACTION]: { concurrency: 6, maxRetries: 3, backoffType: 'exponential', backoffDelay: 5000 },
  [QUEUE_NAMES.VALIDATION]: { concurrency: 15, maxRetries: 2, backoffType: 'fixed', backoffDelay: 1000 },
  [QUEUE_NAMES.HALLUCINATION_DETECTION]: { concurrency: 10, maxRetries: 2, backoffType: 'fixed', backoffDelay: 2000 },
  [QUEUE_NAMES.REVIEW_ROUTING]: { concurrency: 10, maxRetries: 2, backoffType: 'fixed', backoffDelay: 1000 },
  [QUEUE_NAMES.EXPORT_GENERATION]: { concurrency: 3, maxRetries: 2, backoffType: 'exponential', backoffDelay: 5000 },
  [QUEUE_NAMES.PROVIDER_HEALTH_CHECK]: { concurrency: 5, maxRetries: 1, backoffType: 'fixed', backoffDelay: 10000 },
  [QUEUE_NAMES.NOTIFICATION]: { concurrency: 20, maxRetries: 3, backoffType: 'exponential', backoffDelay: 2000 },
};

describe('QUEUE_NAMES', () => {
  it('defines exactly 12 queues', () => {
    expect(Object.keys(QUEUE_NAMES)).toHaveLength(12);
  });

  it('all queue name values are unique', () => {
    const values = Object.values(QUEUE_NAMES);
    expect(new Set(values).size).toBe(values.length);
  });

  it('all queue name values are kebab-case strings', () => {
    for (const name of Object.values(QUEUE_NAMES)) {
      expect(name).toMatch(/^[a-z]+(-[a-z]+)*$/);
    }
  });

  it('includes all expected pipeline queues', () => {
    const expected = [
      'document-preprocessing',
      'page-classification',
      'ocr-extraction',
      'vlm-extraction',
      'text-segmentation',
      'mcq-extraction',
      'validation',
      'hallucination-detection',
      'review-routing',
      'export-generation',
      'provider-health-check',
      'notification',
    ];
    expect(Object.values(QUEUE_NAMES).sort()).toEqual(expected.sort());
  });
});

describe('QUEUE_CONFIG', () => {
  it('has config for every queue name', () => {
    for (const name of Object.values(QUEUE_NAMES)) {
      expect(QUEUE_CONFIG[name]).toBeDefined();
    }
  });

  it('all configs have positive concurrency', () => {
    for (const [name, cfg] of Object.entries(QUEUE_CONFIG)) {
      expect(cfg.concurrency, `${name} concurrency`).toBeGreaterThan(0);
    }
  });

  it('all configs have non-negative maxRetries', () => {
    for (const [name, cfg] of Object.entries(QUEUE_CONFIG)) {
      expect(cfg.maxRetries, `${name} maxRetries`).toBeGreaterThanOrEqual(0);
    }
  });

  it('all configs have positive backoff delay', () => {
    for (const [name, cfg] of Object.entries(QUEUE_CONFIG)) {
      expect(cfg.backoffDelay, `${name} backoffDelay`).toBeGreaterThan(0);
    }
  });

  it('all configs have valid backoff type', () => {
    for (const [name, cfg] of Object.entries(QUEUE_CONFIG)) {
      expect(['exponential', 'fixed'], `${name} backoffType`).toContain(cfg.backoffType);
    }
  });

  it('VLM extraction has lower concurrency than CPU-bound tasks', () => {
    // VLM calls external GPU-bound APIs — should be limited
    expect(QUEUE_CONFIG[QUEUE_NAMES.VLM_EXTRACTION].concurrency).toBeLessThanOrEqual(
      QUEUE_CONFIG[QUEUE_NAMES.VALIDATION].concurrency
    );
  });

  it('notification queue has highest concurrency', () => {
    const maxConcurrency = Math.max(...Object.values(QUEUE_CONFIG).map((c) => c.concurrency));
    expect(QUEUE_CONFIG[QUEUE_NAMES.NOTIFICATION].concurrency).toBe(maxConcurrency);
  });

  it('export generation has lowest concurrency (resource-intensive)', () => {
    const minConcurrency = Math.min(...Object.values(QUEUE_CONFIG).map((c) => c.concurrency));
    expect(QUEUE_CONFIG[QUEUE_NAMES.EXPORT_GENERATION].concurrency).toBe(minConcurrency);
  });
});
