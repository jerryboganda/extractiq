import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { validate } from './validate.js';

function createMockReq(source: 'body' | 'query' | 'params', data: unknown): Request {
  return {
    [source]: data,
    correlationId: 'test-cid',
  } as unknown as Request;
}

function createMockRes(): Response {
  return {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  } as unknown as Response;
}

const testSchema = z.object({
  name: z.string().min(1),
  age: z.coerce.number().int().positive(),
});

describe('validate middleware', () => {
  let next: NextFunction;

  beforeEach(() => {
    next = vi.fn();
  });

  it('calls next() on valid body', () => {
    const middleware = validate(testSchema, 'body');
    const req = createMockReq('body', { name: 'John', age: 25 });
    const res = createMockRes();

    middleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.body).toEqual({ name: 'John', age: 25 });
  });

  it('defaults to body source', () => {
    const middleware = validate(testSchema);
    const req = createMockReq('body', { name: 'Jane', age: 30 });
    const res = createMockRes();

    middleware(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it('returns 400 on validation failure', () => {
    const middleware = validate(testSchema);
    const req = createMockReq('body', { name: '', age: -1 });
    const res = createMockRes();

    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({
          code: 'VALIDATION_ERROR',
          message: 'Request validation failed',
          details: expect.arrayContaining([
            expect.objectContaining({ field: expect.any(String), message: expect.any(String) }),
          ]),
        }),
      })
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('validates query source', () => {
    const querySchema = z.object({
      page: z.coerce.number().default(1),
      limit: z.coerce.number().default(25),
    });

    const middleware = validate(querySchema, 'query');
    const req = createMockReq('query', { page: '3', limit: '10' });
    const res = createMockRes();

    middleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.query).toEqual({ page: 3, limit: 10 });
  });

  it('replaces request data with parsed/coerced values', () => {
    const schema = z.object({
      count: z.coerce.number(),
    });

    const middleware = validate(schema, 'body');
    const req = createMockReq('body', { count: '42' });
    const res = createMockRes();

    middleware(req, res, next);

    expect(req.body.count).toBe(42); // coerced from string
    expect(next).toHaveBeenCalled();
  });

  it('includes correlation ID in error response', () => {
    const middleware = validate(testSchema);
    const req = createMockReq('body', {});
    const res = createMockRes();

    middleware(req, res, next);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({
          correlationId: 'test-cid',
        }),
      })
    );
  });
});
