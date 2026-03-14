import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { NextFunction, Request, Response } from 'express';

vi.mock('@mcq-platform/db', () => ({
  db: { select: vi.fn() },
  documents: { workspaceId: 'documents.workspaceId', id: 'documents.id', filename: 'documents.filename', createdAt: 'documents.createdAt' },
  mcqRecords: { workspaceId: 'mcq.workspaceId', reviewStatus: 'mcq.reviewStatus', createdAt: 'mcq.createdAt' },
  jobs: { workspaceId: 'jobs.workspaceId', status: 'jobs.status', id: 'jobs.id', createdAt: 'jobs.createdAt' },
  providerConfigs: { workspaceId: 'provider.workspaceId', isEnabled: 'provider.isEnabled', id: 'provider.id' },
  providerBenchmarks: { providerConfigId: 'bench.providerConfigId', measuredAt: 'bench.measuredAt' },
  auditLogs: { workspaceId: 'audit.workspaceId', createdAt: 'audit.createdAt' },
  jobDocuments: { jobId: 'jobDocuments.jobId', documentId: 'jobDocuments.documentId' },
  jobTasks: { jobId: 'jobTasks.jobId', createdAt: 'jobTasks.createdAt', taskType: 'jobTasks.taskType' },
}));

import { getActiveJobs, getProviderHealth, getRecentActivity, getStats } from './handlers.js';
import { db } from '@mcq-platform/db';

const mockedDb = vi.mocked(db);

function createReq(overrides: Partial<Request> = {}): Request {
  return {
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
  chain.then = vi.fn().mockImplementation((resolve: (value: unknown) => unknown) => resolve(result));
  return chain;
}

describe('dashboard handlers', () => {
  let next: NextFunction;

  beforeEach(() => {
    vi.clearAllMocks();
    next = vi.fn();
  });

  it('returns normalized dashboard stats', async () => {
    mockedDb.select
      .mockReturnValueOnce(mockChain([{ count: 100 }]) as never)
      .mockReturnValueOnce(mockChain([{ count: 500 }]) as never)
      .mockReturnValueOnce(mockChain([{ count: 400 }]) as never)
      .mockReturnValueOnce(mockChain([{ count: 3 }]) as never);

    const res = createRes();
    await getStats(createReq(), res, next);

    expect(res.json).toHaveBeenCalledWith({
      data: {
        documentsProcessed: 100,
        mcqsExtracted: 500,
        approvalRate: 80,
        activeJobs: 3,
        documentsProcessedTrend: 0,
        mcqsExtractedTrend: 0,
        approvalRateTrend: 0,
        activeJobsTrend: 0,
      },
    });
  });

  it('maps active jobs into dashboard card shape', async () => {
    mockedDb.select
      .mockReturnValueOnce(mockChain([{
        id: 'job-1',
        status: 'preprocessing',
        progressPercent: 42.2,
        startedAt: new Date('2026-03-13T01:00:00.000Z'),
        createdAt: new Date('2026-03-13T00:00:00.000Z'),
      }]) as never)
      .mockReturnValueOnce(mockChain([{ filename: 'biology.pdf' }]) as never)
      .mockReturnValueOnce(mockChain([{ taskType: 'vlm_extraction' }]) as never);

    const res = createRes();
    await getActiveJobs(createReq(), res, next);

    expect(res.json).toHaveBeenCalledWith({
      data: [{
        id: 'job-1',
        document: 'biology.pdf',
        status: 'preprocessing',
        progress: 42,
        provider: 'vlm pipeline',
        stage: 'vlm_extraction',
        startedAt: '2026-03-13T01:00:00.000Z',
      }],
    });
  });

  it('maps recent activity into feed rows', async () => {
    mockedDb.select.mockReturnValueOnce(mockChain([{
      id: 'audit-1',
      action: 'document.uploaded',
      resourceType: 'document',
      resourceId: 'doc-1',
      userId: 'user-1',
      details: {},
      createdAt: new Date('2026-03-13T00:00:00.000Z'),
    }]) as never);

    const res = createRes();
    await getRecentActivity(createReq(), res, next);

    expect(res.json).toHaveBeenCalledWith({
      data: [{
        id: 'audit-1',
        action: 'document.uploaded',
        target: 'document doc-1',
        user: 'user-1',
        time: '2026-03-13T00:00:00.000Z',
        type: 'upload',
      }],
    });
  });

  it('returns provider health cards with benchmark data', async () => {
    mockedDb.select
      .mockReturnValueOnce(mockChain([{
        id: 'provider-1',
        displayName: 'OpenAI OCR',
        healthStatus: 'offline',
        lastHealthCheck: new Date('2026-03-13T00:00:00.000Z'),
      }]) as never)
      .mockReturnValueOnce(mockChain([{
        accuracy: 0.97,
        avgLatencyMs: 512.3,
      }]) as never);

    const res = createRes();
    await getProviderHealth(createReq(), res, next);

    expect(res.json).toHaveBeenCalledWith({
      data: [{
        name: 'OpenAI OCR',
        status: 'offline',
        accuracy: 97,
        latency: '512ms',
        lastHealthCheck: '2026-03-13T00:00:00.000Z',
      }],
    });
  });
});
