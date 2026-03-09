import type { Request, Response, NextFunction } from 'express';
import { hasPermission, type Permission } from '@mcq-platform/auth';

/**
 * Authorization middleware factory.
 * Usage: router.get('/things', authorize('things:read'), handler)
 */
export function authorize(...permissions: Permission[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const role = req.userRole;

    if (!role) {
      res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: 'No role assigned',
          correlationId: req.correlationId,
        },
      });
      return;
    }

    const allowed = permissions.every((p) => hasPermission(role, p));

    if (!allowed) {
      res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: 'Insufficient permissions',
          correlationId: req.correlationId,
        },
      });
      return;
    }

    next();
  };
}
