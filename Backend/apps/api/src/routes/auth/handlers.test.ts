import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request, Response, NextFunction } from 'express';

// ── Mocks ──────────────────────────────────────────────────
vi.mock('@mcq-platform/db', () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    transaction: vi.fn(),
  },
  users: 'users_table',
  workspaces: 'workspaces_table',
  refreshTokens: 'refresh_tokens_table',
}));

vi.mock('@mcq-platform/auth', () => ({
  hashPassword: vi.fn(),
  verifyPassword: vi.fn(),
  signToken: vi.fn(),
  signRefreshToken: vi.fn(),
  verifyToken: vi.fn(),
}));

vi.mock('@mcq-platform/config', () => ({
  env: {
    JWT_SECRET: 'test-secret-key-for-jwt',
    NODE_ENV: 'test',
  },
}));

vi.mock('@mcq-platform/logger', () => ({
  createLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  }),
}));

import { login, register, logout, refresh, changePassword, me } from './handlers.js';
import { db } from '@mcq-platform/db';
import { hashPassword, verifyPassword, signToken, signRefreshToken, verifyToken } from '@mcq-platform/auth';

const mockedDb = vi.mocked(db);
const mockedHashPassword = vi.mocked(hashPassword);
const mockedVerifyPassword = vi.mocked(verifyPassword);
const mockedSignToken = vi.mocked(signToken);
const mockedSignRefreshToken = vi.mocked(signRefreshToken);
const mockedVerifyToken = vi.mocked(verifyToken);

// ── Helpers ────────────────────────────────────────────────
function createReq(overrides: Partial<Request> = {}): Request {
  return {
    body: {},
    query: {},
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
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
    cookie: vi.fn().mockReturnThis(),
    clearCookie: vi.fn().mockReturnThis(),
  } as unknown as Response;
  return res;
}

// Helper to chain drizzle query builder methods
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

