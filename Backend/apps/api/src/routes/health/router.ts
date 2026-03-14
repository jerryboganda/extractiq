import { Router } from 'express';
import { db } from '@mcq-platform/db';
import { sql } from 'drizzle-orm';
import { pingRedis, getQueue, getQueueDepths, QUEUE_NAMES } from '@mcq-platform/queue';
import { checkBucket } from '@mcq-platform/storage';
import { env } from '@mcq-platform/config';
import { createLogger } from '@mcq-platform/logger';
import { getMetrics } from '../../middleware/metrics.js';
import net from 'node:net';

const logger = createLogger('health');
const router = Router();

type CheckStatus = 'ok' | 'error';

async function checkSmtp(timeoutMs: number = 2_000): Promise<void> {
  if (!env.ENABLE_EMAIL_DELIVERY) {
    return;
  }

  await new Promise<void>((resolve, reject) => {
    const socket = net.createConnection({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
    });

    const finish = (error?: Error) => {
      socket.removeAllListeners();
      socket.end();
      if (error) reject(error);
      else resolve();
    };

    socket.setTimeout(timeoutMs);
    socket.once('connect', () => finish());
    socket.once('timeout', () => finish(new Error('SMTP connection timed out')));
    socket.once('error', (error) => finish(error));
  });
}

export async function runReadinessChecks() {
  const checks: Record<string, CheckStatus> = {};
  const reasons: string[] = [];

  try {
    await db.execute(sql`SELECT 1`);
    checks.database = 'ok';
  } catch (err) {
    logger.error({ err }, 'Health check: database unavailable');
    checks.database = 'error';
    reasons.push('database unavailable');
  }

  try {
    await pingRedis();
    checks.redis = 'ok';
  } catch (err) {
    logger.error({ err }, 'Health check: redis unavailable');
    checks.redis = 'error';
    reasons.push('redis unavailable');
  }

  try {
    await getQueue(QUEUE_NAMES.NOTIFICATION).getJobCounts('waiting');
    checks.queue = 'ok';
  } catch (err) {
    logger.error({ err }, 'Health check: queue unavailable');
    checks.queue = 'error';
    reasons.push('queue access unavailable');
  }

  try {
    await checkBucket();
    checks.storage = 'ok';
  } catch (err) {
    logger.error({ err }, 'Health check: storage unavailable');
    checks.storage = 'error';
    reasons.push('storage unavailable');
  }

  try {
    await checkSmtp();
    checks.email = 'ok';
  } catch (err) {
    logger.error({ err }, 'Health check: email transport unavailable');
    checks.email = 'error';
    reasons.push('email transport unavailable');
  }

  return {
    checks,
    reasons,
    allOk: Object.values(checks).every((value) => value === 'ok'),
  };
}

router.get('/', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

router.get('/ready', async (_req, res) => {
  const { checks, reasons, allOk } = await runReadinessChecks();

  res.status(allOk ? 200 : 503).json({
    status: allOk ? 'ready' : 'degraded',
    timestamp: new Date().toISOString(),
    checks,
    reasons,
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
