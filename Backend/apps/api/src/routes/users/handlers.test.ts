import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { NextFunction, Request, Response } from 'express';

vi.mock('@mcq-platform/db', () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    transaction: vi.fn(),
  },
  users: { id: 'users.id', workspaceId: 'users.workspaceId', email: 'users.email', createdAt: 'users.createdAt' },
  invitationTokens: { id: 'invites.id' },
  workspaces: { id: 'workspaces.id', name: 'workspaces.name' },
}));

vi.mock('@mcq-platform/auth', () => ({
  hashPassword: vi.fn(),
  canManageRole: vi.fn(),
}));

vi.mock('@mcq-platform/config', () => ({
  env: {
    APP_BASE_URL: 'http://localhost:8080/app',
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

import { deactivate, invite, list, update } from './handlers.js';
import { db } from '@mcq-platform/db';
import { canManageRole, hashPassword } from '@mcq-platform/auth';
import { enqueue } from '@mcq-platform/queue';

const mockedDb = vi.mocked(db);
const mockedCanManageRole = vi.mocked(canManageRole);
const mockedHashPassword = vi.mocked(hashPassword);
const mockedEnqueue = vi.mocked(enqueue);

function createReq(overrides: Partial<Request> = {}): Request {
  return {
    body: {},
    query: { page: 1, limit: 20 },
    params: {},
    workspaceId: 'ws-1',
    userId: 'admin-1',
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
  chain.returning = vi.fn().mockResolvedValue(result);
  chain.set = vi.fn().mockReturnValue(chain);
  chain.then = vi.fn().mockImplementation((resolve: (value: unknown) => unknown) => resolve(result));
  return chain;
}

describe('users handlers', () => {
  let next: NextFunction;

  beforeEach(() => {
    vi.clearAllMocks();
    next = vi.fn();
  });

  it('lists paginated workspace users with initials', async () => {
    mockedDb.select
      .mockReturnValueOnce(mockChain([{
        id: 'user-1',
        email: 'jane@example.com',
        name: 'Jane Doe',
        role: 'reviewer',
        status: 'active',
        lastActiveAt: null,
        createdAt: new Date('2026-03-13T00:00:00.000Z'),
      }]) as never)
      .mockReturnValueOnce(mockChain([{ total: 1 }]) as never);

    const res = createRes();
    await list(createReq({ query: { page: 1, limit: 10 } as any }), res, next);

    expect(res.json).toHaveBeenCalledWith({
      data: {
        items: [expect.objectContaining({
          id: 'user-1',
          initials: 'JD',
        })],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      },
    });
  });

  it('creates an invited user, token, and invitation notification', async () => {
    mockedCanManageRole.mockReturnValue(true);
    mockedHashPassword.mockResolvedValue('temporary-password-hash');
    mockedDb.select
      .mockReturnValueOnce(mockChain([]) as never)
      .mockReturnValueOnce(mockChain([{ workspaceName: 'Workspace One' }]) as never);
    mockedDb.transaction.mockImplementation(async (callback: (tx: any) => Promise<unknown>) => {
      const tx = {
        insert: vi.fn()
          .mockReturnValueOnce({
            values: vi.fn().mockReturnValue({
              returning: vi.fn().mockResolvedValue([{
                id: 'user-2',
                email: 'invitee@example.com',
                name: 'invitee',
                role: 'reviewer',
                status: 'invited',
              }]),
            }),
          })
          .mockReturnValueOnce({
            values: vi.fn().mockResolvedValue(undefined),
          }),
      };

      return callback(tx);
    });

    const res = createRes();
    await invite(
      createReq({ body: { email: 'invitee@example.com', role: 'reviewer' } }),
      res,
      next,
    );

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      data: expect.objectContaining({
        id: 'user-2',
        email: 'invitee@example.com',
        role: 'reviewer',
        status: 'invited',
        invitationUrl: expect.stringContaining('/accept-invite?token='),
      }),
    });
    expect(mockedEnqueue).toHaveBeenCalledWith('notification', expect.objectContaining({
      type: 'user_invited',
      emails: [expect.objectContaining({ to: 'invitee@example.com' })],
    }));
  });

  it('updates another user role within the workspace', async () => {
    mockedDb.select.mockReturnValueOnce(mockChain([{ id: 'user-2', workspaceId: 'ws-1' }]) as never);
    mockedCanManageRole.mockReturnValue(true);
    mockedDb.update.mockReturnValueOnce(mockChain([{
      id: 'user-2',
      email: 'invitee@example.com',
      name: 'Invitee',
      role: 'operator',
      status: 'active',
    }]) as never);

    const res = createRes();
    await update(
      createReq({ params: { id: 'user-2' } as any, body: { role: 'operator', name: 'Invitee' } }),
      res,
      next,
    );

    expect(res.json).toHaveBeenCalledWith({
      data: {
        id: 'user-2',
        email: 'invitee@example.com',
        name: 'Invitee',
        role: 'operator',
        status: 'active',
      },
    });
  });

  it('deactivates a different workspace user', async () => {
    mockedDb.update.mockReturnValueOnce(mockChain([{ id: 'user-2', status: 'inactive' }]) as never);

    const res = createRes();
    await deactivate(createReq({ params: { id: 'user-2' } as any }), res, next);

    expect(res.json).toHaveBeenCalledWith({ data: { message: 'User deactivated' } });
  });
});
