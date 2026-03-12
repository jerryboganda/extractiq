import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import { env } from '@mcq-platform/config';
import { createLogger } from '@mcq-platform/logger';
import { closeDb } from '@mcq-platform/db';
import { closeAllQueues } from '@mcq-platform/queue';

import { errorHandler } from './middleware/error-handler.js';
import { requestLogger } from './middleware/request-logger.js';
import { correlationId } from './middleware/correlation-id.js';
import { rateLimiter } from './middleware/rate-limiter.js';
import { metricsMiddleware } from './middleware/metrics.js';

// Route modules
import { authRouter } from './routes/auth/router.js';
import { projectsRouter } from './routes/projects/router.js';
import { documentsRouter } from './routes/documents/router.js';
import { jobsRouter } from './routes/jobs/router.js';
import { mcqRouter } from './routes/mcq/router.js';
import { reviewRouter } from './routes/review/router.js';
import { providersRouter } from './routes/providers/router.js';
import { exportRouter } from './routes/export/router.js';
import { analyticsRouter } from './routes/analytics/router.js';
import { usersRouter } from './routes/users/router.js';
import { workspaceRouter } from './routes/workspace/router.js';
import { auditRouter } from './routes/audit/router.js';
import { notificationsRouter } from './routes/notifications/router.js';
import { searchRouter } from './routes/search/router.js';
import { dashboardRouter } from './routes/dashboard/router.js';
import { healthRouter } from './routes/health/router.js';

const logger = createLogger('api');

const app = express();

// ──────────────────────────────────────────────
// Global Middleware
// ──────────────────────────────────────────────
app.use(helmet());
app.use(compression());

// Trust first proxy (Nginx) — required for correct client IP in rate limiting & logging
if (env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

app.use(cors({
  origin: env.CORS_ORIGIN,
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(correlationId);
app.use(metricsMiddleware);
app.use(requestLogger);
app.use(rateLimiter);

// ──────────────────────────────────────────────
// API Routes — all under /api/v1
// ──────────────────────────────────────────────
const v1 = express.Router();

v1.use('/health', healthRouter);
v1.use('/auth', authRouter);
v1.use('/dashboard', dashboardRouter);
v1.use('/projects', projectsRouter);
v1.use('/documents', documentsRouter);
v1.use('/jobs', jobsRouter);
v1.use('/mcq', mcqRouter);
v1.use('/review', reviewRouter);
v1.use('/providers', providersRouter);
v1.use('/export', exportRouter);
v1.use('/analytics', analyticsRouter);
v1.use('/users', usersRouter);
v1.use('/workspace', workspaceRouter);
v1.use('/audit', auditRouter);
v1.use('/notifications', notificationsRouter);
v1.use('/search', searchRouter);

app.use('/api/v1', v1);

// ──────────────────────────────────────────────
// Error Handler (must be last)
// ──────────────────────────────────────────────
app.use(errorHandler);

// ──────────────────────────────────────────────
// Start Server
// ──────────────────────────────────────────────
const PORT = env.API_PORT;

const server = app.listen(PORT, () => {
  logger.info({ port: PORT, env: env.NODE_ENV }, 'API server started');
});

// ──────────────────────────────────────────────
// Graceful Shutdown
// ──────────────────────────────────────────────
async function shutdown(signal: string) {
  logger.info({ signal }, 'Shutdown signal received');

  server.close(async () => {
    logger.info('HTTP server closed');
    await Promise.all([
      closeDb(),
      closeAllQueues(),
    ]);
    logger.info('All connections closed, exiting');
    process.exit(0);
  });

  // Force exit after 15s
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 15000);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

export { app };
