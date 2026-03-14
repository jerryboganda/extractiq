import rateLimit from 'express-rate-limit';
import { env } from '@mcq-platform/config';

const isLocalDevelopment = env.NODE_ENV === 'development';

/**
 * Global rate limiter — configurable via env.
 */
export const rateLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_API_WINDOW_MS,
  max: env.RATE_LIMIT_API_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests, please try again later.',
      correlationId: '',
    },
  },
  keyGenerator: (req) => {
    // Use user ID if authenticated, otherwise IP
    return (req as any).userId ?? req.ip ?? 'unknown';
  },
});

/**
 * Stricter rate limit for auth endpoints.
 */
export const authRateLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_AUTH_WINDOW_MS,
  max: isLocalDevelopment ? Math.max(env.RATE_LIMIT_AUTH_MAX, 100) : env.RATE_LIMIT_AUTH_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: {
      code: 'AUTH_RATE_LIMIT_EXCEEDED',
      message: 'Too many authentication attempts, please try again later.',
      correlationId: '',
    },
  },
  skip: (req) => isLocalDevelopment && ['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(req.ip ?? ''),
});
