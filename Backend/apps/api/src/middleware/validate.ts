import type { Request, Response, NextFunction } from 'express';
import { type ZodSchema } from 'zod';

/**
 * Validate request body/query/params against a Zod schema.
 *
 * Usage:
 *   router.post('/things', validate(createThingSchema, 'body'), handler)
 *   router.get('/things', validate(paginationSchema, 'query'), handler)
 */
export function validate(schema: ZodSchema, source: 'body' | 'query' | 'params' = 'body') {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[source]);

    if (!result.success) {
      const details = result.error.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      }));

      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Request validation failed',
          details,
          correlationId: req.correlationId,
        },
      });
      return;
    }

    // Replace with parsed (coerced/defaulted) values
    req[source] = result.data;
    next();
  };
}
