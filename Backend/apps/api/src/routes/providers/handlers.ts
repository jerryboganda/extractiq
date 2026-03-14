import type { Request, Response, NextFunction } from 'express';
import { eq, and, desc } from 'drizzle-orm';
import { db, providerConfigs, providerBenchmarks } from '@mcq-platform/db';
import { decryptProviderSecret, encryptProviderSecret } from '@mcq-platform/auth';
import { env } from '@mcq-platform/config';
import { AppError } from '../../middleware/error-handler.js';
import { writeAuditLog } from '../../lib/audit.js';

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const items = await db
      .select({
        id: providerConfigs.id,
        category: providerConfigs.category,
        providerType: providerConfigs.providerType,
        displayName: providerConfigs.displayName,
        models: providerConfigs.models,
        config: providerConfigs.config,
        healthStatus: providerConfigs.healthStatus,
        isDefault: providerConfigs.isDefault,
        isEnabled: providerConfigs.isEnabled,
        lastHealthCheck: providerConfigs.lastHealthCheck,
        createdAt: providerConfigs.createdAt,
      })
      .from(providerConfigs)
      .where(eq(providerConfigs.workspaceId, req.workspaceId))
      .orderBy(desc(providerConfigs.createdAt));

    // Enrich with latest benchmark
    const enriched = await Promise.all(
      items.map(async (p) => {
        const [benchmark] = await db
          .select()
          .from(providerBenchmarks)
          .where(eq(providerBenchmarks.providerConfigId, p.id))
          .orderBy(desc(providerBenchmarks.measuredAt))
          .limit(1);

        return {
          ...p,
          accuracy: benchmark?.accuracy ?? null,
          avgLatency: benchmark?.avgLatencyMs ? `${benchmark.avgLatencyMs}ms` : null,
          costPerRecord: benchmark?.costPerRecord ?? null,
          errorRate: benchmark?.errorRate ?? null,
          totalCost: benchmark?.totalCost ?? 0,
        };
      }),
    );

    res.json({ data: enriched });
  } catch (err) {
    next(err);
  }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const { displayName, category, providerType, apiKey, models, config } = req.body;

    const encryptedKey = encryptProviderSecret(apiKey);

    const [provider] = await db
      .insert(providerConfigs)
      .values({
        workspaceId: req.workspaceId,
        displayName,
        category,
        providerType,
        apiKeyEncrypted: encryptedKey,
        models,
        config: config ?? {},
      })
      .returning();

    writeAuditLog({
      workspaceId: req.workspaceId,
      userId: req.userId,
      resourceType: 'provider',
      resourceId: provider.id,
      action: 'provider.created',
      details: { displayName, category, providerType },
    });

    res.status(201).json({
      data: {
        id: provider.id,
        displayName: provider.displayName,
        category: provider.category,
        providerType: provider.providerType,
        models: provider.models,
        healthStatus: provider.healthStatus,
        isEnabled: provider.isEnabled,
        createdAt: provider.createdAt,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function getById(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;
    const [provider] = await db
      .select({
        id: providerConfigs.id,
        category: providerConfigs.category,
        providerType: providerConfigs.providerType,
        displayName: providerConfigs.displayName,
        models: providerConfigs.models,
        config: providerConfigs.config,
        healthStatus: providerConfigs.healthStatus,
        isDefault: providerConfigs.isDefault,
        isEnabled: providerConfigs.isEnabled,
        lastHealthCheck: providerConfigs.lastHealthCheck,
        createdAt: providerConfigs.createdAt,
      })
      .from(providerConfigs)
      .where(and(eq(providerConfigs.id, id), eq(providerConfigs.workspaceId, req.workspaceId)))
      .limit(1);

    if (!provider) throw new AppError(404, 'NOT_FOUND', 'Provider not found');

    res.json({ data: provider });
  } catch (err) {
    next(err);
  }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;
    const updates: Record<string, unknown> = {};
    if (req.body.displayName) updates.displayName = req.body.displayName;
    if (req.body.models) updates.models = req.body.models;
    if (req.body.config) updates.config = req.body.config;
    if (typeof req.body.isEnabled === 'boolean') updates.isEnabled = req.body.isEnabled;
    if (req.body.apiKey) updates.apiKeyEncrypted = encryptProviderSecret(req.body.apiKey);

    const [provider] = await db
      .update(providerConfigs)
      .set(updates)
      .where(and(eq(providerConfigs.id, id), eq(providerConfigs.workspaceId, req.workspaceId)))
      .returning();

    if (!provider) throw new AppError(404, 'NOT_FOUND', 'Provider not found');

    writeAuditLog({
      workspaceId: req.workspaceId,
      userId: req.userId,
      resourceType: 'provider',
      resourceId: provider.id,
      action: 'provider.updated',
      details: Object.keys(updates).reduce<Record<string, unknown>>((acc, key) => {
        if (key !== 'apiKeyEncrypted') acc[key] = updates[key];
        return acc;
      }, {}),
    });

    res.json({ data: provider });
  } catch (err) {
    next(err);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;
    const [provider] = await db
      .delete(providerConfigs)
      .where(and(eq(providerConfigs.id, id), eq(providerConfigs.workspaceId, req.workspaceId)))
      .returning();

    if (!provider) throw new AppError(404, 'NOT_FOUND', 'Provider not found');

    writeAuditLog({
      workspaceId: req.workspaceId,
      userId: req.userId,
      resourceType: 'provider',
      resourceId: provider.id,
      action: 'provider.deleted',
      details: { displayName: provider.displayName, providerType: provider.providerType },
    });

    res.json({ data: { message: 'Provider deleted' } });
  } catch (err) {
    next(err);
  }
}

export async function test(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;
    const [provider] = await db
      .select()
      .from(providerConfigs)
      .where(and(eq(providerConfigs.id, id), eq(providerConfigs.workspaceId, req.workspaceId)))
      .limit(1);

    if (!provider) throw new AppError(404, 'NOT_FOUND', 'Provider not found');

    const apiKey = decryptProviderSecret(provider.apiKeyEncrypted);
    const start = Date.now();

    let healthy = false;
    let latency = 0;
    let errorMessage = '';

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);

      switch (provider.providerType) {
        case 'openai': {
          const response = await fetch('https://api.openai.com/v1/models', {
            headers: { Authorization: `Bearer ${apiKey}` },
            signal: controller.signal,
          });
          healthy = response.ok;
          if (!response.ok) errorMessage = `OpenAI API error: ${response.status}`;
          break;
        }
        case 'anthropic': {
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
            signal: controller.signal,
          });
          healthy = response.ok;
          if (!response.ok) errorMessage = `Anthropic API error: ${response.status}`;
          break;
        }
        case 'google': {
          const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`, {
            signal: controller.signal,
          });
          healthy = response.ok;
          if (!response.ok) errorMessage = `Google API error: ${response.status}`;
          break;
        }
        case 'mistral': {
          const response = await fetch('https://api.mistral.ai/v1/models', {
            headers: { Authorization: `Bearer ${apiKey}` },
            signal: controller.signal,
          });
          healthy = response.ok;
          if (!response.ok) errorMessage = `Mistral API error: ${response.status}`;
          break;
        }
        case 'qwen_vl': {
          if (!env.QWEN_VL_ENDPOINT || !env.QWEN_VL_API_KEY) {
            errorMessage = 'Qwen VL endpoint or API key not configured';
            break;
          }
          const response = await fetch(`${env.QWEN_VL_ENDPOINT}/health`, {
            signal: controller.signal,
          });
          healthy = response.ok;
          if (!response.ok) errorMessage = `Qwen VL API error: ${response.status}`;
          break;
        }
        case 'glm_ocr': {
          if (!env.GLM_OCR_ENDPOINT) {
            errorMessage = 'GLM OCR endpoint not configured';
            break;
          }
          const response = await fetch(`${env.GLM_OCR_ENDPOINT}/health`, {
            signal: controller.signal,
          });
          healthy = response.ok;
          if (!response.ok) errorMessage = `GLM OCR API error: ${response.status}`;
          break;
        }
        default:
          errorMessage = `Unsupported provider type: ${provider.providerType}`;
      }

      latency = Date.now() - start;
      clearTimeout(timeout);
    } catch (err) {
      latency = Date.now() - start;
      errorMessage = err instanceof Error ? err.message : 'Provider connectivity test failed';
    }

    const newStatus = healthy ? (latency > 5000 ? 'degraded' : 'healthy') : 'offline';

    await db
      .update(providerConfigs)
      .set({ healthStatus: newStatus, lastHealthCheck: new Date() })
      .where(eq(providerConfigs.id, provider.id));

    writeAuditLog({
      workspaceId: req.workspaceId,
      userId: req.userId,
      resourceType: 'provider',
      resourceId: provider.id,
      action: 'provider.tested',
      details: { status: newStatus, latencyMs: latency },
    });

    res.json({
      data: {
        status: newStatus,
        latencyMs: latency,
        message: healthy ? 'Provider is reachable' : errorMessage || 'Provider test failed',
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function getBenchmarks(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;
    const benchmarks = await db
      .select()
      .from(providerBenchmarks)
      .where(eq(providerBenchmarks.providerConfigId, id))
      .orderBy(desc(providerBenchmarks.measuredAt))
      .limit(30);

    res.json({ data: benchmarks });
  } catch (err) {
    next(err);
  }
}
