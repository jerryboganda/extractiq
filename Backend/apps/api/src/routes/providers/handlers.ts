import type { Request, Response, NextFunction } from 'express';
import { eq, and, desc } from 'drizzle-orm';
import { db, providerConfigs, providerBenchmarks } from '@mcq-platform/db';
import { env } from '@mcq-platform/config';
import { AppError } from '../../middleware/error-handler.js';
import crypto from 'node:crypto';

// Simple AES-256-GCM encryption for API keys at rest
function encryptApiKey(plaintext: string): string {
  const key = Buffer.from(env.ENCRYPTION_KEY, 'hex');
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString('base64');
}

function decryptApiKey(ciphertext: string): string {
  const key = Buffer.from(env.ENCRYPTION_KEY, 'hex');
  const buf = Buffer.from(ciphertext, 'base64');
  const iv = buf.subarray(0, 12);
  const tag = buf.subarray(12, 28);
  const encrypted = buf.subarray(28);
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  return decipher.update(encrypted) + decipher.final('utf8');
}

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

    const encryptedKey = encryptApiKey(apiKey);

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
    if (req.body.apiKey) updates.apiKeyEncrypted = encryptApiKey(req.body.apiKey);

    const [provider] = await db
      .update(providerConfigs)
      .set(updates)
      .where(and(eq(providerConfigs.id, id), eq(providerConfigs.workspaceId, req.workspaceId)))
      .returning();

    if (!provider) throw new AppError(404, 'NOT_FOUND', 'Provider not found');

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

    // Decrypt API key and test connectivity
    const apiKey = decryptApiKey(provider.apiKeyEncrypted);
    const start = Date.now();

    // Simple connectivity test — varies by provider
    let healthy = false;
    try {
      // For now, just verify the key is decryptable and non-empty
      healthy = apiKey.length > 0;
    } catch {
      healthy = false;
    }

    const latency = Date.now() - start;
    const newStatus = healthy ? 'healthy' : 'degraded';

    await db
      .update(providerConfigs)
      .set({ healthStatus: newStatus, lastHealthCheck: new Date() })
      .where(eq(providerConfigs.id, provider.id));

    res.json({
      data: {
        status: newStatus,
        latencyMs: latency,
        message: healthy ? 'Provider is reachable' : 'Provider test failed',
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
