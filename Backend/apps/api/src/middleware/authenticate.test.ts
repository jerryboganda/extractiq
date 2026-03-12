import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request, Response, NextFunction } from 'express';

// Mock @mcq-platform/auth before importing the module under test
vi.mock('@mcq-platform/auth', () => ({
  verifyToken: vi.fn(),
}));

vi.mock('@mcq-platform/config', () => ({
  env: { JWT_SECRET: 'test-secret-long-enough-for-jwt-signing' },
}));

vi.mock('@mcq-platform/logger', () => ({
  createLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  }),
}));

import { authenticate } from './authenticate.js';
import { verifyToken } from '@mcq-platform/auth';

const mockedVerifyToken = vi.mocked(verifyToken);

function createMockReq(overrides: Partial<Request> = {}): Request {
  return {
    cookies: {},
    headers: {},
    correlationId: 'test-correlation-id',
    ...overrides,
  } as unknown as Request;
}

function createMockRes(): Response {
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  } as unknown as Response;
  return res;
}

describe('authenticate middleware', () => {
  let next: NextFunction;

  beforeEach(() => {
    vi.clearAllMocks();
    next = vi.fn();
  });

  it('extracts token from httpOnly cookie', () => {
    mockedVerifyToken.mockReturnValue({
      sub: 'user-1',
      wid: 'ws-1',
      role: 'operator',
    });

    const req = createMockReq({ cookies: { access_token: 'valid-token' } });
    const res = createMockRes();

    authenticate(req, res, next);

    expect(mockedVerifyToken).toHaveBeenCalledWith('valid-token', 'test-secret-long-enough-for-jwt-signing');
    expect(req.userId).toBe('user-1');
    expect(req.workspaceId).toBe('ws-1');
    expect(req.userRole).toBe('operator');
    expect(next).toHaveBeenCalled();
  });

  it('falls back to Authorization header', () => {
    mockedVerifyToken.mockReturnValue({
      sub: 'user-2',
      wid: 'ws-2',
      role: 'reviewer',
    });

    const req = createMockReq({
      headers: { authorization: 'Bearer header-token' } as any,
    });
    const res = createMockRes();

    authenticate(req, res, next);

    expect(mockedVerifyToken).toHaveBeenCalledWith('header-token', 'test-secret-long-enough-for-jwt-signing');
    expect(req.userId).toBe('user-2');
    expect(next).toHaveBeenCalled();
  });

  it('prefers cookie over header', () => {
    mockedVerifyToken.mockReturnValue({
      sub: 'cookie-user',
      wid: 'ws-1',
      role: 'operator',
    });

    const req = createMockReq({
      cookies: { access_token: 'cookie-token' },
      headers: { authorization: 'Bearer header-token' } as any,
    });
    const res = createMockRes();

    authenticate(req, res, next);

    expect(mockedVerifyToken).toHaveBeenCalledWith('cookie-token', expect.any(String));
  });

  it('returns 401 when no token present', () => {
    const req = createMockReq();
    const res = createMockRes();

    authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({ code: 'UNAUTHORIZED' }),
      })
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 when token verification fails', () => {
    mockedVerifyToken.mockImplementation(() => {
      throw new Error('jwt expired');
    });

    const req = createMockReq({ cookies: { access_token: 'expired-token' } });
    const res = createMockRes();

    authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({ code: 'INVALID_TOKEN' }),
      })
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('ignores non-Bearer authorization header', () => {
    const req = createMockReq({
      headers: { authorization: 'Basic dXNlcjpwYXNz' } as any,
    });
    const res = createMockRes();

    authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });
});
