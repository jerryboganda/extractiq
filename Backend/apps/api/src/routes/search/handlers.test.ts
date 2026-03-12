import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request, Response, NextFunction } from 'express';

vi.mock('@mcq-platform/db', () => ({
  db: { select: vi.fn() },
  documents: 'documents_table',
  projects: 'projects_table',
  mcqRecords: 'mcq_records_table',
  jobs: 'jobs_table',
}));

vi.mock('@mcq-platform/logger', () => ({
  createLogger: () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }),
}));

import { search } from './handlers.js';
import { db } from '@mcq-platform/db';

const mockedDb = vi.mocked(db);

function createReq(overrides: Partial<Request> = {}): Request {
  return { body: {}, query: {}, params: {}, cookies: {}, headers: {}, userId: 'user-1', workspaceId: 'ws-1', userRole: 'operator', ...overrides } as unknown as Request;
}

function createRes(): Response {
  return { status: vi.fn().mockReturnThis(), json: vi.fn().mockReturnThis() } as unknown as Response;
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

describe('search handlers', () => {
  let next: NextFunction;
  beforeEach(() => { vi.clearAllMocks(); next = vi.fn(); });

  describe('search', () => {
    it('returns results from all entity types', async () => {
      const docs = [{ id: 'd1', name: 'biology.pdf', status: 'processed' }];
      const projects = [{ id: 'p1', name: 'Biology Project', status: 'active' }];
      const mcqs = [{ id: 'm1', name: 'What is DNA?', status: 'approved' }];
      const jobResults = [{ id: 'j1', status: 'completed' }];

      // Promise.all resolves each select chain
      mockedDb.select
        .mockReturnValueOnce(mockChain(docs) as any)         // documents
        .mockReturnValueOnce(mockChain(projects) as any)      // projects
        .mockReturnValueOnce(mockChain(mcqs) as any)          // mcqRecords
        .mockReturnValueOnce(mockChain(jobResults) as any);   // jobs

      const req = createReq({ query: { q: 'bio' } as any });
      const res = createRes();
      await search(req, res, next);

      const data = (res.json as any).mock.calls[0][0].data;
      expect(data).toHaveLength(4);
      expect(data[0].type).toBe('document');
      expect(data[1].type).toBe('project');
      expect(data[2].type).toBe('mcq');
      expect(data[3].type).toBe('job');
    });

    it('returns empty array when no matches', async () => {
      mockedDb.select
        .mockReturnValueOnce(mockChain([]) as any)
        .mockReturnValueOnce(mockChain([]) as any)
        .mockReturnValueOnce(mockChain([]) as any)
        .mockReturnValueOnce(mockChain([]) as any);

      const req = createReq({ query: { q: 'zzznomatch' } as any });
      const res = createRes();
      await search(req, res, next);

      expect((res.json as any).mock.calls[0][0].data).toEqual([]);
    });

    it('truncates MCQ question text to 100 chars', async () => {
      const longQ = 'A'.repeat(200);
      mockedDb.select
        .mockReturnValueOnce(mockChain([]) as any)
        .mockReturnValueOnce(mockChain([]) as any)
        .mockReturnValueOnce(mockChain([{ id: 'm1', name: longQ, status: 'pending' }]) as any)
        .mockReturnValueOnce(mockChain([]) as any);

      const req = createReq({ query: { q: 'A' } as any });
      const res = createRes();
      await search(req, res, next);

      const data = (res.json as any).mock.calls[0][0].data;
      expect(data[0].name).toHaveLength(100);
    });
  });
});
