import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request, Response, NextFunction } from 'express';

vi.mock('@mcq-platform/db', () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  projects: 'projects_table',
  documents: 'documents_table',
  mcqRecords: 'mcq_records_table',
}));

vi.mock('@mcq-platform/logger', () => ({
  createLogger: () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }),
}));

import { list, create, getById, update, remove } from './handlers.js';
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
    userRole: 'workspace_admin',
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

describe('projects handlers', () => {
  let next: NextFunction;

  beforeEach(() => {
    vi.clearAllMocks();
    next = vi.fn();
  });

  describe('list', () => {
    it('returns paginated projects enriched with counts', async () => {
      const projects = [{ id: 'p1', name: 'Bio', status: 'active', createdAt: new Date() }];
      const projectsChain = mockChain(projects);
      const totalChain = mockChain([{ total: 1 }]);
      const docCountChain = mockChain([{ count: 5 }]);
      const mcqCountChain = mockChain([{ count: 12 }]);

      mockedDb.select
        .mockReturnValueOnce(projectsChain as any)
        .mockReturnValueOnce(totalChain as any)
        .mockReturnValueOnce(docCountChain as any)
        .mockReturnValueOnce(mcqCountChain as any);

      const req = createReq({ query: { page: 1, limit: 10 } as any });
      const res = createRes();

      await list(req, res, next);

      const response = (res.json as any).mock.calls[0][0].data;
      expect(response.items[0].documentsCount).toBe(5);
      expect(response.items[0].mcqCount).toBe(12);
      expect(response.total).toBe(1);
    });
  });

  describe('create', () => {
    it('creates a project and returns 201', async () => {
      const project = { id: 'p-new', name: 'New Project', workspaceId: 'ws-1' };
      const chain = mockChain([project]);
      mockedDb.insert.mockReturnValue(chain as any);

      const req = createReq({ body: { name: 'New Project', description: 'A test project' } });
      const res = createRes();

      await create(req, res, next);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ data: project });
    });
  });

  describe('getById', () => {
    it('returns project with doc and mcq counts', async () => {
      const project = { id: 'p1', name: 'Bio' };
      const projectChain = mockChain([project]);
      const docCountChain = mockChain([{ count: 3 }]);
      const mcqCountChain = mockChain([{ count: 8 }]);

      mockedDb.select
        .mockReturnValueOnce(projectChain as any)
        .mockReturnValueOnce(docCountChain as any)
        .mockReturnValueOnce(mcqCountChain as any);

      const req = createReq({ params: { id: 'p1' } as any });
      const res = createRes();

      await getById(req, res, next);

      const response = (res.json as any).mock.calls[0][0].data;
      expect(response.documentsCount).toBe(3);
      expect(response.mcqCount).toBe(8);
    });

    it('returns 404 for missing project', async () => {
      const chain = mockChain([]);
      mockedDb.select.mockReturnValue(chain as any);

      const req = createReq({ params: { id: 'none' } as any });
      const res = createRes();

      await getById(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 404 }));
    });
  });

  describe('update', () => {
    it('updates project and returns it', async () => {
      const updated = { id: 'p1', name: 'Renamed' };
      const chain = mockChain([updated]);
      mockedDb.update.mockReturnValue(chain as any);

      const req = createReq({ params: { id: 'p1' } as any, body: { name: 'Renamed' } });
      const res = createRes();

      await update(req, res, next);

      expect(res.json).toHaveBeenCalledWith({ data: updated });
    });

    it('returns 404 when updating nonexistent project', async () => {
      const chain = mockChain([]);
      chain.returning = vi.fn().mockResolvedValue([]);
      mockedDb.update.mockReturnValue(chain as any);

      const req = createReq({ params: { id: 'gone' } as any, body: { name: 'X' } });
      const res = createRes();

      await update(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 404 }));
    });
  });

  describe('remove', () => {
    it('deletes project and returns success', async () => {
      const chain = mockChain([{ id: 'p1' }]);
      mockedDb.delete.mockReturnValue(chain as any);

      const req = createReq({ params: { id: 'p1' } as any });
      const res = createRes();

      await remove(req, res, next);

      expect(res.json).toHaveBeenCalledWith({ data: { message: 'Project deleted' } });
    });

    it('returns 404 when deleting nonexistent project', async () => {
      const chain = mockChain([]);
      chain.returning = vi.fn().mockResolvedValue([]);
      mockedDb.delete.mockReturnValue(chain as any);

      const req = createReq({ params: { id: 'gone' } as any });
      const res = createRes();

      await remove(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 404 }));
    });
  });
});
