import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request, Response, NextFunction } from 'express';

vi.mock('@mcq-platform/db', () => ({
  db: { select: vi.fn() },
  auditLogs: 'audit_logs_table',
  users: 'users_table',
}));

vi.mock('@mcq-platform/logger', () => ({
  createLogger: () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }),
}));

import { list } from './handlers.js';
import { db } from '@mcq-platform/db';

const mockedDb = vi.mocked(db);

function createReq(overrides: Partial<Request> = {}): Request {
  return { body: {}, query: { page: 1, limit: 20 }, params: {}, cookies: {}, headers: {}, userId: 'user-1', workspaceId: 'ws-1', userRole: 'workspace_admin', ...overrides } as unknown as Request;
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

describe('audit handlers', () => {
  let next: NextFunction;
  beforeEach(() => { vi.clearAllMocks(); next = vi.fn(); });

  describe('list', () => {
    it('returns paginated audit logs with actor names', async () => {
      const logs = [{ id: 'l1', action: 'document.upload', userId: 'u1', createdAt: new Date() }];
      const logsChain = mockChain(logs);
      const countChain = mockChain([{ total: 1 }]);

      // User lookup for enrichment
      const userChain = mockChain([{ name: 'John Doe' }]);

      mockedDb.select
        .mockReturnValueOnce(logsChain as any)      // items
        .mockReturnValueOnce(countChain as any)      // count
        .mockReturnValueOnce(userChain as any);      // user name

      const req = createReq({ query: { page: 1, limit: 10 } as any });
      const res = createRes();
      await list(req, res, next);

      const response = (res.json as any).mock.calls[0][0].data;
      expect(response.items[0].actor).toBe('John Doe');
      expect(response.total).toBe(1);
    });

    it('shows System as actor when userId is null', async () => {
      const logs = [{ id: 'l1', action: 'system.event', userId: null }];
      const logsChain = mockChain(logs);
      const countChain = mockChain([{ total: 1 }]);

      mockedDb.select
        .mockReturnValueOnce(logsChain as any)
        .mockReturnValueOnce(countChain as any);

      const req = createReq({ query: { page: 1, limit: 10 } as any });
      const res = createRes();
      await list(req, res, next);

      const response = (res.json as any).mock.calls[0][0].data;
      expect(response.items[0].actor).toBe('System');
    });
  });
});
