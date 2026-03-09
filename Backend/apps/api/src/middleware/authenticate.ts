import type { Request, Response, NextFunction } from 'express';
import { verifyToken, type TokenPayload } from '@mcq-platform/auth';
import { env } from '@mcq-platform/config';
import { createLogger } from '@mcq-platform/logger';

const logger = createLogger('auth-middleware');

declare global {
  namespace Express {
    interface Request {
      userId: string;
      workspaceId: string;
      userRole: string;
      tokenPayload: TokenPayload;
    }
  }
}

/**
 * Authenticate requests via httpOnly JWT cookie or Authorization header.
 * Sets req.userId, req.workspaceId, req.userRole for downstream handlers.
 */
export function authenticate(req: Request, res: Response, next: NextFunction): void {
  // 1. Try httpOnly cookie first
  let token: string | undefined = req.cookies?.access_token;

  // 2. Fall back to Authorization: Bearer <token>
  if (!token) {
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.slice(7);
    }
  }

  if (!token) {
    res.status(401).json({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication required',
        correlationId: req.correlationId,
      },
    });
    return;
  }

  try {
    const payload = verifyToken(token, env.JWT_SECRET);
    req.userId = payload.sub;
    req.workspaceId = payload.wid;
    req.userRole = payload.role;
    req.tokenPayload = payload;
    next();
  } catch (err) {
    logger.warn({ err, correlationId: req.correlationId }, 'Invalid token');
    res.status(401).json({
      error: {
        code: 'INVALID_TOKEN',
        message: 'Invalid or expired authentication token',
        correlationId: req.correlationId,
      },
    });
  }
}
