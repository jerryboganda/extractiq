import { describe, it, expect, vi } from 'vitest';
import type { Request, Response, NextFunction } from 'express';

vi.mock('@mcq-platform/logger', () => ({
  createLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  }),
}));

import { AppError, errorHandler } from './error-handler.js';

function createMockReq(correlationId = 'test-cid'): Request {
  return {
    correlationId,
    method: 'POST',
    originalUrl: '/api/v1/test',
  } as unknown as Request;
}

function createMockRes(): Response {
  return {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  } as unknown as Response;
}

describe('AppError', () => {
  it('creates an error with status code and code', () => {
    const err = new AppError(404, 'NOT_FOUND', 'Resource not found');
    expect(err.statusCode).toBe(404);
    expect(err.code).toBe('NOT_FOUND');
    expect(err.message).toBe('Resource not found');
    expect(err.name).toBe('AppError');
    expect(err).toBeInstanceOf(Error);
  });

  it('supports optional details', () => {
    const err = new AppError(400, 'VALIDATION_ERROR', 'Bad input', [
      { field: 'email', message: 'Invalid email' },
    ]);
    expect(err.details).toEqual([{ field: 'email', message: 'Invalid email' }]);
  });
});

describe('errorHandler', () => {
  const next: NextFunction = vi.fn();

  it('handles AppError with correct status and body', () => {
    const err = new AppError(404, 'NOT_FOUND', 'Thing not found');
    const req = createMockReq();
    const res = createMockRes();

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      error: {
        code: 'NOT_FOUND',
        message: 'Thing not found',
        details: undefined,
        correlationId: 'test-cid',
      },
    });
  });

  it('handles AppError with details', () => {
    const err = new AppError(400, 'VALIDATION_ERROR', 'Bad', [
      { field: 'name', message: 'required' },
    ]);
    const req = createMockReq();
    const res = createMockRes();

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({
          details: [{ field: 'name', message: 'required' }],
        }),
      })
    );
  });

  it('handles unexpected errors with 500 and generic message', () => {
    const err = new Error('Database connection failed');
    const req = createMockReq();
    const res = createMockRes();

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
        correlationId: 'test-cid',
      },
    });
  });

  it('does not leak internal error message in response', () => {
    const err = new Error('SELECT * FROM users WHERE password = "leaked"');
    const req = createMockReq();
    const res = createMockRes();

    errorHandler(err, req, res, next);

    const jsonCall = (res.json as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(jsonCall.error.message).toBe('An unexpected error occurred');
    expect(JSON.stringify(jsonCall)).not.toContain('leaked');
  });

  it('uses "unknown" when no correlation ID', () => {
    const err = new Error('fail');
    const req = { method: 'GET', originalUrl: '/test' } as unknown as Request;
    const res = createMockRes();

    errorHandler(err, req, res, next);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({ correlationId: 'unknown' }),
      })
    );
  });
});
