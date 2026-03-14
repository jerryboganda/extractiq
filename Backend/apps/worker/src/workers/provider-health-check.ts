import type { Job } from 'bullmq';
import type { ProviderHealthCheckPayload } from '@mcq-platform/queue';
import { db, providerConfigs } from '@mcq-platform/db';
import { decryptProviderSecret } from '@mcq-platform/auth';
import { createLogger } from '@mcq-platform/logger';
import { env } from '@mcq-platform/config';
import { eq } from 'drizzle-orm';

const logger = createLogger('worker:provider-health-check');

/**
 * Provider Health Check Worker
 *
 * Periodically verifies that AI provider APIs are accessible
 * and responding within acceptable latency. Updates provider
 * health status in the database.
 */
export async function processProviderHealthCheck(job: Job<ProviderHealthCheckPayload>) {
  const { providerConfigId } = job.data;
  logger.info({ providerConfigId }, 'Starting provider health check');

  const [provider] = await db
    .select()
    .from(providerConfigs)
    .where(eq(providerConfigs.id, providerConfigId))
    .limit(1);

  if (!provider) {
    logger.warn({ providerConfigId }, 'Provider config not found');
    return;
  }

  let healthStatus: string;
  let latencyMs: number;

  try {
    const apiKey = decryptProviderSecret(provider.apiKeyEncrypted);
    const startTime = Date.now();

    const isHealthy = await checkProvider(provider.providerType, apiKey);
    latencyMs = Date.now() - startTime;

    if (isHealthy) {
      healthStatus = latencyMs > 5000 ? 'degraded' : 'healthy';
    } else {
      healthStatus = 'offline';
    }
  } catch (err) {
    healthStatus = 'offline';
    latencyMs = 0;
    logger.warn({ providerConfigId, error: (err as Error).message }, 'Health check failed');
  }

  await db.update(providerConfigs).set({
    healthStatus,
    lastHealthCheck: new Date(),
  }).where(eq(providerConfigs.id, providerConfigId));

  logger.info(
    { providerConfigId, healthStatus, latencyMs },
    'Provider health check complete',
  );
}

// ──────────────────────────────────────────────
// Provider-specific health checks
// ──────────────────────────────────────────────

async function checkProvider(providerType: string, apiKey: string): Promise<boolean> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    switch (providerType) {
      case 'openai':
        return await checkOpenAi(apiKey, controller.signal);
      case 'anthropic':
        return await checkAnthropic(apiKey, controller.signal);
      case 'google':
        return await checkGemini(apiKey, controller.signal);
      case 'mistral':
        return await checkMistral(apiKey, controller.signal);
      case 'qwen_vl':
        return await checkQwenVl(controller.signal);
      case 'glm_ocr':
        return await checkGlmOcr(controller.signal);
      default:
        return false;
    }
  } finally {
    clearTimeout(timeout);
  }
}

async function checkOpenAi(apiKey: string, signal: AbortSignal): Promise<boolean> {
  const response = await fetch('https://api.openai.com/v1/models', {
    headers: { Authorization: `Bearer ${apiKey}` },
    signal,
  });
  return response.ok;
}

async function checkAnthropic(apiKey: string, signal: AbortSignal): Promise<boolean> {
  // Anthropic doesn't have a models endpoint, so we use a cheap completion
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1,
      messages: [{ role: 'user', content: 'ping' }],
    }),
    signal,
  });
  return response.ok;
}

async function checkGemini(apiKey: string, signal: AbortSignal): Promise<boolean> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`,
    { signal },
  );
  return response.ok;
}

async function checkMistral(apiKey: string, signal: AbortSignal): Promise<boolean> {
  const response = await fetch('https://api.mistral.ai/v1/models', {
    headers: { Authorization: `Bearer ${apiKey}` },
    signal,
  });
  return response.ok;
}

async function checkQwenVl(signal: AbortSignal): Promise<boolean> {
  const endpoint = env.QWEN_VL_ENDPOINT;
  if (!endpoint) return false;

  const response = await fetch(`${endpoint}/health`, { signal });
  return response.ok;
}

async function checkGlmOcr(signal: AbortSignal): Promise<boolean> {
  const endpoint = env.GLM_OCR_ENDPOINT;
  if (!endpoint) return false;

  const response = await fetch(`${endpoint}/health`, { signal });
  return response.ok;
}

// ──────────────────────────────────────────────
// Decrypt provider API key (AES-256-GCM)
// ──────────────────────────────────────────────

