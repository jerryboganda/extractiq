import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@mcq-platform/db', () => ({
  db: { select: vi.fn(), update: vi.fn(), insert: vi.fn() },
  mcqRecords: 'mcq_records_table',
  reviewItems: 'review_items_table',
  jobs: 'jobs_table',
  jobTasks: 'job_tasks_table',
}));

vi.mock('@mcq-platform/queue', () => ({
  enqueue: vi.fn(),
  QUEUE_NAMES: { NOTIFICATION: 'notification' },
}));

vi.mock('@mcq-platform/logger', () => ({
  createLogger: () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }),
}));

import { processReviewRouting } from './review-routing.js';
import { db } from '@mcq-platform/db';
import { enqueue } from '@mcq-platform/queue';

const mockedDb = vi.mocked(db);
const mockedEnqueue = vi.mocked(enqueue);

function mockChain(result: unknown) {
  const chain: Record<string, unknown> = {};
  chain.from = vi.fn().mockReturnValue(chain);
  chain.where = vi.fn().mockReturnValue(chain);
  chain.orderBy = vi.fn().mockReturnValue(chain);
  chain.limit = vi.fn().mockReturnValue(chain);
  chain.offset = vi.fn().mockReturnValue(chain);
  chain.values = vi.fn().mockReturnValue(chain);
  chain.returning = vi.fn().mockReturnValue(chain);
  chain.set = vi.fn().mockReturnValue(chain);
  chain.groupBy = vi.fn().mockReturnValue(chain);
  chain.then = vi.fn().mockImplementation((resolve: any) => resolve(result));
  return chain;
}

function createJob(data: any) {
  return { data, id: 'job-id-1', name: 'review-routing' } as any;
}

describe('review-routing worker', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('throws if MCQ record not found', async () => {
    mockedDb.select.mockReturnValue(mockChain([]) as any);

    await expect(processReviewRouting(createJob({
      jobId: 'j1', mcqRecordId: 'gone', workspaceId: 'ws-1',
    }))).rejects.toThrow('MCQ record gone not found');
  });

  it('auto-approves high confidence MCQ with no flags', async () => {
    const record = { id: 'mcq-1', confidence: 0.95, flags: [], hallucinationRiskTier: 'low' };
    // Select MCQ record
    const selectChain = mockChain([record]);
    // Update MCQ status
    const updateChain = mockChain(undefined);
    // Job progress count query
    const progressChain = mockChain([{ total: 5, completed: 3, failed: 0 }]);
    // Update job
    const jobUpdateChain = mockChain(undefined);

    mockedDb.select
      .mockReturnValueOnce(selectChain as any)    // MCQ record
      .mockReturnValueOnce(progressChain as any); // task counts
    mockedDb.update
      .mockReturnValueOnce(updateChain as any)     // MCQ status update
      .mockReturnValueOnce(jobUpdateChain as any); // job progress update

    await processReviewRouting(createJob({
      jobId: 'j1', mcqRecordId: 'mcq-1', workspaceId: 'ws-1',
    }));

    // Should NOT create a review item (auto-approved)
    expect(mockedDb.insert).not.toHaveBeenCalled();
  });

  it('auto-rejects MCQ with critical hallucination risk', async () => {
    const record = { id: 'mcq-1', confidence: 0.3, flags: ['missing_question_text'], hallucinationRiskTier: 'critical' };
    const selectChain = mockChain([record]);
    const updateChain = mockChain(undefined);
    const insertChain = mockChain(undefined);
    const progressChain = mockChain([{ total: 5, completed: 5, failed: 0 }]);
    const jobUpdateChain = mockChain(undefined);
    // Job record for notification
    const jobRecordChain = mockChain([{ id: 'j1', workspaceId: 'ws-1' }]);

    mockedDb.select
      .mockReturnValueOnce(selectChain as any)
      .mockReturnValueOnce(progressChain as any)
      .mockReturnValueOnce(jobRecordChain as any);
    mockedDb.update
      .mockReturnValueOnce(updateChain as any)
      .mockReturnValueOnce(jobUpdateChain as any);
    mockedDb.insert.mockReturnValue(insertChain as any);
    mockedEnqueue.mockResolvedValue({} as any);

    await processReviewRouting(createJob({
      jobId: 'j1', mcqRecordId: 'mcq-1', workspaceId: 'ws-1',
    }));

    // Should create a review item with auto_rejected status
    expect(mockedDb.insert).toHaveBeenCalled();
  });

  it('routes medium confidence MCQ to review queue', async () => {
    const record = { id: 'mcq-1', confidence: 0.75, flags: ['question_too_short'], hallucinationRiskTier: 'low' };
    const selectChain = mockChain([record]);
    const updateChain = mockChain(undefined);
    const insertChain = mockChain(undefined);
    const progressChain = mockChain([{ total: 10, completed: 2, failed: 0 }]);
    const jobUpdateChain = mockChain(undefined);

    mockedDb.select
      .mockReturnValueOnce(selectChain as any)
      .mockReturnValueOnce(progressChain as any);
    mockedDb.update
      .mockReturnValueOnce(updateChain as any)
      .mockReturnValueOnce(jobUpdateChain as any);
    mockedDb.insert.mockReturnValue(insertChain as any);

    await processReviewRouting(createJob({
      jobId: 'j1', mcqRecordId: 'mcq-1', workspaceId: 'ws-1',
    }));

    // Should create a review item (needs_review)
    expect(mockedDb.insert).toHaveBeenCalled();
  });

  it('sends notification when job completes', async () => {
    const record = { id: 'mcq-1', confidence: 0.95, flags: [], hallucinationRiskTier: 'low' };
    // All tasks completed
    const progressChain = mockChain([{ total: 1, completed: 1, failed: 0 }]);
    const jobRecord = { id: 'j1', workspaceId: 'ws-1' };

    mockedDb.select
      .mockReturnValueOnce(mockChain([record]) as any)
      .mockReturnValueOnce(progressChain as any)
      .mockReturnValueOnce(mockChain([jobRecord]) as any); // job lookup for notification
    mockedDb.update
      .mockReturnValueOnce(mockChain(undefined) as any)
      .mockReturnValueOnce(mockChain(undefined) as any);
    mockedEnqueue.mockResolvedValue({} as any);

    await processReviewRouting(createJob({
      jobId: 'j1', mcqRecordId: 'mcq-1', workspaceId: 'ws-1',
    }));

    expect(mockedEnqueue).toHaveBeenCalledWith(
      'notification',
      expect.objectContaining({ type: 'job_completed' }),
    );
  });
});
