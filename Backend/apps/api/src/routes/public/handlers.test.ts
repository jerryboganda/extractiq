import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { NextFunction, Request, Response } from 'express';

vi.mock('@mcq-platform/db', () => ({
  db: {
    insert: vi.fn(),
  },
  publicSubmissions: { id: 'public_submissions.id' },
}));

vi.mock('@mcq-platform/config', () => ({
  env: {
    SALES_NOTIFICATION_EMAIL: 'sales@extractiq.local',
    SUPPORT_NOTIFICATION_EMAIL: 'support@extractiq.local',
  },
}));

vi.mock('@mcq-platform/queue', () => ({
  enqueue: vi.fn(),
  QUEUE_NAMES: {
    NOTIFICATION: 'notification',
  },
}));

import { db } from '@mcq-platform/db';
import { enqueue } from '@mcq-platform/queue';
import { submitContactRequest, submitDemoRequest } from './handlers.js';

const mockedDb = vi.mocked(db);
const mockedEnqueue = vi.mocked(enqueue);

function createReq(overrides: Partial<Request> = {}): Request {
  return {
    body: {},
    originalUrl: '/api/v1/public/demo-request',
    ip: '127.0.0.1',
    get: vi.fn().mockReturnValue('vitest-agent'),
    ...overrides,
  } as unknown as Request;
}

function createRes(): Response {
  return {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  } as unknown as Response;
}

function mockInsert(result: unknown) {
  return {
    values: vi.fn().mockReturnValue({
      returning: vi.fn().mockResolvedValue(result),
    }),
  };
}

describe('public handlers', () => {
  let next: NextFunction;

  beforeEach(() => {
    vi.clearAllMocks();
    next = vi.fn();
  });

  it('persists demo requests and enqueues notifications', async () => {
    mockedDb.insert.mockReturnValueOnce(mockInsert([{ id: 'submission-1', status: 'received' }]) as never);

    const res = createRes();
    await submitDemoRequest(createReq({
      body: {
        firstName: 'Demo',
        lastName: 'Requester',
        email: 'demo@example.com',
        company: 'Smoke Co',
        role: 'Operator',
        monthlyVolume: '500',
        useCase: 'Smoke demo',
      },
    }), res, next);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      data: {
        id: 'submission-1',
        status: 'received',
        message: 'Demo request received',
      },
    });
    expect(mockedEnqueue).toHaveBeenCalledWith('notification', expect.objectContaining({
      type: 'public_demo_request',
      relatedId: 'submission-1',
      emails: expect.arrayContaining([
        expect.objectContaining({ to: 'sales@extractiq.local' }),
        expect.objectContaining({ to: 'demo@example.com' }),
      ]),
    }));
  });

  it('persists contact requests and enqueues notifications', async () => {
    mockedDb.insert.mockReturnValueOnce(mockInsert([{ id: 'submission-2', status: 'received' }]) as never);

    const res = createRes();
    await submitContactRequest(createReq({
      originalUrl: '/api/v1/public/contact-request',
      body: {
        fullName: 'Contact Requester',
        email: 'contact@example.com',
        company: 'Smoke Co',
        useCase: 'Smoke contact request',
      },
    }), res, next);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      data: {
        id: 'submission-2',
        status: 'received',
        message: 'Contact request received',
      },
    });
    expect(mockedEnqueue).toHaveBeenCalledWith('notification', expect.objectContaining({
      type: 'public_contact_request',
      relatedId: 'submission-2',
      emails: expect.arrayContaining([
        expect.objectContaining({ to: 'support@extractiq.local' }),
        expect.objectContaining({ to: 'contact@example.com' }),
      ]),
    }));
  });
});
