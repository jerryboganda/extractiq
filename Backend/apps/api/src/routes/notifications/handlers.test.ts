import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request, Response, NextFunction } from 'express';

vi.mock('@mcq-platform/db', () => ({
  db: { select: vi.fn(), update: vi.fn() },
  notifications: 'notifications_table',
}));

vi.mock('@mcq-platform/logger', () => ({
  createLogger: () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }),
}));

import { list, markRead, markAllRead } from './handlers.js';
import { db } from '@mcq-platform/db';

const mockedDb = vi.mocked(db);

function createReq(overrides: Partial<Request> = {}): Request {
  return { body: {}, query: {}, params: {}, cookies: {}, headers: {}, userId: 'user-1', workspaceId: 'ws-1', userRole: 'operator', ...overrides } as unknown as Request;
}

function createRes(): Response {
  return { status: vi.fn().mockReturnThis(), json: vi.fn().mockReturnThis() } as unknown as Response;
}

describe('notifications handlers', () => {
  let next: NextFunction;
  beforeEach(() => { vi.clearAllMocks(); next = vi.fn(); });

  describe('list', () => {
    it('returns user notifications', async () => {
      const items = [{ id: 'n1', type: 'job_completed', read: false }];
      const chain: Record<string, unknown> = {};
      chain.from = vi.fn().mockReturnValue(chain);
      chain.where = vi.fn().mockReturnValue(chain);
      chain.orderBy = vi.fn().mockReturnValue(chain);
      chain.limit = vi.fn().mockReturnValue(chain);
      chain.then = vi.fn().mockImplementation((resolve: any) => resolve(items));
      mockedDb.select.mockReturnValue(chain as any);

      const req = createReq();
      const res = createRes();
      await list(req, res, next);

      expect(res.json).toHaveBeenCalledWith({ data: items });
    });
  });

  describe('markRead', () => {
    it('marks notification as read', async () => {
      const notif = { id: 'n1', read: true };
      const chain: Record<string, unknown> = {};
      chain.set = vi.fn().mockReturnValue(chain);
      chain.where = vi.fn().mockReturnValue(chain);
      chain.returning = vi.fn().mockReturnValue(chain);
      chain.then = vi.fn().mockImplementation((resolve: any) => resolve([notif]));
      mockedDb.update.mockReturnValue(chain as any);

      const req = createReq({ params: { id: 'n1' } as any });
      const res = createRes();
      await markRead(req, res, next);

      expect(res.json).toHaveBeenCalledWith({ data: notif });
    });

    it('returns 404 for missing notification', async () => {
      const chain: Record<string, unknown> = {};
      chain.set = vi.fn().mockReturnValue(chain);
      chain.where = vi.fn().mockReturnValue(chain);
      chain.returning = vi.fn().mockReturnValue(chain);
      chain.then = vi.fn().mockImplementation((resolve: any) => resolve([]));
      mockedDb.update.mockReturnValue(chain as any);

      const req = createReq({ params: { id: 'no' } as any });
      const res = createRes();
      await markRead(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 404 }));
    });
  });

  describe('markAllRead', () => {
    it('marks all user notifications as read', async () => {
      const chain: Record<string, unknown> = {};
      chain.set = vi.fn().mockReturnValue(chain);
      chain.where = vi.fn().mockReturnValue(chain);
      chain.then = vi.fn().mockImplementation((resolve: any) => resolve(undefined));
      mockedDb.update.mockReturnValue(chain as any);

      const req = createReq();
      const res = createRes();
      await markAllRead(req, res, next);

      expect(res.json).toHaveBeenCalledWith({ data: { message: 'All notifications marked as read' } });
    });
  });
});
