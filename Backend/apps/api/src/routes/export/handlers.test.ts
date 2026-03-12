import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request, Response, NextFunction } from 'express';

vi.mock('@mcq-platform/db', () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
  },
  exportJobs: 'export_jobs_table',
  exportArtifacts: 'export_artifacts_table',
}));

vi.mock('@mcq-platform/storage', () => ({
  getPresignedDownloadUrl: vi.fn(),
}));

vi.mock('@mcq-platform/queue', () => ({
  enqueue: vi.fn(),
  QUEUE_NAMES: { EXPORT_GENERATION: 'export-generation' },
}));

vi.mock('@mcq-platform/logger', () => ({
  createLogger: () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }),
}));

import { list, create, getById, download } from './handlers.js';
import { db } from '@mcq-platform/db';
import { getPresignedDownloadUrl } from '@mcq-platform/storage';
import { enqueue } from '@mcq-platform/queue';

const mockedDb = vi.mocked(db);
const mockedDownloadUrl = vi.mocked(getPresignedDownloadUrl);
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

describe('export handlers', () => {
  let next: NextFunction;

  beforeEach(() => {
    vi.clearAllMocks();
    next = vi.fn();
  });

  describe('list', () => {
    it('returns paginated export jobs', async () => {
      const items = [{ id: 'e1', format: 'csv', status: 'completed' }];
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
    it('creates export job and enqueues generation', async () => {
      const exportJob = { id: 'e-new', format: 'csv', status: 'pending' };
      const chain = mockChain([exportJob]);
      mockedDb.insert.mockReturnValue(chain as any);
      mockedEnqueue.mockResolvedValue({} as any);

      const req = createReq({
        body: { format: 'csv', projectId: 'proj-1', minConfidence: 80 },
      });
      const res = createRes();

      await create(req, res, next);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(mockedEnqueue).toHaveBeenCalledWith('export-generation', expect.objectContaining({
        exportJobId: 'e-new',
        format: 'csv',
      }));
    });
  });

  describe('getById', () => {
    it('returns export with artifacts', async () => {
      const exportJob = { id: 'e1', status: 'completed' };
      const artifacts = [{ id: 'art1', filename: 'export.csv' }];

      const jobChain = mockChain([exportJob]);
      // Artifacts query has no .limit
      const artChain: Record<string, unknown> = {};
      artChain.from = vi.fn().mockReturnValue(artChain);
      artChain.where = vi.fn().mockReturnValue(artChain);
      artChain.then = vi.fn().mockImplementation((resolve: any) => resolve(artifacts));

      mockedDb.select
        .mockReturnValueOnce(jobChain as any)
        .mockReturnValueOnce(artChain as any);

      const req = createReq({ params: { id: 'e1' } as any });
      const res = createRes();

      await getById(req, res, next);

      expect(res.json).toHaveBeenCalledWith({
        data: { ...exportJob, artifacts },
      });
    });

    it('returns 404 for missing export', async () => {
      const chain = mockChain([]);
      mockedDb.select.mockReturnValue(chain as any);

      const req = createReq({ params: { id: 'no' } as any });
      const res = createRes();

      await getById(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 404 }));
    });
  });

  describe('download', () => {
    it('returns presigned download URL for completed export', async () => {
      const exportJob = { id: 'e1', status: 'completed' };
      const artifact = { id: 'art1', s3Key: 'exports/e1.csv', filename: 'export.csv' };

      const jobChain = mockChain([exportJob]);
      const artChain = mockChain([artifact]);

      mockedDb.select
        .mockReturnValueOnce(jobChain as any)
        .mockReturnValueOnce(artChain as any);

      mockedDownloadUrl.mockResolvedValue('https://s3.example.com/download?signed=true');

      const req = createReq({ params: { id: 'e1' } as any });
      const res = createRes();

      await download(req, res, next);

      expect(res.json).toHaveBeenCalledWith({
        data: { downloadUrl: 'https://s3.example.com/download?signed=true', filename: 'export.csv', expiresIn: 300 },
      });
    });

    it('returns 400 for non-completed export', async () => {
      const exportJob = { id: 'e1', status: 'processing' };
      const chain = mockChain([exportJob]);
      mockedDb.select.mockReturnValue(chain as any);

      const req = createReq({ params: { id: 'e1' } as any });
      const res = createRes();

      await download(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({ statusCode: 400, code: 'NOT_READY' }),
      );
    });
  });
});
