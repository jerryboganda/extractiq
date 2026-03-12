import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@mcq-platform/db', () => ({
  db: { select: vi.fn(), insert: vi.fn() },
  notifications: 'notifications_table',
  users: 'users_table',
}));

vi.mock('@mcq-platform/logger', () => ({
  createLogger: () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }),
}));

import { processNotification } from './notification.js';
import { db } from '@mcq-platform/db';

const mockedDb = vi.mocked(db);

function mockChain(result: unknown) {
  const chain: Record<string, unknown> = {};
  chain.from = vi.fn().mockReturnValue(chain);
  chain.where = vi.fn().mockReturnValue(chain);
  chain.limit = vi.fn().mockReturnValue(chain);
  chain.values = vi.fn().mockReturnValue(chain);
  chain.then = vi.fn().mockImplementation((resolve: any) => resolve(result));
  return chain;
}

function createJob(data: any) {
  return { data, id: 'job-id-1', name: 'notification' } as any;
}

describe('notification worker', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('creates notification for specific user', async () => {
    const insertChain = mockChain(undefined);
    mockedDb.insert.mockReturnValue(insertChain as any);

    await processNotification(createJob({
      workspaceId: 'ws-1',
      userId: 'user-1',
      type: 'job_completed',
      title: 'Job Done',
      message: 'Your job is complete',
      data: { jobId: 'j1' },
    }));

    expect(mockedDb.insert).toHaveBeenCalled();
    // Should not query for users since userId was provided
    expect(mockedDb.select).not.toHaveBeenCalled();
  });

  it('broadcasts to all active workspace users when no userId', async () => {
    const users = [{ id: 'u1' }, { id: 'u2' }, { id: 'u3' }];
    mockedDb.select.mockReturnValue(mockChain(users) as any);
    mockedDb.insert.mockReturnValue(mockChain(undefined) as any);

    await processNotification(createJob({
      workspaceId: 'ws-1',
      userId: '',
      type: 'system_update',
      title: 'Update',
      message: 'System updated',
    }));

    // Should have queried for workspace users
    expect(mockedDb.select).toHaveBeenCalled();
    // Should insert notifications for all 3 users
    expect(mockedDb.insert).toHaveBeenCalled();
  });

  it('skips when no target users found', async () => {
    mockedDb.select.mockReturnValue(mockChain([]) as any);

    await processNotification(createJob({
      workspaceId: 'ws-1',
      userId: '',
      type: 'system_update',
      title: 'Update',
      message: 'No users',
    }));

    // No users → should not insert
    expect(mockedDb.insert).not.toHaveBeenCalled();
  });
});
