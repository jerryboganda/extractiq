import pino from 'pino';
import { env } from '@mcq-platform/config';

export { maskEmail, maskIp, maskApiKey, maskString } from './pii-mask.js';

/**
 * Create a structured JSON logger with service context.
 * Usage:
 *   const logger = createLogger('api');
 *   logger.info({ requestId: '...' }, 'Request received');
 */
export function createLogger(service: string) {
  return pino({
    name: service,
    level: env.LOG_LEVEL,
    timestamp: pino.stdTimeFunctions.isoTime,
    formatters: {
      level(label) {
        return { level: label };
      },
      bindings(bindings) {
        return { service: bindings.name, pid: bindings.pid, hostname: bindings.hostname };
      },
    },
    // Pretty print in development
    ...(env.NODE_ENV === 'development'
      ? {
          transport: {
            target: 'pino/file',
            options: { destination: 1 }, // stdout
          },
        }
      : {}),
  });
}

/** Default logger instance for general use */
export const logger = createLogger('mcq-platform');

export type Logger = pino.Logger;
