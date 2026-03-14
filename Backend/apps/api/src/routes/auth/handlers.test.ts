import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { NextFunction, Request, Response } from 'express';

vi.mock('@mcq-platform/db', () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    transaction: vi.fn(),
  },
  users: { id: 'users.id', email: 'users.email', workspaceId: 'users.workspaceId' },
  workspaces: { id: 'workspaces.id', name: 'workspaces.name' },
  refreshTokens: { id: 'refresh.id', tokenHash: 'refresh.tokenHash', userId: 'refresh.userId', revokedAt: 'refresh.revokedAt' },
  invitationTokens: { id: 'invites.id', tokenHash: 'invites.tokenHash', userId: 'invites.userId', workspaceId: 'invites.workspaceId', acceptedAt: 'invites.acceptedAt', expiresAt: 'invites.expiresAt' },
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
    JWT_SECRET: 'test-secret-key-for-jwt-test-secret-key',
    NODE_ENV: 'test',
    CORS_ORIGIN: 'http://localhost:8080',
  },
}));

vi.mock('@mcq-platform/queue', () => ({
  enqueue: vi.fn(),
  QUEUE_NAMES: {
    NOTIFICATION: 'notification',
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

import { acceptInvitation, changePassword, getInvitation, login, logout, me, refresh, register } from './handlers.js';
import { db } from '@mcq-platform/db';
import { enqueue } from '@mcq-platform/queue';
import { hashPassword, signRefreshToken, signToken, verifyPassword, verifyToken } from '@mcq-platform/auth';

const mockedDb = vi.mocked(db);
const mockedEnqueue = vi.mocked(enqueue);
const mockedHashPassword = vi.mocked(hashPassword);
const mockedSignToken = vi.mocked(signToken);
const mockedSignRefreshToken = vi.mocked(signRefreshToken);
const mockedVerifyPassword = vi.mocked(verifyPassword);
const mockedVerifyToken = vi.mocked(verifyToken);

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
  return {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
    cookie: vi.fn().mockReturnThis(),
    clearCookie: vi.fn().mockReturnThis(),
  } as unknown as Response;
}

function mockChain(result: unknown) {
  const chain: Record<string, unknown> = {};
  chain.from = vi.fn().mockReturnValue(chain);
  chain.where = vi.fn().mockReturnValue(chain);
  chain.limit = vi.fn().mockReturnValue(chain);
  chain.innerJoin = vi.fn().mockReturnValue(chain);
  chain.orderBy = vi.fn().mockReturnValue(chain);
  chain.values = vi.fn().mockReturnValue(chain);
  chain.returning = vi.fn().mockResolvedValue(result);
  chain.set = vi.fn().mockReturnValue(chain);
  chain.then = vi.fn().mockImplementation((resolve: (value: unknown) => unknown) => resolve(result));
  return chain;
}

describe('auth handlers', () => {
  let next: NextFunction;

  beforeEach(() => {
    vi.clearAllMocks();
    next = vi.fn();
  });

  it('returns 401 for unknown login email', async () => {
    mockedDb.select.mockReturnValueOnce(mockChain([]) as never);

    await login(
      createReq({ body: { email: 'missing@example.com', password: 'Password1!' } }),
      createRes(),
      next,
    );

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401, code: 'INVALID_CREDENTIALS' }));
  });

  it('registers a workspace admin and sets auth cookies', async () => {
    mockedDb.select.mockReturnValueOnce(mockChain([]) as never);
    mockedHashPassword.mockResolvedValue('hashed-password');
    mockedSignToken.mockReturnValue('access-token');
    mockedSignRefreshToken.mockReturnValue('refresh-token');
    mockedDb.insert.mockReturnValue(mockChain([]) as never);
    mockedDb.transaction.mockImplementation(async (callback: (tx: any) => Promise<unknown>) => {
      const tx = {
        insert: vi.fn()
          .mockReturnValueOnce({
            values: vi.fn().mockReturnValue({
              returning: vi.fn().mockResolvedValue([{ id: 'ws-1', name: 'Workspace One' }]),
            }),
          })
          .mockReturnValueOnce({
            values: vi.fn().mockReturnValue({
              returning: vi.fn().mockResolvedValue([{
                id: 'user-1',
                email: 'owner@example.com',
                name: 'Owner',
                role: 'workspace_admin',
              }]),
            }),
          }),
      };

      return callback(tx);
    });

    const res = createRes();
    await register(
      createReq({
        body: {
          email: 'owner@example.com',
          password: 'Password1!',
          name: 'Owner',
          workspaceName: 'Workspace One',
        },
      }),
      res,
      next,
    );

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.cookie).toHaveBeenCalledTimes(2);
    expect(res.json).toHaveBeenCalledWith({
      data: {
        user: {
          id: 'user-1',
          email: 'owner@example.com',
          name: 'Owner',
          role: 'workspace_admin',
          workspaceId: 'ws-1',
        },
        token: 'access-token',
      },
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('returns invitation metadata for a valid invite token', async () => {
    mockedDb.select.mockReturnValueOnce(mockChain([{
      email: 'invitee@example.com',
      role: 'reviewer',
      workspaceId: 'ws-1',
      workspaceName: 'Workspace One',
      name: 'Invitee',
      expiresAt: new Date(Date.now() + 60_000),
      acceptedAt: null,
    }]) as never);

    const res = createRes();
    await getInvitation(createReq({ params: { token: 'opaque-token' } as any }), res, next);

    expect(res.json).toHaveBeenCalledWith({
      data: expect.objectContaining({
        email: 'invitee@example.com',
        role: 'reviewer',
        workspaceName: 'Workspace One',
        status: 'pending',
        expired: false,
        accepted: false,
      }),
    });
  });

  it('accepts an invitation, revokes old sessions, and enqueues a notification', async () => {
    mockedDb.select.mockReturnValueOnce(mockChain([{
      id: 'invite-1',
      workspaceId: 'ws-1',
      userId: 'user-2',
      expiresAt: new Date(Date.now() + 60_000),
      acceptedAt: null,
      role: 'reviewer',
      email: 'invitee@example.com',
    }]) as never);
    mockedHashPassword.mockResolvedValue('new-password-hash');
    mockedSignToken.mockReturnValue('accepted-access-token');
    mockedSignRefreshToken.mockReturnValue('accepted-refresh-token');
    mockedDb.insert.mockReturnValue(mockChain([]) as never);
    mockedDb.transaction.mockImplementation(async (callback: (tx: any) => Promise<unknown>) => {
      const tx = {
        update: vi.fn()
          .mockReturnValueOnce({
            set: vi.fn().mockReturnValue({
              where: vi.fn().mockReturnValue({
                returning: vi.fn().mockResolvedValue([{
                  id: 'user-2',
                  name: 'Accepted User',
                  role: 'reviewer',
                }]),
              }),
            }),
          })
          .mockReturnValueOnce({
            set: vi.fn().mockReturnValue({
              where: vi.fn().mockResolvedValue(undefined),
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
    await acceptInvitation(
      createReq({
        body: {
          token: 'opaque-token',
          name: 'Accepted User',
          password: 'Password1!',
        },
      }),
      res,
      next,
    );

    expect(res.cookie).toHaveBeenCalledTimes(2);
    expect(res.json).toHaveBeenCalledWith({
      data: {
        user: {
          id: 'user-2',
          email: 'invitee@example.com',
          name: 'Accepted User',
          role: 'reviewer',
          workspaceId: 'ws-1',
        },
        token: 'accepted-access-token',
      },
    });
    expect(mockedEnqueue).toHaveBeenCalledWith('notification', expect.objectContaining({
      type: 'user.invitation_accepted',
      workspaceId: 'ws-1',
      userId: 'user-2',
    }));
  });

  it('refreshes an access token for a valid session', async () => {
    mockedVerifyToken.mockReturnValue({ sub: 'user-1' } as never);
    mockedDb.select
      .mockReturnValueOnce(mockChain([{ id: 'rt-1', revokedAt: null }]) as never)
      .mockReturnValueOnce(mockChain([{ id: 'user-1', status: 'active', workspaceId: 'ws-1', role: 'operator' }]) as never);
    mockedSignToken.mockReturnValue('new-access-token');

    const res = createRes();
    await refresh(createReq({ cookies: { refresh_token: 'refresh-token' } as any }), res, next);

    expect(res.cookie).toHaveBeenCalledWith('access_token', 'new-access-token', expect.any(Object));
    expect(res.json).toHaveBeenCalledWith({ data: { token: 'new-access-token' } });
  });

  it('changes the current user password', async () => {
    mockedDb.select.mockReturnValueOnce(mockChain([{ id: 'user-1', passwordHash: 'old-hash' }]) as never);
    mockedVerifyPassword.mockResolvedValue(true);
    mockedHashPassword.mockResolvedValue('new-hash');
    mockedDb.update.mockReturnValue(mockChain([]) as never);

    const res = createRes();
    await changePassword(
      createReq({ body: { currentPassword: 'OldPass1!', newPassword: 'NewPass1!' } }),
      res,
      next,
    );

    expect(res.json).toHaveBeenCalledWith({ data: { message: 'Password changed successfully' } });
  });

  it('returns the authenticated user through /auth/me', async () => {
    mockedDb.select.mockReturnValueOnce(mockChain([{
      id: 'user-1',
      email: 'owner@example.com',
      name: 'Owner',
      role: 'workspace_admin',
      status: 'active',
      workspaceId: 'ws-1',
      avatarUrl: null,
      lastActiveAt: null,
      createdAt: new Date('2026-03-13T00:00:00.000Z'),
    }]) as never);

    const res = createRes();
    await me(createReq(), res, next);

    expect(res.json).toHaveBeenCalledWith({
      data: {
        user: expect.objectContaining({
          id: 'user-1',
          email: 'owner@example.com',
          workspaceId: 'ws-1',
        }),
      },
    });
  });

  it('clears cookies on logout', async () => {
    mockedDb.update.mockReturnValue(mockChain([]) as never);
    const res = createRes();

    await logout(createReq({ cookies: { refresh_token: 'refresh-token' } as any }), res, next);

    expect(res.clearCookie).toHaveBeenCalledTimes(2);
    expect(res.json).toHaveBeenCalledWith({ data: { message: 'Logged out' } });
  });
});
