import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request, Response, NextFunction } from 'express';

vi.mock('@mcq-platform/db', () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
  },
  jobs: 'jobs_table',
  jobDocuments: 'job_documents_table',
  documents: 'documents_table',
  jobTasks: 'job_tasks_table',
}));

vi.mock('@mcq-platform/queue', () => ({
  enqueue: vi.fn(),
  QUEUE_NAMES: { DOCUMENT_PREPROCESSING: 'document-preprocessing' },
}));

vi.mock('@mcq-platform/logger', () => ({
  createLogger: () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }),
}));

import { list, create, getById, cancel, retry } from './handlers.js';
import { db } from '@mcq-platform/db';
import { enqueue } from '@mcq-platform/queue';

const mockedDb = vi.mocked(db);
const mockedEnqueue = vi.mocked(enqueue);

function createReq(overrides: Partial<Request> = {}): Request {
  return {
    body: {},
    query: { page: 1, limit: 20 },
    params: {},
    cookies: {},
    headers: {},
    userId: 'user-1',
    workspaceId: 'ws-1',
    userRole: 'operator',
    ...overrides,
  } as unknown as Request;
}

function createRes(): Response {
  return {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  } as unknown as Response;
}

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

describe('jobs handlers', () => {
  let next: NextFunction;

  beforeEach(() => {
    vi.clearAllMocks();
    next = vi.fn();
  });

  describe('list', () => {
    it('returns paginated jobs', async () => {
      const items = [{ id: 'j1', status: 'completed' }];
      const itemsChain = mockChain(items);
      const countChain = mockChain([{ total: 1 }]);

      mockedDb.select
        .mockReturnValueOnce(itemsChain as any)
        .mockReturnValueOnce(countChain as any);

      const req = createReq({ query: { page: 1, limit: 10 } as any });
      const res = createRes();

      await list(req, res, next);

      expect(res.json).toHaveBeenCalledWith({
        data: { items, total: 1, page: 1, limit: 10, totalPages: 1 },
      });
    });
  });

  describe('create', () => {
    it('creates job, links documents, and enqueues preprocessing', async () => {
      const job = { id: 'j-new', status: 'pending', totalDocuments: 2 };
      const insertJobChain = mockChain([job]);
      const insertLinksChain = mockChain([]);

      mockedDb.insert
        .mockReturnValueOnce(insertJobChain as any)
        .mockReturnValueOnce(insertLinksChain as any);

      // Select documents for the workspace
      const docsChain = mockChain([
        { id: 'doc-1', s3Key: 'ws-1/doc-1/file1.pdf' },
        { id: 'doc-2', s3Key: 'ws-1/doc-2/file2.pdf' },
      ]);
      mockedDb.select.mockReturnValue(docsChain as any);

      mockedEnqueue.mockResolvedValue({} as any);

      // Update job status to queued
      const updateChain = mockChain([{ ...job, status: 'queued' }]);
      mockedDb.update.mockReturnValue(updateChain as any);

      const req = createReq({
        body: { documentIds: ['doc-1', 'doc-2'], projectId: 'proj-1' },
      });
      const res = createRes();

      await create(req, res, next);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(mockedEnqueue).toHaveBeenCalledTimes(2);
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('getById', () => {
    it('returns job with tasks', async () => {
      const job = { id: 'j1', status: 'processing' };
      const tasks = [{ id: 't1', status: 'running' }];

      const jobChain = mockChain([job]);
      const tasksChain = mockChain(tasks);

      mockedDb.select
        .mockReturnValueOnce(jobChain as any)
        .mockReturnValueOnce(tasksChain as any);

      // Tasks chain needs where which returns a mock that resolves to the array
      // Override the second select to handle the tasks query (no .limit)
      const tasksSelectChain: Record<string, unknown> = {};
      tasksSelectChain.from = vi.fn().mockReturnValue(tasksSelectChain);
      tasksSelectChain.where = vi.fn().mockResolvedValue(tasks);
      mockedDb.select.mockReset();
      mockedDb.select
        .mockReturnValueOnce(jobChain as any)
        .mockReturnValueOnce(tasksSelectChain as any);

      const req = createReq({ params: { id: 'j1' } as any });
      const res = createRes();

      await getById(req, res, next);

      expect(res.json).toHaveBeenCalledWith({
        data: { ...job, tasks },
      });
    });

    it('returns 404 for missing job', async () => {
      const chain = mockChain([]);
      mockedDb.select.mockReturnValue(chain as any);

      const req = createReq({ params: { id: 'no-job' } as any });
      const res = createRes();

      await getById(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({ statusCode: 404 }),
      );
    });
  });

  describe('cancel', () => {
    it('sets job status to cancelling', async () => {
      const job = { id: 'j1', status: 'cancelling' };
      const chain = mockChain([job]);
      mockedDb.update.mockReturnValue(chain as any);

      const req = createReq({ params: { id: 'j1' } as any });
      const res = createRes();

      await cancel(req, res, next);

      expect(res.json).toHaveBeenCalledWith({ data: job });
    });

    it('returns 404 for missing job', async () => {
      const chain = mockChain([]);
      chain.returning = vi.fn().mockResolvedValue([]);
      mockedDb.update.mockReturnValue(chain as any);

      const req = createReq({ params: { id: 'no-job' } as any });
      const res = createRes();

      await cancel(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({ statusCode: 404 }),
      );
    });
  });

  describe('retry', () => {
    it('resets job to pending on retry', async () => {
      const existing = { id: 'j1', status: 'failed' };
      const selectChain = mockChain([existing]);
      mockedDb.select.mockReturnValue(selectChain as any);

      const resetJob = { id: 'j1', status: 'pending', completedTasks: 0, failedTasks: 0, progressPercent: 0 };
      const updateChain = mockChain([resetJob]);
      mockedDb.update.mockReturnValue(updateChain as any);

      const req = createReq({ params: { id: 'j1' } as any });
      const res = createRes();

      await retry(req, res, next);

      expect(res.json).toHaveBeenCalledWith({ data: resetJob });
    });

    it('returns 404 when retrying nonexistent job', async () => {
      const chain = mockChain([]);
      mockedDb.select.mockReturnValue(chain as any);

      const req = createReq({ params: { id: 'no-job' } as any });
      const res = createRes();

      await retry(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({ statusCode: 404 }),
      );
    });
  });
});
