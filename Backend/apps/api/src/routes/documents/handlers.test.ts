import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request, Response, NextFunction } from 'express';

vi.mock('@mcq-platform/db', () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  documents: 'documents_table',
}));

vi.mock('@mcq-platform/storage', () => ({
  getPresignedUploadUrl: vi.fn(),
  buildDocumentKey: vi.fn(),
}));

vi.mock('uuid', () => ({
  v4: vi.fn().mockReturnValue('doc-uuid-1'),
}));

vi.mock('@mcq-platform/logger', () => ({
  createLogger: () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }),
}));

import { list, presignUpload, completeUpload, getById, remove } from './handlers.js';
import { db } from '@mcq-platform/db';
import { getPresignedUploadUrl, buildDocumentKey } from '@mcq-platform/storage';

const mockedDb = vi.mocked(db);
const mockedGetPresignedUrl = vi.mocked(getPresignedUploadUrl);
const mockedBuildKey = vi.mocked(buildDocumentKey);

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

describe('documents handlers', () => {
  let next: NextFunction;

  beforeEach(() => {
    vi.clearAllMocks();
    next = vi.fn();
  });

  describe('list', () => {
    it('returns paginated documents for workspace', async () => {
      const items = [{ id: 'd1', filename: 'test.pdf' }];
      const itemsChain = mockChain(items);
      const countChain = mockChain([{ total: 1 }]);

      mockedDb.select
        .mockReturnValueOnce(itemsChain as any)
        .mockReturnValueOnce(countChain as any);

      const req = createReq({ query: { page: 1, limit: 10 } as any });
      const res = createRes();

      await list(req, res, next);

      expect(res.json).toHaveBeenCalledWith({
        data: {
          items,
          total: 1,
          page: 1,
          limit: 10,
          totalPages: 1,
        },
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('returns empty list when no documents', async () => {
      const itemsChain = mockChain([]);
      const countChain = mockChain([{ total: 0 }]);

      mockedDb.select
        .mockReturnValueOnce(itemsChain as any)
        .mockReturnValueOnce(countChain as any);

      const req = createReq({ query: { page: 1, limit: 10 } as any });
      const res = createRes();

      await list(req, res, next);

      expect(res.json).toHaveBeenCalledWith({
        data: { items: [], total: 0, page: 1, limit: 10, totalPages: 0 },
      });
    });
  });

  describe('presignUpload', () => {
    it('creates document record and returns presigned URL', async () => {
      mockedBuildKey.mockReturnValue('ws-1/doc-uuid-1/test.pdf');
      mockedGetPresignedUrl.mockResolvedValue('https://s3.example.com/upload?signed=true');

      const doc = { id: 'doc-uuid-1', filename: 'test.pdf', status: 'uploaded' };
      const insertChain = mockChain([doc]);
      mockedDb.insert.mockReturnValue(insertChain as any);

      const req = createReq({
        body: { filename: 'test.pdf', contentType: 'application/pdf', fileSize: 1024, projectId: 'proj-1' },
      });
      const res = createRes();

      await presignUpload(req, res, next);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        data: {
          uploadUrl: 'https://s3.example.com/upload?signed=true',
          documentId: 'doc-uuid-1',
          s3Key: 'ws-1/doc-uuid-1/test.pdf',
          expiresIn: 3600,
        },
      });
    });
  });

  describe('completeUpload', () => {
    it('updates document status to preprocessing', async () => {
      const doc = { id: 'd1', status: 'preprocessing' };
      const chain = mockChain([doc]);
      mockedDb.update.mockReturnValue(chain as any);

      const req = createReq({
        body: { uploadId: 'd1', s3Key: 'key', checksumSha256: 'abc123' },
      });
      const res = createRes();

      await completeUpload(req, res, next);

      expect(res.json).toHaveBeenCalledWith({ data: doc });
    });

    it('returns 404 if document not found', async () => {
      const chain = mockChain([]);
      // Override returning to return empty
      chain.returning = vi.fn().mockResolvedValue([]);
      mockedDb.update.mockReturnValue(chain as any);

      const req = createReq({ body: { uploadId: 'nonexistent', s3Key: 'key' } });
      const res = createRes();

      await completeUpload(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({ statusCode: 404, code: 'NOT_FOUND' }),
      );
    });
  });

  describe('getById', () => {
    it('returns document by id', async () => {
      const doc = { id: 'd1', filename: 'test.pdf' };
      const chain = mockChain([doc]);
      mockedDb.select.mockReturnValue(chain as any);

      const req = createReq({ params: { id: 'd1' } as any });
      const res = createRes();

      await getById(req, res, next);

      expect(res.json).toHaveBeenCalledWith({ data: doc });
    });

    it('returns 404 for missing document', async () => {
      const chain = mockChain([]);
      mockedDb.select.mockReturnValue(chain as any);

      const req = createReq({ params: { id: 'no-such-id' } as any });
      const res = createRes();

      await getById(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({ statusCode: 404 }),
      );
    });
  });

  describe('remove', () => {
    it('deletes document and returns success', async () => {
      const doc = { id: 'd1' };
      const chain = mockChain([doc]);
      mockedDb.delete.mockReturnValue(chain as any);

      const req = createReq({ params: { id: 'd1' } as any });
      const res = createRes();

      await remove(req, res, next);

      expect(res.json).toHaveBeenCalledWith({ data: { message: 'Document deleted' } });
    });

    it('returns 404 when deleting nonexistent document', async () => {
      const chain = mockChain([]);
      chain.returning = vi.fn().mockResolvedValue([]);
      mockedDb.delete.mockReturnValue(chain as any);

      const req = createReq({ params: { id: 'nonexistent' } as any });
      const res = createRes();

      await remove(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({ statusCode: 404 }),
      );
    });
  });
});
