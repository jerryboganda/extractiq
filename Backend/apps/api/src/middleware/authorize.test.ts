import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request, Response, NextFunction } from 'express';

vi.mock('@mcq-platform/auth', () => ({
  hasPermission: vi.fn(),
}));

import { authorize } from './authorize.js';
import { hasPermission } from '@mcq-platform/auth';

const mockedHasPermission = vi.mocked(hasPermission);

function createMockReq(role?: string): Request {
  return {
    userRole: role,
    correlationId: 'test-cid',
  } as unknown as Request;
}

function createMockRes(): Response {
  return {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  } as unknown as Response;
}

describe('authorize middleware', () => {
  let next: NextFunction;

  beforeEach(() => {
    vi.clearAllMocks();
    next = vi.fn();
  });

  it('calls next() when role has required permission', () => {
    mockedHasPermission.mockReturnValue(true);

    const middleware = authorize('projects:read');
    const req = createMockReq('operator');
    const res = createMockRes();

    middleware(req, res, next);

    expect(mockedHasPermission).toHaveBeenCalledWith('operator', 'projects:read');
    expect(next).toHaveBeenCalled();
  });

  it('returns 403 when role lacks permission', () => {
    mockedHasPermission.mockReturnValue(false);

    const middleware = authorize('workspace:delete');
    const req = createMockReq('reviewer');
    const res = createMockRes();

    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({ code: 'FORBIDDEN', message: 'Insufficient permissions' }),
      })
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 403 when no role assigned', () => {
    const middleware = authorize('projects:read');
    const req = createMockReq(undefined);
    const res = createMockRes();

    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({ code: 'FORBIDDEN', message: 'No role assigned' }),
      })
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('checks multiple permissions (all must pass)', () => {
    mockedHasPermission.mockImplementation((_role, perm) => perm === 'projects:read');

    const middleware = authorize('projects:read', 'projects:update');
    const req = createMockReq('operator');
    const res = createMockRes();

    middleware(req, res, next);

    // Should fail because projects:update returns false
    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it('passes when all multi-permissions are satisfied', () => {
    mockedHasPermission.mockReturnValue(true);

    const middleware = authorize('projects:read', 'projects:update');
    const req = createMockReq('operator');
    const res = createMockRes();

    middleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(mockedHasPermission).toHaveBeenCalledTimes(2);
  });
});
