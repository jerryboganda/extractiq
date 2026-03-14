import { db, auditLogs } from '@mcq-platform/db';

interface AuditLogParams {
  workspaceId: string;
  userId: string;
  resourceType: string;
  resourceId?: string;
  action: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Write an entry to the audit log.
 * Fire-and-forget — callers should not await this in the critical path.
 */
export async function writeAuditLog(params: AuditLogParams): Promise<void> {
  try {
    await db.insert(auditLogs).values({
      workspaceId: params.workspaceId,
      userId: params.userId,
      resourceType: params.resourceType,
      resourceId: params.resourceId ?? null,
      action: params.action,
      details: params.details ?? null,
      ipAddress: params.ipAddress ?? null,
      userAgent: params.userAgent ?? null,
    });
  } catch {
    // Audit logging should never break the main flow
  }
}
