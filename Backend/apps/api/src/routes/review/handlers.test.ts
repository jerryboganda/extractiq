import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { NextFunction, Request, Response } from 'express';

vi.mock('@mcq-platform/db', () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    transaction: vi.fn(),
  },
  reviewItems: { id: 'reviewItems.id', workspaceId: 'reviewItems.workspaceId', createdAt: 'reviewItems.createdAt' },
  reviewActions: { reviewItemId: 'reviewActions.reviewItemId', createdAt: 'reviewActions.createdAt' },
  mcqRecords: { id: 'mcq.id', documentId: 'mcq.documentId', version: 'mcq.version' },
  documents: { id: 'documents.id', filename: 'documents.filename' },
  users: { id: 'users.id', name: 'users.name' },
  mcqRecordHistory: { id: 'history.id' },
}));

import { approve, edit, getDetail, listQueue, navigation } from './handlers.js';
import { db } from '@mcq-platform/db';

const mockedDb = vi.mocked(db);

function createReq(overrides: Partial<Request> = {}): Request {
  return {
    body: {},
    query: { page: 1, limit: 20 },
    params: {},
    workspaceId: 'ws-1',
    userId: 'reviewer-1',
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
  chain.returning = vi.fn().mockResolvedValue(result);
  chain.set = vi.fn().mockReturnValue(chain);
  chain.then = vi.fn().mockImplementation((resolve: (value: unknown) => unknown) => resolve(result));
  return chain;
}

describe('review handlers', () => {
  let next: NextFunction;

  beforeEach(() => {
    vi.clearAllMocks();
    next = vi.fn();
  });

  it('lists pending review items with enriched MCQ metadata', async () => {
    mockedDb.select
      .mockReturnValueOnce(mockChain([{
        id: 'review-1',
        mcqRecordId: 'mcq-1',
        severity: 'high',
        flagTypes: ['confidence'],
        reasonSummary: 'Low confidence',
        assignedTo: 'reviewer-2',
        status: 'pending',
        createdAt: new Date('2026-03-13T00:00:00.000Z'),
      }]) as never)
      .mockReturnValueOnce(mockChain([{ total: 1 }]) as never)
      .mockReturnValueOnce(mockChain([{
        questionText: 'What is ATP?',
        confidence: 0.82,
        options: [],
        documentId: 'doc-1',
      }]) as never)
      .mockReturnValueOnce(mockChain([{ filename: 'biology.pdf' }]) as never)
      .mockReturnValueOnce(mockChain([{ name: 'Dr Reviewer' }]) as never);

    const res = createRes();
    await listQueue(createReq({ query: { page: 1, limit: 10 } as any }), res, next);

    expect(res.json).toHaveBeenCalledWith({
      data: {
        items: [expect.objectContaining({
          id: 'review-1',
          question: 'What is ATP?',
          confidence: 82,
          document: 'biology.pdf',
          reviewer: 'Dr Reviewer',
          flags: 1,
        })],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      },
    });
  });

  it('falls back to default pagination when no query params are provided', async () => {
    mockedDb.select
      .mockReturnValueOnce(mockChain([]) as never)
      .mockReturnValueOnce(mockChain([{ total: 0 }]) as never);

    const res = createRes();
    await listQueue(createReq({ query: {} as any }), res, next);

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

  it('returns flattened review detail data for the editor screen', async () => {
    mockedDb.select
      .mockReturnValueOnce(mockChain([{
        id: 'review-1',
        workspaceId: 'ws-1',
        mcqRecordId: 'mcq-1',
        status: 'pending',
        assignedTo: 'reviewer-1',
      }]) as never)
      .mockReturnValueOnce(mockChain([{
        id: 'mcq-1',
        documentId: 'doc-1',
        questionText: 'What is ATP?',
        options: [
          { label: 'A', text: 'Energy currency' },
          { label: 'B', text: 'Protein' },
        ],
        correctAnswer: 'A',
        explanation: 'ATP stores usable energy.',
        confidence: 0.91,
        confidenceBreakdown: { extraction: 0.92, validation: 0.9 },
        sourcePage: 3,
        sourceExcerpt: 'ATP is the energy currency of the cell.',
        difficulty: 'medium',
        flags: ['biology'],
      }]) as never)
      .mockReturnValueOnce(mockChain([{ id: 'action-1', actionType: 'flag' }]) as never)
      .mockReturnValueOnce(mockChain([{ filename: 'biology.pdf' }]) as never);

    const res = createRes();
    await getDetail(createReq({ params: { id: 'review-1' } as any }), res, next);

    expect(res.json).toHaveBeenCalledWith({
      data: expect.objectContaining({
        id: 'review-1',
        question: 'What is ATP?',
        options: ['Energy currency', 'Protein'],
        correctIndex: 0,
        confidence: 91,
        document: 'biology.pdf',
        page: 3,
        tags: ['biology'],
        actions: [{ id: 'action-1', actionType: 'flag' }],
      }),
    });
  });

  it('approves a review item inside a transaction and syncs MCQ review status', async () => {
    mockedDb.select.mockReturnValueOnce(mockChain([{
      id: 'review-1',
      workspaceId: 'ws-1',
      mcqRecordId: 'mcq-1',
    }]) as never);
    mockedDb.transaction.mockImplementation(async (callback: (tx: any) => Promise<unknown>) => {
      const tx = {
        insert: vi.fn().mockReturnValue({
          values: vi.fn().mockResolvedValue(undefined),
        }),
        update: vi.fn()
          .mockReturnValueOnce({
            set: vi.fn().mockReturnValue({
              where: vi.fn().mockReturnValue({
                returning: vi.fn().mockResolvedValue([{ id: 'review-1', status: 'approved' }]),
              }),
            }),
          })
          .mockReturnValueOnce({
            set: vi.fn().mockReturnValue({
              where: vi.fn().mockResolvedValue(undefined),
            }),
          }),
      };

      return callback(tx);
    });

    const res = createRes();
    await approve(createReq({ params: { id: 'review-1' } as any }), res, next);

    expect(res.json).toHaveBeenCalledWith({ data: { id: 'review-1', status: 'approved' } });
  });

  it('persists review edits and writes MCQ history', async () => {
    mockedDb.select
      .mockReturnValueOnce(mockChain([{
        id: 'review-1',
        workspaceId: 'ws-1',
        mcqRecordId: 'mcq-1',
      }]) as never)
      .mockReturnValueOnce(mockChain([{
        id: 'mcq-1',
        version: 2,
      }]) as never);
    mockedDb.insert.mockReturnValue(mockChain([]) as never);
    mockedDb.update.mockReturnValue(mockChain([]) as never);

    const res = createRes();
    await edit(
      createReq({
        params: { id: 'review-1' } as any,
        body: {
          question: 'Updated question?',
          options: ['Correct', 'Incorrect'],
          correctIndex: 0,
          explanation: 'Updated explanation',
          tags: ['updated'],
        },
      }),
      res,
      next,
    );

    expect(mockedDb.insert).toHaveBeenCalledTimes(2);
    expect(res.json).toHaveBeenCalledWith({ data: { message: 'Edit applied' } });
  });

  it('returns previous and next review ids for navigation', async () => {
    mockedDb.select.mockReturnValueOnce(mockChain([{ id: 'review-3' }, { id: 'review-2' }, { id: 'review-1' }]) as never);

    const res = createRes();
    await navigation(createReq({ params: { id: 'review-2' } as any }), res, next);

    expect(res.json).toHaveBeenCalledWith({
      data: {
        ids: ['review-3', 'review-2', 'review-1'],
        previousId: 'review-3',
        nextId: 'review-1',
        hasPrevious: true,
        hasNext: true,
        currentIndex: 2,
        totalCount: 3,
      },
    });
  });
});
