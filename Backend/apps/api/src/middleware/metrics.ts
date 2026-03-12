import type { Request, Response, NextFunction } from 'express';

// ──────────────────────────────────────────────
// In-Memory Metrics — lightweight, no external deps
// ──────────────────────────────────────────────

interface Metrics {
  requestCount: number;
  errorCount: number;
  totalDurationMs: number;
  statusCodes: Record<number, number>;
  startedAt: string;
}

const metrics: Metrics = {
  requestCount: 0,
  errorCount: 0,
  totalDurationMs: 0,
  statusCodes: {},
  startedAt: new Date().toISOString(),
};

/**
 * Middleware that tracks request count, error rate, and avg latency.
 */
export function metricsMiddleware(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    metrics.requestCount++;
    metrics.totalDurationMs += duration;
    metrics.statusCodes[res.statusCode] = (metrics.statusCodes[res.statusCode] || 0) + 1;

    if (res.statusCode >= 500) {
      metrics.errorCount++;
    }
  });

  next();
}

/**
 * Returns a snapshot of collected metrics.
 */
export function getMetrics() {
  const uptimeMs = Date.now() - new Date(metrics.startedAt).getTime();
  return {
    uptime: Math.round(uptimeMs / 1000),
    requests: {
      total: metrics.requestCount,
      errors: metrics.errorCount,
      errorRate: metrics.requestCount > 0
        ? Math.round((metrics.errorCount / metrics.requestCount) * 10000) / 100
        : 0,
      avgLatencyMs: metrics.requestCount > 0
        ? Math.round(metrics.totalDurationMs / metrics.requestCount)
        : 0,
    },
    statusCodes: { ...metrics.statusCodes },
    startedAt: metrics.startedAt,
  };
}
