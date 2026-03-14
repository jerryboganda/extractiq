import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { NextFunction, Request, Response } from 'express';

vi.mock('@mcq-platform/db', () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  jobs: { id: 'jobs.id', workspaceId: 'jobs.workspaceId' },
  jobDocuments: { jobId: 'jobDocuments.jobId', documentId: 'jobDocuments.documentId' },
  documents: { id: 'documents.id', workspaceId: 'documents.workspaceId' },
  jobTasks: { id: 'jobTasks.id', jobId: 'jobTasks.jobId', createdAt: 'jobTasks.createdAt' },
  projects: { id: 'projects.id', workspaceId: 'projects.workspaceId' },
}));

vi.mock('@mcq-platform/queue', () => ({
  enqueue: vi.fn(),
  QUEUE_NAMES: {
    DOCUMENT_PREPROCESSING: 'document-preprocessing',
  },
}));

import { cancel, create, getById, list, retry } from './handlers.js';
import { db } from '@mcq-platform/db';
import { enqueue } from '@mcq-platform/queue';

const mockedDb = vi.mocked(db);
const mockedEnqueue = vi.mocked(enqueue);

function createReq(overrides: Partial<Request> = {}): Request {
  return {
    body: {},
    query: { page: 1, limit: 20 },
    params: {},
    workspaceId: 'ws-1',
    userId: 'user-1',
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
  chain.innerJoin = vi.fn().mockReturnValue(chain);
  chain.orderBy = vi.fn().mockReturnValue(chain);
  chain.limit = vi.fn().mockReturnValue(chain);
  chain.offset = vi.fn().mockReturnValue(chain);
  chain.values = vi.fn().mockReturnValue(chain);
  chain.returning = vi.fn().mockResolvedValue(result);
  chain.set = vi.fn().mockReturnValue(chain);
  chain.then = vi.fn().mockImplementation((resolve: (value: unknown) => unknown) => resolve(result));
  return chain;
}

describe('jobs handlers', () => {
  let next: NextFunction;

  beforeEach(() => {
    vi.clearAllMocks();
    next = vi.fn();
  });

  it('lists enriched jobs with document and task metadata', async () => {
    mockedDb.select
      .mockReturnValueOnce(mockChain([{
        id: 'job-1',
        projectId: 'project-1',
        status: 'queued',
        progressPercent: 32.4,
        startedAt: new Date(Date.now() - 5_000),
        completedAt: null,
        createdAt: new Date('2026-03-13T00:00:00.000Z'),
        totalTasks: 1,
        completedTasks: 0,
        failedTasks: 0,
      }]) as never)
      .mockReturnValueOnce(mockChain([{ total: 1 }]) as never)
      .mockReturnValueOnce(mockChain([{ filename: 'biology.pdf' }]) as never)
      .mockReturnValueOnce(mockChain([{ taskType: 'preprocessing', providerConfigId: null }]) as never);

    const res = createRes();
    await list(createReq({ query: { page: 1, limit: 10 } as any }), res, next);

    expect(res.json).toHaveBeenCalledWith({
      data: expect.objectContaining({
        total: 1,
        items: [expect.objectContaining({
          id: 'job-1',
          documentName: 'biology.pdf',
          provider: 'system',
          progress: 32,
          currentStage: 2,
        })],
      }),
    });
  });

  it('creates a queued job, preprocessing tasks, and queue messages', async () => {
    mockedDb.select
      .mockReturnValueOnce(mockChain([{ id: 'project-1' }]) as never)
      .mockReturnValueOnce(mockChain([{ id: 'doc-1', s3Key: 'ws-1/doc-1.pdf', status: 'uploaded' }]) as never);
    mockedDb.insert
      .mockReturnValueOnce(mockChain([{ id: 'job-1', status: 'queued', totalDocuments: 1, totalTasks: 1 }]) as never)
      .mockReturnValueOnce(mockChain([]) as never)
      .mockReturnValueOnce(mockChain([]) as never);
    mockedDb.update.mockReturnValue(mockChain([]) as never);
    mockedEnqueue.mockResolvedValue(undefined as never);

    const res = createRes();
    await create(
      createReq({ body: { projectId: 'project-1', documentIds: ['doc-1'] } }),
      res,
      next,
    );

    expect(res.status).toHaveBeenCalledWith(201);
    expect(mockedEnqueue).toHaveBeenCalledWith('document-preprocessing', expect.objectContaining({
      jobId: 'job-1',
      documentId: 'doc-1',
      workspaceId: 'ws-1',
    }));
  });

  it('returns a job with its task list', async () => {
    mockedDb.select
      .mockReturnValueOnce(mockChain([{ id: 'job-1', status: 'queued' }]) as never)
      .mockReturnValueOnce(mockChain([{ id: 'task-1', taskType: 'preprocessing', status: 'queued' }]) as never);

    const res = createRes();
    await getById(createReq({ params: { id: 'job-1' } as any }), res, next);

    expect(res.json).toHaveBeenCalledWith({
      data: {
        id: 'job-1',
        status: 'queued',
        tasks: [{ id: 'task-1', taskType: 'preprocessing', status: 'queued' }],
      },
    });
  });

  it('cancels a job with a deterministic error summary', async () => {
    mockedDb.update.mockReturnValueOnce(mockChain([{
      id: 'job-1',
      status: 'cancelled',
      errorSummary: { reason: 'Cancelled by user' },
    }]) as never);

    const res = createRes();
    await cancel(createReq({ params: { id: 'job-1' } as any }), res, next);

    expect(res.json).toHaveBeenCalledWith({
      data: {
        id: 'job-1',
        status: 'cancelled',
        errorSummary: { reason: 'Cancelled by user' },
      },
    });
  });

  it('requeues a failed job and rebuilds preprocessing tasks', async () => {
    mockedDb.select
      .mockReturnValueOnce(mockChain([{ id: 'job-1', status: 'failed' }]) as never)
      .mockReturnValueOnce(mockChain([{ documentId: 'doc-1', s3Key: 'ws-1/doc-1.pdf' }]) as never);
    mockedDb.update
      .mockReturnValueOnce(mockChain([{
        id: 'job-1',
        status: 'queued',
        completedTasks: 0,
        failedTasks: 0,
        progressPercent: 0,
        errorSummary: null,
        completedAt: null,
      }]) as never)
      .mockReturnValueOnce(mockChain([]) as never);
    mockedDb.delete.mockReturnValueOnce({ where: vi.fn().mockResolvedValue(undefined) } as never);
    mockedDb.insert.mockReturnValueOnce(mockChain([]) as never);
    mockedEnqueue.mockResolvedValue(undefined as never);

    const res = createRes();
    await retry(createReq({ params: { id: 'job-1' } as any }), res, next);

    expect(res.json).toHaveBeenCalledWith({
      data: expect.objectContaining({
        id: 'job-1',
        status: 'queued',
        progressPercent: 0,
      }),
    });
    expect(mockedEnqueue).toHaveBeenCalledWith('document-preprocessing', expect.objectContaining({
      jobId: 'job-1',
      documentId: 'doc-1',
    }));
  });
});
