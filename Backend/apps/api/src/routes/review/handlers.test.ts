import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request, Response, NextFunction } from 'express';

vi.mock('@mcq-platform/db', () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
  },
  reviewItems: 'review_items_table',
  reviewActions: 'review_actions_table',
  mcqRecords: 'mcq_records_table',
}));

vi.mock('@mcq-platform/logger', () => ({
  createLogger: () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }),
}));

import { listQueue, getDetail, approve, reject, flag, edit, navigation, bulk } from './handlers.js';
import { db } from '@mcq-platform/db';

const mockedDb = vi.mocked(db);

function createReq(overrides: Partial<Request> = {}): Request {
  return {
    body: {},
    query: { page: 1, limit: 20 },
    params: {},
    cookies: {},
    headers: {},
    userId: 'user-1',
    workspaceId: 'ws-1',
    userRole: 'reviewer',
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

describe('review handlers', () => {
  let next: NextFunction;

  beforeEach(() => {
    vi.clearAllMocks();
    next = vi.fn();
  });

  describe('listQueue', () => {
    it('returns enriched review items with MCQ data', async () => {
      const items = [{ id: 'ri1', mcqRecordId: 'mcq1', severity: 'high', status: 'pending', createdAt: new Date() }];
      const itemsChain = mockChain(items);
      const countChain = mockChain([{ total: 1 }]);
      const mcqChain = mockChain([{ questionText: 'What is X?', confidence: 85, options: [] }]);

      mockedDb.select
        .mockReturnValueOnce(itemsChain as any)
        .mockReturnValueOnce(countChain as any)
        .mockReturnValueOnce(mcqChain as any);

      const req = createReq({ query: { page: 1, limit: 10 } as any });
      const res = createRes();

      await listQueue(req, res, next);

      const response = (res.json as any).mock.calls[0][0];
      expect(response.data.items[0].question).toBe('What is X?');
      expect(response.data.items[0].confidence).toBe(85);
      expect(response.data.total).toBe(1);
    });
  });

  describe('getDetail', () => {
    it('returns review item with MCQ and actions', async () => {
      const item = { id: 'ri1', mcqRecordId: 'mcq1', workspaceId: 'ws-1' };
      const mcq = { id: 'mcq1', questionText: 'What is X?' };
      const actions = [{ id: 'a1', actionType: 'edit' }];

      // First select: review item
      const itemChain = mockChain([item]);
      // Second select: mcq
      const mcqChain = mockChain([mcq]);
      // Third select: actions (no .limit)
      const actionsChain: Record<string, unknown> = {};
      actionsChain.from = vi.fn().mockReturnValue(actionsChain);
      actionsChain.where = vi.fn().mockReturnValue(actionsChain);
      actionsChain.orderBy = vi.fn().mockResolvedValue(actions);

      mockedDb.select
        .mockReturnValueOnce(itemChain as any)
        .mockReturnValueOnce(mcqChain as any)
        .mockReturnValueOnce(actionsChain as any);

      const req = createReq({ params: { id: 'ri1' } as any });
      const res = createRes();

      await getDetail(req, res, next);

      expect(res.json).toHaveBeenCalledWith({
        data: { ...item, mcq, actions },
      });
    });

    it('returns 404 for missing review item', async () => {
      const chain = mockChain([]);
      mockedDb.select.mockReturnValue(chain as any);

      const req = createReq({ params: { id: 'no-id' } as any });
      const res = createRes();

      await getDetail(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({ statusCode: 404 }),
      );
    });
  });

  describe('approve', () => {
    it('marks review item as approved', async () => {
      // performReviewAction: select item, insert action, update item, update mcq
      const item = { id: 'ri1', mcqRecordId: 'mcq1', workspaceId: 'ws-1' };
      const selectChain = mockChain([item]);
      mockedDb.select.mockReturnValue(selectChain as any);

      const insertChain = mockChain([{ id: 'a1' }]);
      mockedDb.insert.mockReturnValue(insertChain as any);

      const approved = { id: 'ri1', status: 'approved' };
      const updateChain = mockChain([approved]);
      mockedDb.update.mockReturnValue(updateChain as any);

      const req = createReq({ params: { id: 'ri1' } as any });
      const res = createRes();

      await approve(req, res, next);

      expect(res.json).toHaveBeenCalledWith({ data: approved });
    });
  });

  describe('reject', () => {
    it('marks review item as rejected', async () => {
      const item = { id: 'ri1', mcqRecordId: 'mcq1', workspaceId: 'ws-1' };
      const selectChain = mockChain([item]);
      mockedDb.select.mockReturnValue(selectChain as any);

      const insertChain = mockChain([{ id: 'a1' }]);
      mockedDb.insert.mockReturnValue(insertChain as any);

      const rejected = { id: 'ri1', status: 'rejected' };
      const updateChain = mockChain([rejected]);
      mockedDb.update.mockReturnValue(updateChain as any);

      const req = createReq({ params: { id: 'ri1' } as any });
      const res = createRes();

      await reject(req, res, next);

      expect(res.json).toHaveBeenCalledWith({ data: rejected });
    });
  });

  describe('flag', () => {
    it('flags review item with reason', async () => {
      const item = { id: 'ri1', mcqRecordId: 'mcq1', workspaceId: 'ws-1' };
      const selectChain = mockChain([item]);
      mockedDb.select.mockReturnValue(selectChain as any);

      const insertChain = mockChain([{ id: 'a1' }]);
      mockedDb.insert.mockReturnValue(insertChain as any);

      const flagged = { id: 'ri1', status: 'flagged' };
      const updateChain = mockChain([flagged]);
      mockedDb.update.mockReturnValue(updateChain as any);

      const req = createReq({ params: { id: 'ri1' } as any, body: { reason: 'Incorrect answer' } });
      const res = createRes();

      await flag(req, res, next);

      expect(res.json).toHaveBeenCalledWith({ data: flagged });
    });
  });

  describe('edit', () => {
    it('applies edits to MCQ record and logs action', async () => {
      const item = { id: 'ri1', mcqRecordId: 'mcq1', workspaceId: 'ws-1' };
      const selectChain = mockChain([item]);
      mockedDb.select.mockReturnValue(selectChain as any);

      const updateChain = mockChain([{}]);
      mockedDb.update.mockReturnValue(updateChain as any);

      const insertChain = mockChain([{ id: 'a1' }]);
      mockedDb.insert.mockReturnValue(insertChain as any);

      const req = createReq({
        params: { id: 'ri1' } as any,
        body: { question: 'Updated question?', explanation: 'New explanation' },
      });
      const res = createRes();

      await edit(req, res, next);

      expect(res.json).toHaveBeenCalledWith({ data: { message: 'Edit applied' } });
    });

    it('returns 404 for missing review item on edit', async () => {
      const chain = mockChain([]);
      mockedDb.select.mockReturnValue(chain as any);

      const req = createReq({ params: { id: 'missing' } as any, body: { question: 'X?' } });
      const res = createRes();

      await edit(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({ statusCode: 404 }),
      );
    });
  });

  describe('navigation', () => {
    it('returns previous/next IDs for current item', async () => {
      const items = [{ id: 'ri3' }, { id: 'ri2' }, { id: 'ri1' }];
      const chain: Record<string, unknown> = {};
      chain.from = vi.fn().mockReturnValue(chain);
      chain.where = vi.fn().mockReturnValue(chain);
      chain.orderBy = vi.fn().mockResolvedValue(items);

      mockedDb.select.mockReturnValue(chain as any);

      const req = createReq({ params: { id: 'ri2' } as any });
      const res = createRes();

      await navigation(req, res, next);

      const response = (res.json as any).mock.calls[0][0].data;
      expect(response.previousId).toBe('ri3');
      expect(response.nextId).toBe('ri1');
      expect(response.currentIndex).toBe(2);
      expect(response.totalCount).toBe(3);
    });
  });

  describe('bulk', () => {
    it('processes multiple review actions', async () => {
      // Each performReviewAction call needs select + insert + 2x update
      const item = { id: 'ri1', mcqRecordId: 'mcq1', workspaceId: 'ws-1' };
      const selectChain = mockChain([item]);
      mockedDb.select.mockReturnValue(selectChain as any);

      const insertChain = mockChain([{ id: 'a1' }]);
      mockedDb.insert.mockReturnValue(insertChain as any);

      const approved = { id: 'ri1', status: 'approved' };
      const updateChain = mockChain([approved]);
      mockedDb.update.mockReturnValue(updateChain as any);

      const req = createReq({
        body: { ids: ['ri1', 'ri2'], action: 'approve', reason: 'Bulk approve' },
      });
      const res = createRes();

      await bulk(req, res, next);

      const response = (res.json as any).mock.calls[0][0].data;
      expect(response.processed).toBe(2);
    });
  });
});
