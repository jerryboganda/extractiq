import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@mcq-platform/db', () => ({
  db: { select: vi.fn(), update: vi.fn() },
  mcqRecords: 'mcq_records_table',
}));

vi.mock('@mcq-platform/queue', () => ({
  enqueue: vi.fn(),
  QUEUE_NAMES: {
    HALLUCINATION_DETECTION: 'hallucination-detection',
    REVIEW_ROUTING: 'review-routing',
  },
}));

vi.mock('@mcq-platform/logger', () => ({
  createLogger: () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }),
}));

vi.mock('../lib/job-guard.js', () => ({
  isJobCancelled: vi.fn().mockResolvedValue(false),
  updateJobStage: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../lib/failure-state.js', () => ({
  markProcessingFailure: vi.fn().mockResolvedValue(undefined),
  shouldPersistFailure: vi.fn().mockReturnValue(true),
}));

import { processValidation } from './validation.js';
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
  chain.set = vi.fn().mockReturnValue(chain);
  chain.then = vi.fn().mockImplementation((resolve: any) => resolve(result));
  return chain;
}

function createJob(data: any) {
  return { data, id: 'job-id-1', name: 'validation' } as any;
}

function createRecord(overrides: any = {}) {
  return {
    id: 'mcq-1',
    questionText: 'What is the powerhouse of the cell?',
    options: [
      { label: 'A', text: 'Nucleus' },
      { label: 'B', text: 'Mitochondria' },
      { label: 'C', text: 'Ribosome' },
      { label: 'D', text: 'Golgi apparatus' },
    ],
    correctAnswer: 'B',
    extractionPathway: 'ocr_llm',
    language: 'en',
    ...overrides,
  };
}

describe('validation worker', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('throws if MCQ record not found', async () => {
    mockedDb.select.mockReturnValue(mockChain([]) as any);

    await expect(processValidation(createJob({
      jobId: 'j1', mcqRecordId: 'gone', workspaceId: 'ws-1',
    }))).rejects.toThrow('MCQ record gone not found');
  });

  it('assigns high confidence and routes to review-routing for valid MCQ', async () => {
    const record = createRecord();
    mockedDb.select.mockReturnValue(mockChain([record]) as any);
    mockedDb.update.mockReturnValue(mockChain(undefined) as any);
    mockedEnqueue.mockResolvedValue({} as any);

    await processValidation(createJob({
      jobId: 'j1', mcqRecordId: 'mcq-1', workspaceId: 'ws-1',
    }));

    // Should have updated the mcqRecord
    expect(mockedDb.update).toHaveBeenCalled();

    // Low risk → goes to REVIEW_ROUTING, not HALLUCINATION_DETECTION
    expect(mockedEnqueue).toHaveBeenCalledWith(
      'review-routing',
      expect.objectContaining({ mcqRecordId: 'mcq-1' }),
    );
  });

  it('flags missing question text and sends to hallucination detection', async () => {
    const record = createRecord({ questionText: '' });
    mockedDb.select.mockReturnValue(mockChain([record]) as any);
    mockedDb.update.mockReturnValue(mockChain(undefined) as any);
    mockedEnqueue.mockResolvedValue({} as any);

    await processValidation(createJob({
      jobId: 'j1', mcqRecordId: 'mcq-1', workspaceId: 'ws-1',
    }));

    // Low confidence → hallucination detection path
    expect(mockedEnqueue).toHaveBeenCalledWith(
      'hallucination-detection',
      expect.objectContaining({ mcqRecordId: 'mcq-1' }),
    );
  });

  it('flags missing options', async () => {
    const record = createRecord({ options: [] });
    mockedDb.select.mockReturnValue(mockChain([record]) as any);
    mockedDb.update.mockReturnValue(mockChain(undefined) as any);
    mockedEnqueue.mockResolvedValue({} as any);

    await processValidation(createJob({
      jobId: 'j1', mcqRecordId: 'mcq-1', workspaceId: 'ws-1',
    }));

    // Should enqueue to hallucination detection due to low confidence
    expect(mockedEnqueue).toHaveBeenCalledWith(
      'hallucination-detection',
      expect.objectContaining({ mcqRecordId: 'mcq-1' }),
    );
  });

  it('flags duplicate options', async () => {
    const record = createRecord({
      options: [
        { label: 'A', text: 'Same' },
        { label: 'B', text: 'Same' },
        { label: 'C', text: 'Different' },
      ],
    });
    mockedDb.select.mockReturnValue(mockChain([record]) as any);
    mockedDb.update.mockReturnValue(mockChain(undefined) as any);
    mockedEnqueue.mockResolvedValue({} as any);

    await processValidation(createJob({
      jobId: 'j1', mcqRecordId: 'mcq-1', workspaceId: 'ws-1',
    }));

    // Confidence reduced but may still be medium risk
    expect(mockedDb.update).toHaveBeenCalled();
  });

  it('flags correct answer not in options', async () => {
    const record = createRecord({ correctAnswer: 'Z' });
    mockedDb.select.mockReturnValue(mockChain([record]) as any);
    mockedDb.update.mockReturnValue(mockChain(undefined) as any);
    mockedEnqueue.mockResolvedValue({} as any);

    await processValidation(createJob({
      jobId: 'j1', mcqRecordId: 'mcq-1', workspaceId: 'ws-1',
    }));

    expect(mockedDb.update).toHaveBeenCalled();
    expect(mockedEnqueue).toHaveBeenCalled();
  });

  it('flags garbage characters and encoding issues', async () => {
    const record = createRecord({
      questionText: 'What is \x00\x01\x02\x03\x04 this? Also has \uFFFD broken chars',
    });
    mockedDb.select.mockReturnValue(mockChain([record]) as any);
    mockedDb.update.mockReturnValue(mockChain(undefined) as any);
    mockedEnqueue.mockResolvedValue({} as any);

    await processValidation(createJob({
      jobId: 'j1', mcqRecordId: 'mcq-1', workspaceId: 'ws-1',
    }));

    expect(mockedDb.update).toHaveBeenCalled();
  });
});
