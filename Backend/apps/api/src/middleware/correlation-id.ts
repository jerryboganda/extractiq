import type { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

declare global {
  namespace Express {
    interface Request {
      correlationId: string;
    }
  }
}

/**
 * Attach a unique correlation ID to every request.
 * Clients can send X-Correlation-ID header; otherwise generated.
 */
export function correlationId(req: Request, _res: Response, next: NextFunction): void {
  const existing = req.headers['x-correlation-id'];
  req.correlationId = (typeof existing === 'string' && existing) ? existing : uuidv4();
  next();
}
