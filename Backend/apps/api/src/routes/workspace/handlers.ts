import type { Request, Response, NextFunction } from 'express';
import { eq, count } from 'drizzle-orm';
import { db, workspaces, documents, auditLogs } from '@mcq-platform/db';
import { AppError } from '../../middleware/error-handler.js';
import { writeAuditLog } from '../../lib/audit.js';

export async function get(req: Request, res: Response, next: NextFunction) {
  try {
    const [workspace] = await db
      .select()
      .from(workspaces)
      .where(eq(workspaces.id, req.workspaceId))
      .limit(1);

    if (!workspace) throw new AppError(404, 'NOT_FOUND', 'Workspace not found');

    res.json({ data: workspace });
  } catch (err) {
    next(err);
  }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const updates: Record<string, unknown> = {};
    if (req.body.name !== undefined) updates.name = req.body.name;
    if (typeof req.body.maxFileSizeMb === 'number') updates.maxFileSizeMb = req.body.maxFileSizeMb;
    if (req.body.autoApproveThreshold !== undefined) updates.autoApproveThreshold = req.body.autoApproveThreshold;

    // Settings-backed workspace fields live in the settings JSON blob.
    if (
      req.body.description !== undefined ||
      req.body.emailNotifications !== undefined ||
      req.body.webhookUrl !== undefined
    ) {
      const [current] = await db.select().from(workspaces).where(eq(workspaces.id, req.workspaceId)).limit(1);
      const currentSettings = (current?.settings ?? {}) as Record<string, unknown>;

      if (req.body.description !== undefined) currentSettings.description = req.body.description;
      if (req.body.emailNotifications !== undefined) currentSettings.emailNotifications = req.body.emailNotifications;
      if (req.body.webhookUrl !== undefined) currentSettings.webhookUrl = req.body.webhookUrl;

      updates.settings = currentSettings;
    }

    const [workspace] = await db
      .update(workspaces)
      .set(updates)
      .where(eq(workspaces.id, req.workspaceId))
      .returning();

    if (!workspace) throw new AppError(404, 'NOT_FOUND', 'Workspace not found');

    writeAuditLog({
      workspaceId: req.workspaceId,
      userId: req.userId,
      resourceType: 'workspace',
      resourceId: req.workspaceId,
      action: 'workspace.updated',
      details: updates,
    });

    res.json({ data: workspace });
  } catch (err) {
    next(err);
  }
}

export async function usage(req: Request, res: Response, next: NextFunction) {
  try {
    const [workspace] = await db
      .select()
      .from(workspaces)
      .where(eq(workspaces.id, req.workspaceId))
      .limit(1);

    if (!workspace) throw new AppError(404, 'NOT_FOUND', 'Workspace not found');

    const [docCount] = await db
      .select({ count: count() })
      .from(documents)
      .where(eq(documents.workspaceId, req.workspaceId));

    // Count API-level actions from audit logs as a proxy for API calls
    const [apiCount] = await db
      .select({ count: count() })
      .from(auditLogs)
      .where(eq(auditLogs.workspaceId, req.workspaceId));

    const planLimits: Record<string, { docs: number; api: number }> = {
      free: { docs: 50, api: 1000 },
      pro: { docs: 500, api: 10000 },
      enterprise: { docs: -1, api: -1 }, // unlimited
    };

    const limits = planLimits[workspace.plan] ?? planLimits.free;

    res.json({
      data: {
        documentsUsed: docCount.count,
        documentsLimit: limits.docs,
        apiCallsUsed: apiCount.count,
        apiCallsLimit: limits.api,
      },
    });
  } catch (err) {
    next(err);
  }
}
