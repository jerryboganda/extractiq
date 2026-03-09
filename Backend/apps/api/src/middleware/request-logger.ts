import type { Request, Response, NextFunction } from 'express';
import { createLogger } from '@mcq-platform/logger';

const logger = createLogger('http');

/**
 * Log every incoming request and its response status / duration.
 */
export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const level = res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info';

    logger[level]({
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      durationMs: duration,
      correlationId: req.correlationId,
      userAgent: req.headers['user-agent'],
    }, `${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`);
  });

  next();
}
