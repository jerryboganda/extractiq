import { Router } from 'express';
import { db } from '@mcq-platform/db';
import { sql } from 'drizzle-orm';
import { pingRedis, getQueueDepths } from '@mcq-platform/queue';
import { checkBucket } from '@mcq-platform/storage';
import { createLogger } from '@mcq-platform/logger';
import { getMetrics } from '../../middleware/metrics.js';

const logger = createLogger('health');
const router = Router();

router.get('/', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

router.get('/ready', async (_req, res) => {
  const checks: Record<string, 'ok' | 'error'> = {};

  // Database check
  try {
    await db.execute(sql`SELECT 1`);
    checks.database = 'ok';
  } catch (err) {
    logger.error({ err }, 'Health check: database unavailable');
    checks.database = 'error';
  }

  // Redis check
  try {
    await pingRedis();
    checks.redis = 'ok';
  } catch (err) {
    logger.error({ err }, 'Health check: redis unavailable');
    checks.redis = 'error';
  }

  // S3 / MinIO check
  try {
    await checkBucket();
    checks.storage = 'ok';
  } catch (err) {
    logger.error({ err }, 'Health check: storage unavailable');
    checks.storage = 'error';
  }

  const allOk = Object.values(checks).every((v) => v === 'ok');

  res.status(allOk ? 200 : 503).json({
    status: allOk ? 'ready' : 'degraded',
    timestamp: new Date().toISOString(),
    checks,
  });
});

router.get('/metrics', (_req, res) => {
  res.json(getMetrics());
});

router.get('/queues', async (_req, res) => {
  try {
    const depths = await getQueueDepths();
    res.json({ queues: depths });
  } catch (err) {
    logger.error({ err }, 'Failed to get queue depths');
    res.status(503).json({ error: 'Unable to retrieve queue depths' });
  }
});

export { router as healthRouter };
