import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request, Response, NextFunction } from 'express';

vi.mock('@mcq-platform/db', () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  providerConfigs: 'provider_configs_table',
  providerBenchmarks: 'provider_benchmarks_table',
}));

vi.mock('@mcq-platform/config', () => ({
  env: {
    ENCRYPTION_KEY: 'a'.repeat(64), // 32-byte hex key
    NODE_ENV: 'test',
  },
}));

vi.mock('@mcq-platform/logger', () => ({
  createLogger: () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }),
}));

import { list, create, getById, update, remove, test as testProvider, getBenchmarks } from './handlers.js';
import { db } from '@mcq-platform/db';

const mockedDb = vi.mocked(db);

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
  chain.returning = vi.fn().mockReturnValue(chain);
  chain.set = vi.fn().mockReturnValue(chain);
  chain.groupBy = vi.fn().mockReturnValue(chain);
  chain.then = vi.fn().mockImplementation((resolve: any) => resolve(result));
  return chain;
}

describe('providers handlers', () => {
  let next: NextFunction;

  beforeEach(() => {
    vi.clearAllMocks();
    next = vi.fn();
  });

  describe('list', () => {
    it('returns providers enriched with benchmark data', async () => {
      const providers = [{ id: 'prov1', displayName: 'OpenAI', providerType: 'openai', healthStatus: 'healthy' }];
      // First select: providers (no .limit, uses orderBy)
      const provChain: Record<string, unknown> = {};
      provChain.from = vi.fn().mockReturnValue(provChain);
      provChain.where = vi.fn().mockReturnValue(provChain);
      provChain.orderBy = vi.fn().mockReturnValue(provChain);
      provChain.then = vi.fn().mockImplementation((resolve: any) => resolve(providers));

      // Second select: benchmark for enrichment
      const benchChain = mockChain([{ accuracy: 95, avgLatencyMs: 200, costPerRecord: 0.05, errorRate: 2, totalCost: 10 }]);

      mockedDb.select
        .mockReturnValueOnce(provChain as any)
        .mockReturnValueOnce(benchChain as any);

      const req = createReq();
      const res = createRes();

      await list(req, res, next);

      const response = (res.json as any).mock.calls[0][0].data;
      expect(response[0].accuracy).toBe(95);
      expect(response[0].avgLatency).toBe('200ms');
    });
  });

  describe('create', () => {
    it('creates provider with encrypted API key', async () => {
      const provider = { id: 'prov-new', displayName: 'Claude', category: 'llm', providerType: 'anthropic', healthStatus: 'unknown', isEnabled: true, createdAt: new Date() };
      const chain = mockChain([provider]);
      mockedDb.insert.mockReturnValue(chain as any);

      const req = createReq({
        body: { displayName: 'Claude', category: 'llm', providerType: 'anthropic', apiKey: 'sk-test-key', models: ['claude-3'] },
      });
      const res = createRes();

      await create(req, res, next);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        data: expect.objectContaining({ displayName: 'Claude', category: 'llm' }),
      });
    });
  });

  describe('getById', () => {
    it('returns provider by id', async () => {
      const provider = { id: 'prov1', displayName: 'OpenAI' };
      const chain = mockChain([provider]);
      mockedDb.select.mockReturnValue(chain as any);

      const req = createReq({ params: { id: 'prov1' } as any });
      const res = createRes();

      await getById(req, res, next);

      expect(res.json).toHaveBeenCalledWith({ data: provider });
    });

    it('returns 404 for missing provider', async () => {
      const chain = mockChain([]);
      mockedDb.select.mockReturnValue(chain as any);

      const req = createReq({ params: { id: 'gone' } as any });
      const res = createRes();

      await getById(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 404 }));
    });
  });

  describe('update', () => {
    it('updates provider fields', async () => {
      const updated = { id: 'prov1', displayName: 'GPT-4 Turbo' };
      const chain = mockChain([updated]);
      mockedDb.update.mockReturnValue(chain as any);

      const req = createReq({
        params: { id: 'prov1' } as any,
        body: { displayName: 'GPT-4 Turbo', isEnabled: true },
      });
      const res = createRes();

      await update(req, res, next);

      expect(res.json).toHaveBeenCalledWith({ data: updated });
    });

    it('returns 404 for missing provider', async () => {
      const chain = mockChain([]);
      mockedDb.update.mockReturnValue(chain as any);

      const req = createReq({ params: { id: 'gone' } as any, body: { displayName: 'X' } });
      const res = createRes();

      await update(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 404 }));
    });
  });

  describe('remove', () => {
    it('deletes provider and returns success', async () => {
      const chain = mockChain([{ id: 'prov1' }]);
      mockedDb.delete.mockReturnValue(chain as any);

      const req = createReq({ params: { id: 'prov1' } as any });
      const res = createRes();

      await remove(req, res, next);

      expect(res.json).toHaveBeenCalledWith({ data: { message: 'Provider deleted' } });
    });
  });

  describe('getBenchmarks', () => {
    it('returns benchmarks for provider', async () => {
      const benchmarks = [{ id: 'b1', accuracy: 90 }, { id: 'b2', accuracy: 92 }];
      const chain: Record<string, unknown> = {};
      chain.from = vi.fn().mockReturnValue(chain);
      chain.where = vi.fn().mockReturnValue(chain);
      chain.orderBy = vi.fn().mockReturnValue(chain);
      chain.limit = vi.fn().mockReturnValue(chain);
      chain.then = vi.fn().mockImplementation((resolve: any) => resolve(benchmarks));

      mockedDb.select.mockReturnValue(chain as any);

      const req = createReq({ params: { id: 'prov1' } as any });
      const res = createRes();

      await getBenchmarks(req, res, next);

      expect(res.json).toHaveBeenCalledWith({ data: benchmarks });
    });
  });
});
