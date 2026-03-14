import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { NextFunction, Request, Response } from 'express';

vi.mock('@mcq-platform/db', () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  documents: { id: 'documents.id', workspaceId: 'documents.workspaceId', projectId: 'documents.projectId', s3Key: 'documents.s3Key' },
  projects: { id: 'projects.id', workspaceId: 'projects.workspaceId', name: 'projects.name' },
}));

vi.mock('@mcq-platform/storage', () => ({
  getPresignedUploadUrl: vi.fn(),
  buildDocumentKey: vi.fn(),
}));

vi.mock('uuid', () => ({
  v4: vi.fn().mockReturnValue('doc-uuid-1'),
}));

import { completeUpload, getById, list, presignUpload, remove } from './handlers.js';
import { db } from '@mcq-platform/db';
import { buildDocumentKey, getPresignedUploadUrl } from '@mcq-platform/storage';

const mockedDb = vi.mocked(db);
const mockedBuildDocumentKey = vi.mocked(buildDocumentKey);
const mockedGetPresignedUploadUrl = vi.mocked(getPresignedUploadUrl);

function createReq(overrides: Partial<Request> = {}): Request {
  return {
    body: {},
    query: { page: 1, limit: 20 },
    params: {},
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
  chain.innerJoin = vi.fn().mockReturnValue(chain);
  chain.where = vi.fn().mockReturnValue(chain);
  chain.orderBy = vi.fn().mockReturnValue(chain);
  chain.limit = vi.fn().mockReturnValue(chain);
  chain.offset = vi.fn().mockReturnValue(chain);
  chain.values = vi.fn().mockReturnValue(chain);
  chain.returning = vi.fn().mockResolvedValue(result);
  chain.set = vi.fn().mockReturnValue(chain);
  chain.then = vi.fn().mockImplementation((resolve: (value: unknown) => unknown) => resolve(result));
  return chain;
}

describe('documents handlers', () => {
  let next: NextFunction;

  beforeEach(() => {
    vi.clearAllMocks();
    next = vi.fn();
  });

  it('lists mapped documents for the workspace', async () => {
    mockedDb.select
      .mockReturnValueOnce(mockChain([{
        id: 'doc-1',
        filename: 'biology.pdf',
        status: 'uploaded',
        pageCount: 12,
        fileSize: 2 * 1024 * 1024,
        mcqCount: 18,
        confidenceAvg: 0.83,
        createdAt: new Date('2026-03-13T00:00:00.000Z'),
        projectId: 'project-1',
        projectName: 'Biology',
      }]) as never)
      .mockReturnValueOnce(mockChain([{ total: 1 }]) as never);

    const res = createRes();
    await list(createReq({ query: { page: 1, limit: 10 } as any }), res, next);

    expect(res.json).toHaveBeenCalledWith({
      data: {
        items: [{
          id: 'doc-1',
          filename: 'biology.pdf',
          status: 'uploaded',
          pages: 12,
          uploadDate: '2026-03-13T00:00:00.000Z',
          mcqCount: 18,
          confidence: 83,
          size: '2.0 MB',
          project: 'Biology',
          projectId: 'project-1',
        }],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      },
    });
  });

  it('verifies project ownership before creating a presigned upload', async () => {
    mockedDb.select.mockReturnValueOnce(mockChain([{ id: 'project-1' }]) as never);
    mockedBuildDocumentKey.mockReturnValue('ws-1/doc-uuid-1/biology.pdf');
    mockedGetPresignedUploadUrl.mockResolvedValue('https://signed-upload.example.com');
    mockedDb.insert.mockReturnValue(mockChain([{ id: 'doc-uuid-1' }]) as never);

    const res = createRes();
    await presignUpload(
      createReq({
        body: {
          filename: 'biology.pdf',
          contentType: 'application/pdf',
          fileSize: 1024,
          projectId: 'project-1',
        },
      }),
      res,
      next,
    );

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      data: {
        uploadUrl: 'https://signed-upload.example.com',
        documentId: 'doc-uuid-1',
        s3Key: 'ws-1/doc-uuid-1/biology.pdf',
        expiresIn: 3600,
      },
    });
  });

  it('marks a completed upload as uploaded rather than preprocessing', async () => {
    mockedDb.update.mockReturnValueOnce(mockChain([{
      id: 'doc-1',
      status: 'uploaded',
      checksumSha256: 'checksum-1',
    }]) as never);

    const res = createRes();
    await completeUpload(
      createReq({ body: { uploadId: 'doc-1', s3Key: 'ws-1/doc-uuid-1/biology.pdf', checksumSha256: 'checksum-1' } }),
      res,
      next,
    );

    expect(res.json).toHaveBeenCalledWith({
      data: {
        id: 'doc-1',
        status: 'uploaded',
        checksumSha256: 'checksum-1',
      },
    });
  });

  it('returns a document by id inside the workspace', async () => {
    mockedDb.select.mockReturnValueOnce(mockChain([{ id: 'doc-1', filename: 'biology.pdf' }]) as never);

    const res = createRes();
    await getById(createReq({ params: { id: 'doc-1' } as any }), res, next);

    expect(res.json).toHaveBeenCalledWith({ data: { id: 'doc-1', filename: 'biology.pdf' } });
  });

  it('deletes a document in the current workspace', async () => {
    mockedDb.delete.mockReturnValueOnce(mockChain([{ id: 'doc-1' }]) as never);

    const res = createRes();
    await remove(createReq({ params: { id: 'doc-1' } as any }), res, next);

    expect(res.json).toHaveBeenCalledWith({ data: { message: 'Document deleted' } });
  });
});
