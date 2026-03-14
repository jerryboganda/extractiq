import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@mcq-platform/db', () => ({
  db: {
    execute: vi.fn(),
  },
}));

vi.mock('@mcq-platform/queue', () => ({
  pingRedis: vi.fn(),
  getQueue: vi.fn(),
  getQueueDepths: vi.fn(),
  QUEUE_NAMES: {
    NOTIFICATION: 'notification',
  },
}));

vi.mock('@mcq-platform/storage', () => ({
  checkBucket: vi.fn(),
}));

vi.mock('@mcq-platform/config', () => ({
  env: {
    ENABLE_EMAIL_DELIVERY: false,
    SMTP_HOST: 'smtp-relay.brevo.com',
    SMTP_PORT: 587,
  },
}));

vi.mock('@mcq-platform/logger', () => ({
  createLogger: () => ({
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  }),
}));

import { db } from '@mcq-platform/db';
import { pingRedis, getQueue } from '@mcq-platform/queue';
import { checkBucket } from '@mcq-platform/storage';
import { runReadinessChecks } from './router.js';

const mockedDb = vi.mocked(db);
const mockedPingRedis = vi.mocked(pingRedis);
const mockedGetQueue = vi.mocked(getQueue);
const mockedCheckBucket = vi.mocked(checkBucket);

describe('health readiness checks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedDb.execute.mockResolvedValue([] as never);
    mockedPingRedis.mockResolvedValue(undefined as never);
    mockedCheckBucket.mockResolvedValue(undefined as never);
    mockedGetQueue.mockReturnValue({
      getJobCounts: vi.fn().mockResolvedValue({ waiting: 0 }),
    } as never);
  });

  it('returns all checks ok when dependencies are reachable', async () => {
    const result = await runReadinessChecks();

    expect(result).toEqual({
      checks: {
        database: 'ok',
        redis: 'ok',
        queue: 'ok',
        storage: 'ok',
        email: 'ok',
      },
      reasons: [],
      allOk: true,
    });
  });

  it('marks readiness degraded when queue access fails', async () => {
    mockedGetQueue.mockReturnValue({
      getJobCounts: vi.fn().mockRejectedValue(new Error('queue down')),
    } as never);

    const result = await runReadinessChecks();

    expect(result.allOk).toBe(false);
    expect(result.checks.queue).toBe('error');
    expect(result.reasons).toContain('queue access unavailable');
  });
});
