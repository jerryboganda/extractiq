import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request, Response, NextFunction } from 'express';

vi.mock('@mcq-platform/db', () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  mcqRecords: 'mcq_records_table',
  mcqRecordHistory: 'mcq_record_history_table',
}));

vi.mock('@mcq-platform/logger', () => ({
  createLogger: () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }),
}));

import { list, getById, update, remove, getHistory } from './handlers.js';
import { db } from '@mcq-platform/db';

const mockedDb = vi.mocked(db);

function createReq(overrides: Partial<Request> = {}): Request {
  return { body: {}, query: { page: 1, limit: 20 }, params: {}, cookies: {}, headers: {}, userId: 'user-1', workspaceId: 'ws-1', userRole: 'operator', ...overrides } as unknown as Request;
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

describe('mcq handlers', () => {
  let next: NextFunction;
  beforeEach(() => { vi.clearAllMocks(); next = vi.fn(); });

  describe('list', () => {
    it('returns paginated MCQ records', async () => {
      const items = [{ id: 'm1', questionText: 'What is DNA?' }];
      const itemsChain = mockChain(items);
      const countChain = mockChain([{ total: 1 }]);

      mockedDb.select
        .mockReturnValueOnce(itemsChain as any)
        .mockReturnValueOnce(countChain as any);

      const req = createReq({ query: { page: 1, limit: 10 } as any });
      const res = createRes();
      await list(req, res, next);

      const data = (res.json as any).mock.calls[0][0].data;
      expect(data.items).toEqual(items);
      expect(data.total).toBe(1);
      expect(data.totalPages).toBe(1);
    });
  });

  describe('getById', () => {
    it('returns MCQ record by id', async () => {
      const record = { id: 'm1', questionText: 'What is DNA?' };
      const chain = mockChain([record]);
      mockedDb.select.mockReturnValue(chain as any);

      const req = createReq({ params: { id: 'm1' } as any });
      const res = createRes();
      await getById(req, res, next);

      expect(res.json).toHaveBeenCalledWith({ data: record });
    });

    it('returns 404 for missing record', async () => {
      const chain = mockChain([]);
      mockedDb.select.mockReturnValue(chain as any);

      const req = createReq({ params: { id: 'gone' } as any });
      const res = createRes();
      await getById(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 404, code: 'NOT_FOUND' }));
    });
  });

  describe('update', () => {
    it('updates MCQ with optimistic concurrency', async () => {
      const existing = { id: 'm1', version: 3, questionText: 'Old' };
      const updated = { id: 'm1', version: 4, questionText: 'New' };

      // First select: existing record check
      const selectChain = mockChain([existing]);
      mockedDb.select.mockReturnValue(selectChain as any);

      // Insert history
      const insertChain = mockChain(undefined);
      mockedDb.insert.mockReturnValue(insertChain as any);

      // Update record
      const updateChain = mockChain([updated]);
      mockedDb.update.mockReturnValue(updateChain as any);

      const req = createReq({
        params: { id: 'm1' } as any,
        body: { version: 3, questionText: 'New' },
      });
      const res = createRes();
      await update(req, res, next);

      expect(res.json).toHaveBeenCalledWith({ data: updated });
    });

    it('returns 404 for missing record', async () => {
      const chain = mockChain([]);
      mockedDb.select.mockReturnValue(chain as any);

      const req = createReq({ params: { id: 'gone' } as any, body: { version: 1, questionText: 'X' } });
      const res = createRes();
      await update(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 404 }));
    });

    it('returns 409 on version conflict', async () => {
      const existing = { id: 'm1', version: 5, questionText: 'Old' };
      const chain = mockChain([existing]);
      mockedDb.select.mockReturnValue(chain as any);

      const req = createReq({
        params: { id: 'm1' } as any,
        body: { version: 3, questionText: 'New' },
      });
      const res = createRes();
      await update(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 409, code: 'VERSION_CONFLICT' }));
    });
  });

  describe('remove', () => {
    it('deletes MCQ record and returns success', async () => {
      const chain = mockChain([{ id: 'm1' }]);
      mockedDb.delete.mockReturnValue(chain as any);

      const req = createReq({ params: { id: 'm1' } as any });
      const res = createRes();
      await remove(req, res, next);

      expect(res.json).toHaveBeenCalledWith({ data: { message: 'MCQ record deleted' } });
    });

    it('returns 404 for missing record', async () => {
      const chain = mockChain([]);
      mockedDb.delete.mockReturnValue(chain as any);

      const req = createReq({ params: { id: 'gone' } as any });
      const res = createRes();
      await remove(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 404 }));
    });
  });

  describe('getHistory', () => {
    it('returns change history for MCQ record', async () => {
      const history = [
        { id: 'h1', mcqRecordId: 'm1', version: 1, changeType: 'manual_edit' },
        { id: 'h2', mcqRecordId: 'm1', version: 2, changeType: 'manual_edit' },
      ];
      const chain = mockChain(history);
      mockedDb.select.mockReturnValue(chain as any);

      const req = createReq({ params: { id: 'm1' } as any });
      const res = createRes();
      await getHistory(req, res, next);

      expect(res.json).toHaveBeenCalledWith({ data: history });
    });
  });
});