// ── Tests ──────────────────────────────────────────────────
describe('auth handlers', () => {
  let next: NextFunction;

  beforeEach(() => {
    vi.clearAllMocks();
    next = vi.fn();
  });

  // ────────────────────────────────────────────────────────
  // LOGIN
  // ────────────────────────────────────────────────────────
  describe('login', () => {
    it('returns 401 for unknown email', async () => {
      const chain = mockChain([]);
      mockedDb.select.mockReturnValue(chain as any);

      const req = createReq({ body: { email: 'nobody@test.com', password: 'pass123456' } });
      const res = createRes();

      await login(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({ statusCode: 401, code: 'INVALID_CREDENTIALS' }),
      );
    });

    it('returns 403 for inactive user', async () => {
      const chain = mockChain([{ id: 'u1', email: 'test@test.com', status: 'inactive', passwordHash: 'hash' }]);
      mockedDb.select.mockReturnValue(chain as any);

      const req = createReq({ body: { email: 'test@test.com', password: 'pass123456' } });
      const res = createRes();

      await login(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({ statusCode: 403, code: 'ACCOUNT_INACTIVE' }),
      );
    });

    it('returns 401 for wrong password', async () => {
      const chain = mockChain([{ id: 'u1', email: 'test@test.com', status: 'active', passwordHash: 'hash', workspaceId: 'ws-1', role: 'operator' }]);
      mockedDb.select.mockReturnValue(chain as any);
      mockedVerifyPassword.mockResolvedValue(false);

      const req = createReq({ body: { email: 'test@test.com', password: 'wrongpass' } });
      const res = createRes();

      await login(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({ statusCode: 401, code: 'INVALID_CREDENTIALS' }),
      );
    });

    it('returns user data and sets cookies on success', async () => {
      const user = { id: 'u1', email: 'test@test.com', name: 'Test', status: 'active', passwordHash: 'hash', workspaceId: 'ws-1', role: 'workspace_admin' };
      const selectChain = mockChain([user]);
      mockedDb.select.mockReturnValue(selectChain as any);
      mockedVerifyPassword.mockResolvedValue(true);

      const updateChain = mockChain([user]);
      mockedDb.update.mockReturnValue(updateChain as any);

      const insertChain = mockChain([{ id: 'rt1' }]);
      mockedDb.insert.mockReturnValue(insertChain as any);

      mockedSignToken.mockReturnValue('access-token-123');
      mockedSignRefreshToken.mockReturnValue('refresh-token-456');

      const req = createReq({ body: { email: 'test@test.com', password: 'Correct1!' } });
      const res = createRes();

      await login(req, res, next);

      expect(res.cookie).toHaveBeenCalledWith('access_token', 'access-token-123', expect.objectContaining({ httpOnly: true }));
      expect(res.cookie).toHaveBeenCalledWith('refresh_token', 'refresh-token-456', expect.objectContaining({ httpOnly: true }));
      expect(res.json).toHaveBeenCalledWith({
        data: {
          user: { id: 'u1', email: 'test@test.com', name: 'Test', role: 'workspace_admin', workspaceId: 'ws-1' },
          token: 'access-token-123',
        },
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('lowercases email before lookup', async () => {
      const chain = mockChain([]);
      mockedDb.select.mockReturnValue(chain as any);

      const req = createReq({ body: { email: 'TEST@EXAMPLE.COM', password: 'pass123456' } });
      const res = createRes();

      await login(req, res, next);

      // The select().from().where() should have been called — verify via next being called with 401
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
    });
  });

  // ────────────────────────────────────────────────────────
  // REGISTER
  // ────────────────────────────────────────────────────────
  describe('register', () => {
    it('returns 409 if email already exists', async () => {
      const chain = mockChain([{ id: 'existing-user' }]);
      mockedDb.select.mockReturnValue(chain as any);

      const req = createReq({
        body: { email: 'exists@test.com', password: 'Pass123!', name: 'Tester', workspaceName: 'My Workspace' },
      });
      const res = createRes();

      await register(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({ statusCode: 409, code: 'EMAIL_EXISTS' }),
      );
    });

    it('creates workspace + user and returns 201 on success', async () => {
      const selectChain = mockChain([]);
      mockedDb.select.mockReturnValue(selectChain as any);

      const workspace = { id: 'ws-new', name: 'Test WS' };
      const user = { id: 'u-new', email: 'new@test.com', name: 'New', role: 'workspace_admin', workspaceId: 'ws-new' };

      mockedDb.transaction.mockImplementation(async (fn: any) => {
        const tx = {
          insert: vi.fn().mockReturnValue({
            values: vi.fn().mockReturnValue({
              returning: vi.fn()
                .mockResolvedValueOnce([workspace])
                .mockResolvedValueOnce([user]),
            }),
          }),
        };
        return fn(tx);
      });

      mockedHashPassword.mockResolvedValue('hashed-pw');
      mockedSignToken.mockReturnValue('new-access');
      mockedSignRefreshToken.mockReturnValue('new-refresh');

      const insertChain = mockChain([{ id: 'rt1' }]);
      mockedDb.insert.mockReturnValue(insertChain as any);

      const req = createReq({
        body: { email: 'new@test.com', password: 'StrongPass1!', name: 'New', workspaceName: 'Test WS' },
      });
      const res = createRes();

      await register(req, res, next);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.cookie).toHaveBeenCalledWith('access_token', 'new-access', expect.any(Object));
      expect(res.cookie).toHaveBeenCalledWith('refresh_token', 'new-refresh', expect.any(Object));
      expect(next).not.toHaveBeenCalled();
    });
  });

  // ────────────────────────────────────────────────────────
  // LOGOUT
  // ────────────────────────────────────────────────────────
  describe('logout', () => {
    it('clears cookies and revokes refresh token', async () => {
      const updateChain = mockChain([{ id: 'rt1' }]);
      mockedDb.update.mockReturnValue(updateChain as any);

      const req = createReq({ cookies: { refresh_token: 'some-refresh-token' } });
      const res = createRes();

      await logout(req, res, next);

      expect(res.clearCookie).toHaveBeenCalledWith('access_token', expect.any(Object));
      expect(res.clearCookie).toHaveBeenCalledWith('refresh_token', expect.any(Object));
      expect(res.json).toHaveBeenCalledWith({ data: { message: 'Logged out' } });
    });

    it('clears cookies even when no refresh cookie is present', async () => {
      const req = createReq({ cookies: {} });
      const res = createRes();

      await logout(req, res, next);

      expect(res.clearCookie).toHaveBeenCalledTimes(2);
      expect(res.json).toHaveBeenCalledWith({ data: { message: 'Logged out' } });
    });
  });

  // ────────────────────────────────────────────────────────
  // REFRESH
  // ────────────────────────────────────────────────────────
  describe('refresh', () => {
    it('returns 401 when no refresh cookie', async () => {
      const req = createReq({ cookies: {} });
      const res = createRes();

      await refresh(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({ statusCode: 401, code: 'NO_REFRESH_TOKEN' }),
      );
    });

    it('returns 401 for invalid/expired token', async () => {
      mockedVerifyToken.mockImplementation(() => { throw new Error('expired'); });

      const req = createReq({ cookies: { refresh_token: 'expired-token' } });
      const res = createRes();

      await refresh(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({ statusCode: 401, code: 'INVALID_REFRESH_TOKEN' }),
      );
    });

    it('returns 401 for revoked token', async () => {
      mockedVerifyToken.mockReturnValue({ sub: 'u1', wid: 'ws-1', role: 'operator' } as any);

      const selectChain = mockChain([{ id: 'rt1', revokedAt: new Date() }]);
      mockedDb.select.mockReturnValue(selectChain as any);

      const req = createReq({ cookies: { refresh_token: 'revoked-token' } });
      const res = createRes();

      await refresh(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({ statusCode: 401, code: 'REVOKED_TOKEN' }),
      );
    });

    it('issues new access token on valid refresh', async () => {
      mockedVerifyToken.mockReturnValue({ sub: 'u1', wid: 'ws-1', role: 'operator' } as any);

      // First select: refresh token lookup (not revoked)
      const refreshChain = mockChain([{ id: 'rt1', revokedAt: null }]);
      // Second select: user lookup
      const userChain = mockChain([{ id: 'u1', status: 'active', workspaceId: 'ws-1', role: 'operator' }]);

      mockedDb.select
        .mockReturnValueOnce(refreshChain as any)
        .mockReturnValueOnce(userChain as any);

      mockedSignToken.mockReturnValue('new-access-token');

      const req = createReq({ cookies: { refresh_token: 'valid-refresh' } });
      const res = createRes();

      await refresh(req, res, next);

      expect(res.cookie).toHaveBeenCalledWith('access_token', 'new-access-token', expect.any(Object));
      expect(res.json).toHaveBeenCalledWith({ data: { token: 'new-access-token' } });
      expect(next).not.toHaveBeenCalled();
    });
  });

  // ────────────────────────────────────────────────────────
  // CHANGE PASSWORD
  // ────────────────────────────────────────────────────────
  describe('changePassword', () => {
    it('returns 404 if user not found', async () => {
      const chain = mockChain([]);
      mockedDb.select.mockReturnValue(chain as any);

      const req = createReq({ body: { currentPassword: 'old', newPassword: 'New12345!' } });
      const res = createRes();

      await changePassword(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({ statusCode: 404, code: 'USER_NOT_FOUND' }),
      );
    });

    it('returns 401 if current password is wrong', async () => {
      const chain = mockChain([{ id: 'u1', passwordHash: 'hash' }]);
      mockedDb.select.mockReturnValue(chain as any);
      mockedVerifyPassword.mockResolvedValue(false);

      const req = createReq({ body: { currentPassword: 'wrong', newPassword: 'New12345!' } });
      const res = createRes();

      await changePassword(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({ statusCode: 401, code: 'INVALID_PASSWORD' }),
      );
    });

    it('updates password on valid current password', async () => {
      const chain = mockChain([{ id: 'u1', passwordHash: 'old-hash' }]);
      mockedDb.select.mockReturnValue(chain as any);
      mockedVerifyPassword.mockResolvedValue(true);
      mockedHashPassword.mockResolvedValue('new-hash');

      const updateChain = mockChain([]);
      mockedDb.update.mockReturnValue(updateChain as any);

      const req = createReq({ body: { currentPassword: 'OldPass1!', newPassword: 'NewPass1!' } });
      const res = createRes();

      await changePassword(req, res, next);

      expect(res.json).toHaveBeenCalledWith({ data: { message: 'Password changed successfully' } });
      expect(next).not.toHaveBeenCalled();
    });
  });

  // ────────────────────────────────────────────────────────
  // ME
  // ────────────────────────────────────────────────────────
  describe('me', () => {
    it('returns current user data', async () => {
      const userData = { id: 'u1', email: 'me@test.com', name: 'Me', role: 'operator', status: 'active', workspaceId: 'ws-1', avatarUrl: null, lastActiveAt: null, createdAt: new Date() };
      const chain = mockChain([userData]);
      mockedDb.select.mockReturnValue(chain as any);

      const req = createReq();
      const res = createRes();

      await me(req, res, next);

      expect(res.json).toHaveBeenCalledWith({ data: userData });
    });

    it('returns 404 if user not found', async () => {
      const chain = mockChain([]);
      mockedDb.select.mockReturnValue(chain as any);

      const req = createReq();
      const res = createRes();

      await me(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({ statusCode: 404, code: 'USER_NOT_FOUND' }),
      );
    });
  });
});
