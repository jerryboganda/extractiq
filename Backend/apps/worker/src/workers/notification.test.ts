import { beforeEach, describe, expect, it, vi } from 'vitest';

const { sendMail } = vi.hoisted(() => ({
  sendMail: vi.fn(),
}));

vi.mock('@mcq-platform/db', () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
  },
  notifications: { id: 'notifications.id', userId: 'notifications.userId' },
  users: { id: 'users.id', workspaceId: 'users.workspaceId', status: 'users.status' },
  emailDeliveries: { id: 'emailDeliveries.id' },
}));

vi.mock('@mcq-platform/config', () => ({
  env: {
    SMTP_HOST: '127.0.0.1',
    SMTP_PORT: 1025,
    SMTP_SECURE: false,
    SMTP_USER: '',
    SMTP_PASS: '',
    SMTP_FROM_NAME: 'ExtractIQ Document Intelligence',
    SMTP_FROM: 'noreply@extractiq.local',
    ENABLE_EMAIL_DELIVERY: true,
  },
}));

vi.mock('nodemailer', () => ({
  default: {
    createTransport: vi.fn(() => ({
      sendMail,
    })),
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

import { processNotification } from './notification.js';
import { db } from '@mcq-platform/db';

const mockedDb = vi.mocked(db);

function createJob(data: Record<string, unknown>) {
  return {
    id: 'job-1',
    name: 'notification',
    data,
  } as any;
}

function mockChain(result: unknown) {
  const chain: Record<string, unknown> = {};
  chain.from = vi.fn().mockReturnValue(chain);
  chain.where = vi.fn().mockReturnValue(chain);
  chain.values = vi.fn().mockReturnValue(chain);
  chain.returning = vi.fn().mockResolvedValue(result);
  chain.set = vi.fn().mockReturnValue(chain);
  chain.then = vi.fn().mockImplementation((resolve: (value: unknown) => unknown) => resolve(result));
  return chain;
}

describe('notification worker', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sendMail.mockResolvedValue({});
  });

  it('creates a database notification for a specific user', async () => {
    mockedDb.insert.mockReturnValueOnce(mockChain([{ id: 'notif-1', userId: 'user-1' }]) as never);

    await processNotification(createJob({
      workspaceId: 'ws-1',
      userId: 'user-1',
      type: 'job_completed',
      title: 'Job complete',
      message: 'Your job finished successfully',
    }));

    expect(mockedDb.insert).toHaveBeenCalled();
    expect(mockedDb.select).not.toHaveBeenCalled();
  });

  it('broadcasts notifications and sends tracked emails when requested', async () => {
    mockedDb.select.mockReturnValueOnce(mockChain([{ id: 'user-1' }, { id: 'user-2' }]) as never);
    mockedDb.insert
      .mockReturnValueOnce(mockChain([{ id: 'notif-1', userId: 'user-1' }, { id: 'notif-2', userId: 'user-2' }]) as never)
      .mockReturnValueOnce(mockChain([{ id: 'delivery-1' }]) as never);
    mockedDb.update.mockReturnValue(mockChain([]) as never);

    await processNotification(createJob({
      workspaceId: 'ws-1',
      type: 'user_invited',
      title: 'Invite sent',
      message: 'Invitation sent successfully',
      emails: [{
        to: 'invitee@example.com',
        subject: 'Accept your invitation',
        text: 'Invitation body',
        html: '<p>Invitation body</p>',
      }],
      relatedType: 'invitation',
      relatedId: 'user-2',
    }));

    expect(mockedDb.select).toHaveBeenCalled();
    expect(sendMail).toHaveBeenCalledWith(expect.objectContaining({
      from: 'ExtractIQ Document Intelligence <noreply@extractiq.local>',
      to: 'invitee@example.com',
      subject: 'Accept your invitation',
    }));
    expect(mockedDb.update).toHaveBeenCalled();
  });

  it('skips work when no recipients exist', async () => {
    mockedDb.select.mockReturnValueOnce(mockChain([]) as never);

    await processNotification(createJob({
      workspaceId: 'ws-1',
      type: 'system_update',
      title: 'Update',
      message: 'No active users available',
    }));

    expect(mockedDb.insert).not.toHaveBeenCalled();
    expect(sendMail).not.toHaveBeenCalled();
  });
});
