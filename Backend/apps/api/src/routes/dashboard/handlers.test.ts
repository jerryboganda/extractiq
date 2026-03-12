import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request, Response, NextFunction } from 'express';

vi.mock('@mcq-platform/db', () => ({
  db: { select: vi.fn() },
  documents: 'documents_table',
  mcqRecords: 'mcq_records_table',
  jobs: 'jobs_table',
  providerConfigs: 'provider_configs_table',
  providerBenchmarks: 'provider_benchmarks_table',
  auditLogs: 'audit_logs_table',
}));

vi.mock('@mcq-platform/logger', () => ({
  createLogger: () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }),
}));

import { getStats, getActiveJobs, getRecentActivity, getProviderHealth } from './handlers.js';
import { db } from '@mcq-platform/db';

const mockedDb = vi.mocked(db);

function createReq(overrides: Partial<Request> = {}): Request {
  return { body: {}, query: {}, params: {}, cookies: {}, headers: {}, userId: 'user-1', workspaceId: 'ws-1', userRole: 'operator', ...overrides } as unknown as Request;
}

function createRes(): Response {
  return { status: vi.fn().mockReturnThis(), json: vi.fn().mockReturnThis() } as unknown as Response;
}

function mockCountChain(count: number) {
  const chain: Record<string, unknown> = {};
  chain.from = vi.fn().mockReturnValue(chain);
  chain.where = vi.fn().mockReturnValue(chain);
  chain.limit = vi.fn().mockReturnValue(chain);
  chain.then = vi.fn().mockImplementation((resolve: any) => resolve([{ count }]));
  return chain;
}

describe('dashboard handlers', () => {
  let next: NextFunction;
  beforeEach(() => { vi.clearAllMocks(); next = vi.fn(); });

  describe('getStats', () => {
    it('returns document, mcq, approval, and active job counts', async () => {
      mockedDb.select
        .mockReturnValueOnce(mockCountChain(100) as any)   // docCount
        .mockReturnValueOnce(mockCountChain(500) as any)   // mcqCount
        .mockReturnValueOnce(mockCountChain(400) as any)   // approvedCount
        .mockReturnValueOnce(mockCountChain(3) as any);    // activeJobCount

      const req = createReq();
      const res = createRes();
      await getStats(req, res, next);

      const data = (res.json as any).mock.calls[0][0].data;
      expect(data.documentsProcessed).toBe(100);
      expect(data.mcqsExtracted).toBe(500);
      expect(data.approvalRate).toBe(80);
      expect(data.activeJobs).toBe(3);
    });

    it('returns 0 approval rate when no MCQs', async () => {
      mockedDb.select
        .mockReturnValueOnce(mockCountChain(0) as any)
        .mockReturnValueOnce(mockCountChain(0) as any)
        .mockReturnValueOnce(mockCountChain(0) as any)
        .mockReturnValueOnce(mockCountChain(0) as any);

      const req = createReq();
      const res = createRes();
      await getStats(req, res, next);

      expect((res.json as any).mock.calls[0][0].data.approvalRate).toBe(0);
    });
  });

  describe('getActiveJobs', () => {
    it('returns active jobs list', async () => {
      const jobs = [{ id: 'j1', status: 'processing', progressPercent: 50 }];
      const chain: Record<string, unknown> = {};
      chain.from = vi.fn().mockReturnValue(chain);
      chain.where = vi.fn().mockReturnValue(chain);
      chain.orderBy = vi.fn().mockReturnValue(chain);
      chain.limit = vi.fn().mockReturnValue(chain);
      chain.then = vi.fn().mockImplementation((resolve: any) => resolve(jobs));
      mockedDb.select.mockReturnValue(chain as any);

      const req = createReq();
      const res = createRes();
      await getActiveJobs(req, res, next);

      expect(res.json).toHaveBeenCalledWith({ data: jobs });
    });
  });

  describe('getRecentActivity', () => {
    it('returns audit log entries', async () => {
      const logs = [{ id: 'log1', action: 'document.upload' }];
      const chain: Record<string, unknown> = {};
      chain.from = vi.fn().mockReturnValue(chain);
      chain.where = vi.fn().mockReturnValue(chain);
      chain.orderBy = vi.fn().mockReturnValue(chain);
      chain.limit = vi.fn().mockReturnValue(chain);
      chain.then = vi.fn().mockImplementation((resolve: any) => resolve(logs));
      mockedDb.select.mockReturnValue(chain as any);

      const req = createReq();
      const res = createRes();
      await getRecentActivity(req, res, next);

      expect(res.json).toHaveBeenCalledWith({ data: logs });
    });
  });

  describe('getProviderHealth', () => {
    it('returns enabled providers health status', async () => {
      const providers = [{ id: 'p1', displayName: 'OpenAI', healthStatus: 'healthy' }];
      const chain: Record<string, unknown> = {};
      chain.from = vi.fn().mockReturnValue(chain);
      chain.where = vi.fn().mockReturnValue(chain);
      chain.then = vi.fn().mockImplementation((resolve: any) => resolve(providers));
      mockedDb.select.mockReturnValue(chain as any);

      const req = createReq();
      const res = createRes();
      await getProviderHealth(req, res, next);

      expect(res.json).toHaveBeenCalledWith({ data: providers });
    });
  });
});
