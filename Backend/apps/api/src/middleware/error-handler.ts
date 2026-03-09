import type { Request, Response, NextFunction } from 'express';
import { createLogger } from '@mcq-platform/logger';

const logger = createLogger('error-handler');

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details?: Array<{ field: string; message: string }>,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

/**
 * Global error handler — catches all thrown/next(err) errors.
 */
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  const correlationId = req.correlationId ?? 'unknown';

  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
        correlationId,
      },
    });
    return;
  }

  // Unexpected error — log full stack, return generic message
  logger.error({
    err: err.message,
    stack: err.stack,
    correlationId,
    method: req.method,
    url: req.originalUrl,
  }, 'Unhandled error');

  res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
      correlationId,
    },
  });
}
