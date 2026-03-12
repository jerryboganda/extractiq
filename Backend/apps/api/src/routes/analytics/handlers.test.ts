import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request, Response, NextFunction } from 'express';

vi.mock('@mcq-platform/db', () => ({
  db: { select: vi.fn() },
  mcqRecords: 'mcq_records_table',
  costRecords: 'cost_records_table',
  jobs: 'jobs_table',
  providerConfigs: 'provider_configs_table',
  providerBenchmarks: 'provider_benchmarks_table',
}));

vi.mock('@mcq-platform/logger', () => ({
  createLogger: () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }),
}));

import { timeSeries, confidenceDistribution, providerComparison, processingTime, costBreakdown, summary } from './handlers.js';
import { db } from '@mcq-platform/db';

const mockedDb = vi.mocked(db);

function createReq(overrides: Partial<Request> = {}): Request {
  return { body: {}, query: { range: '7d' }, params: {}, cookies: {}, headers: {}, userId: 'user-1', workspaceId: 'ws-1', userRole: 'workspace_admin', ...overrides } as unknown as Request;
}

function createRes(): Response {
  return { status: vi.fn().mockReturnThis(), json: vi.fn().mockReturnThis() } as unknown as Response;
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

describe('analytics handlers', () => {
  let next: NextFunction;
  beforeEach(() => { vi.clearAllMocks(); next = vi.fn(); });

  describe('timeSeries', () => {
    it('returns MCQ and cost data grouped by date', async () => {
      const mcqData = [{ date: '2024-01-01', mcqCount: 10, confidence: '85' }];
      const costData = [{ date: '2024-01-01', cost: '2.50' }];

      mockedDb.select
        .mockReturnValueOnce(mockChain(mcqData) as any)
        .mockReturnValueOnce(mockChain(costData) as any);

      const req = createReq();
      const res = createRes();
      await timeSeries(req, res, next);

      const data = (res.json as any).mock.calls[0][0].data;
      expect(data).toHaveLength(1);
      expect(data[0].date).toBe('2024-01-01');
      expect(data[0].mcqCount).toBe(10);
      expect(data[0].cost).toBe(2.5);
      expect(data[0].confidence).toBe(85);
    });
  });

  describe('confidenceDistribution', () => {
    it('returns 5 confidence buckets', async () => {
      // 5 parallel selects — one per bucket
      mockedDb.select
        .mockReturnValueOnce(mockChain([{ count: 5 }]) as any)   // 0-20
        .mockReturnValueOnce(mockChain([{ count: 10 }]) as any)  // 21-40
        .mockReturnValueOnce(mockChain([{ count: 20 }]) as any)  // 41-60
        .mockReturnValueOnce(mockChain([{ count: 30 }]) as any)  // 61-80
        .mockReturnValueOnce(mockChain([{ count: 50 }]) as any); // 81-100

      const req = createReq();
      const res = createRes();
      await confidenceDistribution(req, res, next);

      const data = (res.json as any).mock.calls[0][0].data;
      expect(data).toHaveLength(5);
      expect(data[0]).toEqual({ range: '0-20', count: 5, fill: '#ef4444' });
      expect(data[4]).toEqual({ range: '81-100', count: 50, fill: '#06b6d4' });
    });
  });

  describe('providerComparison', () => {
    it('returns comparison with benchmark data', async () => {
      const providers = [{ id: 'p1', displayName: 'OpenAI' }];
      const benchmark = { accuracy: 95, avgLatencyMs: 200, costPerRecord: 0.05 };

      mockedDb.select
        .mockReturnValueOnce(mockChain(providers) as any)     // providers list
        .mockReturnValueOnce(mockChain([benchmark]) as any);  // benchmark for provider

      const req = createReq();
      const res = createRes();
      await providerComparison(req, res, next);

      const data = (res.json as any).mock.calls[0][0].data;
      expect(data).toHaveLength(1);
      expect(data[0].provider).toBe('OpenAI');
      expect(data[0].accuracy).toBe(95);
    });

    it('returns zeros when no benchmark found', async () => {
      const providers = [{ id: 'p1', displayName: 'NewProvider' }];

      mockedDb.select
        .mockReturnValueOnce(mockChain(providers) as any)
        .mockReturnValueOnce(mockChain([]) as any); // no benchmark

      const req = createReq();
      const res = createRes();
      await providerComparison(req, res, next);

      const data = (res.json as any).mock.calls[0][0].data;
      expect(data[0].accuracy).toBe(0);
      expect(data[0].speed).toBe(0);
      expect(data[0].costEfficiency).toBe(0);
    });
  });

  describe('processingTime', () => {
    it('returns avg and p95 duration data', async () => {
      const data = [{ date: '2024-01-01', avgDuration: '120.5', p95Duration: '300.8' }];
      mockedDb.select.mockReturnValue(mockChain(data) as any);

      const req = createReq();
      const res = createRes();
      await processingTime(req, res, next);

      const result = (res.json as any).mock.calls[0][0].data;
      expect(result[0].avgDuration).toBe(121); // rounded
      expect(result[0].p95Duration).toBe(301); // rounded
    });
  });

  describe('costBreakdown', () => {
    it('returns costs pivoted by week and operation type', async () => {
      const data = [
        { week: '2024-01-01', operationType: 'extraction', totalCost: '5.00' },
        { week: '2024-01-01', operationType: 'ocr', totalCost: '2.00' },
        { week: '2024-01-08', operationType: 'extraction', totalCost: '3.00' },
      ];
      mockedDb.select.mockReturnValue(mockChain(data) as any);

      const req = createReq();
      const res = createRes();
      await costBreakdown(req, res, next);

      const result = (res.json as any).mock.calls[0][0].data;
      expect(result).toHaveLength(2);
      expect(result[0].extraction).toBe(5);
      expect(result[0].ocr).toBe(2);
      expect(result[1].extraction).toBe(3);
    });
  });

  describe('summary', () => {
    it('returns aggregate totals', async () => {
      mockedDb.select
        .mockReturnValueOnce(mockChain([{ count: 1000 }]) as any)     // totalMcqs
        .mockReturnValueOnce(mockChain([{ avg: '87.5' }]) as any)     // avgConf
        .mockReturnValueOnce(mockChain([{ sum: '250.00' }]) as any);  // totalCost

      const req = createReq();
      const res = createRes();
      await summary(req, res, next);

      const data = (res.json as any).mock.calls[0][0].data;
      expect(data.totalMcqRecords).toBe(1000);
      expect(data.averageConfidence).toBe(88); // rounded
      expect(data.totalCostUsd).toBe(250);
    });

    it('handles null aggregations gracefully', async () => {
      mockedDb.select
        .mockReturnValueOnce(mockChain([{ count: 0 }]) as any)
        .mockReturnValueOnce(mockChain([{ avg: null }]) as any)
        .mockReturnValueOnce(mockChain([{ sum: null }]) as any);

      const req = createReq();
      const res = createRes();
      await summary(req, res, next);

      const data = (res.json as any).mock.calls[0][0].data;
      expect(data.totalMcqRecords).toBe(0);
      expect(data.averageConfidence).toBe(0);
      expect(data.totalCostUsd).toBe(0);
    });
  });
});
