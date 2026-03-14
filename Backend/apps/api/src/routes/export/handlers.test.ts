import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { NextFunction, Request, Response } from 'express';

vi.mock('@mcq-platform/db', () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
  },
  exportJobs: { id: 'exportJobs.id', workspaceId: 'exportJobs.workspaceId', createdAt: 'exportJobs.createdAt' },
  exportArtifacts: { exportJobId: 'exportArtifacts.exportJobId' },
}));

vi.mock('@mcq-platform/storage', () => ({
  getPresignedDownloadUrl: vi.fn(),
}));

vi.mock('@mcq-platform/queue', () => ({
  enqueue: vi.fn(),
  QUEUE_NAMES: {
    EXPORT_GENERATION: 'export-generation',
  },
}));

import { list } from './handlers.js';
import { db } from '@mcq-platform/db';

const mockedDb = vi.mocked(db);

function createReq(overrides: Partial<Request> = {}): Request {
  return {
    body: {},
    query: {},
    params: {},
    workspaceId: 'ws-1',
    userId: 'user-1',
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
  chain.returning = vi.fn().mockResolvedValue(result);
  chain.then = vi.fn().mockImplementation((resolve: (value: unknown) => unknown) => resolve(result));
  return chain;
}

describe('export handlers', () => {
  let next: NextFunction;

  beforeEach(() => {
    vi.clearAllMocks();
    next = vi.fn();
  });

  it('falls back to default pagination when query params are omitted', async () => {
    mockedDb.select
      .mockReturnValueOnce(mockChain([]) as never)
      .mockReturnValueOnce(mockChain([{ total: 0 }]) as never);

    const res = createRes();
    await list(createReq(), res, next);

    expect(res.json).toHaveBeenCalledWith({
      data: {
        items: [],
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 0,
      },
    });
  });
});
