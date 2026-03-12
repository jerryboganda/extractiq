import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request, Response, NextFunction } from 'express';

vi.mock('@mcq-platform/db', () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
  },
  users: 'users_table',
}));

vi.mock('@mcq-platform/auth', () => ({
  hashPassword: vi.fn(),
  canManageRole: vi.fn(),
}));

vi.mock('@mcq-platform/logger', () => ({
  createLogger: () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }),
}));

import { list, invite, update, deactivate } from './handlers.js';
import { db } from '@mcq-platform/db';
import { hashPassword, canManageRole } from '@mcq-platform/auth';

const mockedDb = vi.mocked(db);
const mockedHashPassword = vi.mocked(hashPassword);
const mockedCanManageRole = vi.mocked(canManageRole);

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

describe('users handlers', () => {
  let next: NextFunction;

  beforeEach(() => {
    vi.clearAllMocks();
    next = vi.fn();
  });

  describe('list', () => {
    it('returns paginated users with initials', async () => {
      const items = [
        { id: 'u1', email: 'john@test.com', name: 'John Doe', role: 'operator', status: 'active', lastActiveAt: null, createdAt: new Date() },
      ];
      const itemsChain = mockChain(items);
      const countChain = mockChain([{ total: 1 }]);

      mockedDb.select
        .mockReturnValueOnce(itemsChain as any)
        .mockReturnValueOnce(countChain as any);

      const req = createReq({ query: { page: 1, limit: 10 } as any });
      const res = createRes();

      await list(req, res, next);

      const response = (res.json as any).mock.calls[0][0].data;
      expect(response.items[0].initials).toBe('JD');
      expect(response.total).toBe(1);
    });
  });

  describe('invite', () => {
    it('creates user with invited status on success', async () => {
      mockedCanManageRole.mockReturnValue(true);

      // Check existing user — not found
      const existingChain = mockChain([]);
      mockedDb.select.mockReturnValue(existingChain as any);

      mockedHashPassword.mockResolvedValue('temp-hash');

      const newUser = { id: 'u-new', email: 'new@test.com', name: 'new', role: 'operator', status: 'invited' };
      const insertChain = mockChain([newUser]);
      mockedDb.insert.mockReturnValue(insertChain as any);

      const req = createReq({ body: { email: 'new@test.com', role: 'operator' } });
      const res = createRes();

      await invite(req, res, next);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        data: { id: 'u-new', email: 'new@test.com', name: 'new', role: 'operator', status: 'invited' },
      });
    });

    it('returns 403 when role hierarchy is violated', async () => {
      mockedCanManageRole.mockReturnValue(false);

      const req = createReq({ body: { email: 'admin@test.com', role: 'super_admin' } });
      const res = createRes();

      await invite(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({ statusCode: 403, code: 'FORBIDDEN' }),
      );
    });

    it('returns 409 when user already exists', async () => {
      mockedCanManageRole.mockReturnValue(true);
      const existingChain = mockChain([{ id: 'existing' }]);
      mockedDb.select.mockReturnValue(existingChain as any);

      const req = createReq({ body: { email: 'exists@test.com', role: 'operator' } });
      const res = createRes();

      await invite(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({ statusCode: 409, code: 'USER_EXISTS' }),
      );
    });
  });

  describe('update', () => {
    it('returns 400 when trying to change own role', async () => {
      const target = { id: 'user-1', workspaceId: 'ws-1' };
      const chain = mockChain([target]);
      mockedDb.select.mockReturnValue(chain as any);

      const req = createReq({ params: { id: 'user-1' } as any, body: { role: 'operator' } });
      const res = createRes();

      await update(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({ statusCode: 400, code: 'CANNOT_CHANGE_OWN_ROLE' }),
      );
    });

    it('returns 403 when assigning higher role', async () => {
      const target = { id: 'u2', workspaceId: 'ws-1' };
      const chain = mockChain([target]);
      mockedDb.select.mockReturnValue(chain as any);
      mockedCanManageRole.mockReturnValue(false);

      const req = createReq({ params: { id: 'u2' } as any, body: { role: 'super_admin' } });
      const res = createRes();

      await update(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({ statusCode: 403, code: 'FORBIDDEN' }),
      );
    });

    it('updates user successfully', async () => {
      const target = { id: 'u2', workspaceId: 'ws-1' };
      const selectChain = mockChain([target]);
      mockedDb.select.mockReturnValue(selectChain as any);
      mockedCanManageRole.mockReturnValue(true);

      const updated = { id: 'u2', email: 'u2@test.com', name: 'Updated', role: 'reviewer', status: 'active' };
      const updateChain = mockChain([updated]);
      mockedDb.update.mockReturnValue(updateChain as any);

      const req = createReq({ params: { id: 'u2' } as any, body: { role: 'reviewer', name: 'Updated' } });
      const res = createRes();

      await update(req, res, next);

      expect(res.json).toHaveBeenCalledWith({ data: updated });
    });
  });

  describe('deactivate', () => {
    it('returns 400 when deactivating self', async () => {
      const req = createReq({ params: { id: 'user-1' } as any });
      const res = createRes();

      await deactivate(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({ statusCode: 400, code: 'CANNOT_DEACTIVATE_SELF' }),
      );
    });

    it('deactivates another user', async () => {
      const chain = mockChain([{ id: 'u2', status: 'inactive' }]);
      mockedDb.update.mockReturnValue(chain as any);

      const req = createReq({ params: { id: 'u2' } as any });
      const res = createRes();

      await deactivate(req, res, next);

      expect(res.json).toHaveBeenCalledWith({ data: { message: 'User deactivated' } });
    });

    it('returns 404 for nonexistent user', async () => {
      const chain = mockChain([]);
      chain.returning = vi.fn().mockResolvedValue([]);
      mockedDb.update.mockReturnValue(chain as any);

      const req = createReq({ params: { id: 'no-user' } as any });
      const res = createRes();

      await deactivate(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 404 }));
    });
  });
});
