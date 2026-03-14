import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request, Response, NextFunction } from 'express';

vi.mock('@mcq-platform/db', () => ({
  db: { select: vi.fn(), update: vi.fn() },
  workspaces: 'workspaces_table',
  documents: 'documents_table',
  auditLogs: 'audit_logs_table',
}));

vi.mock('@mcq-platform/logger', () => ({
  createLogger: () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }),
}));

import { get, update, usage } from './handlers.js';
import { db } from '@mcq-platform/db';

const mockedDb = vi.mocked(db);

function createReq(overrides: Partial<Request> = {}): Request {
  return { body: {}, query: {}, params: {}, cookies: {}, headers: {}, userId: 'user-1', workspaceId: 'ws-1', userRole: 'workspace_admin', ...overrides } as unknown as Request;
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

describe('workspace handlers', () => {
  let next: NextFunction;
  beforeEach(() => { vi.clearAllMocks(); next = vi.fn(); });

  describe('get', () => {
    it('returns workspace data', async () => {
      const ws = { id: 'ws-1', name: 'Test WS', plan: 'pro' };
      const chain = mockChain([ws]);
      mockedDb.select.mockReturnValue(chain as any);

      const req = createReq();
      const res = createRes();
      await get(req, res, next);

      expect(res.json).toHaveBeenCalledWith({ data: ws });
    });

    it('returns 404 for missing workspace', async () => {
      const chain = mockChain([]);
      mockedDb.select.mockReturnValue(chain as any);

      const req = createReq();
      const res = createRes();
      await get(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 404 }));
    });
  });

  describe('update', () => {
    it('updates workspace settings', async () => {
      const current = {
        id: 'ws-1',
        settings: { description: 'Old description', emailNotifications: true, webhookUrl: 'https://old.example/webhook' },
      };
      const selectChain = mockChain([current]);
      mockedDb.select.mockReturnValue(selectChain as any);

      const updated = {
        id: 'ws-1',
        name: 'Updated',
        autoApproveThreshold: 90,
        settings: { description: 'New description', emailNotifications: false, webhookUrl: null },
      };
      const updateChain = mockChain([updated]);
      mockedDb.update.mockReturnValue(updateChain as any);

      const req = createReq({
        body: {
          name: 'Updated',
          description: 'New description',
          autoApproveThreshold: 90,
          emailNotifications: false,
          webhookUrl: null,
        },
      });
      const res = createRes();
      await update(req, res, next);

      expect(res.json).toHaveBeenCalledWith({ data: updated });
    });
  });

  describe('usage', () => {
    it('returns usage data with plan limits', async () => {
      const ws = { id: 'ws-1', plan: 'pro' };
      const selectWsChain = mockChain([ws]);
      const countChain = mockChain([{ count: 42 }]);

      mockedDb.select
        .mockReturnValueOnce(selectWsChain as any)
        .mockReturnValueOnce(countChain as any)
        .mockReturnValueOnce(mockChain([{ count: 1200 }]) as any);

      const req = createReq();
      const res = createRes();
      await usage(req, res, next);

      const data = (res.json as any).mock.calls[0][0].data;
      expect(data.documentsUsed).toBe(42);
      expect(data.documentsLimit).toBe(500);
      expect(data.apiCallsLimit).toBe(10000);
    });
  });
});
