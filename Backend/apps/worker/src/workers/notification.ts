import type { Job } from 'bullmq';
import type { NotificationPayload } from '@mcq-platform/queue';
import { db, notifications, users } from '@mcq-platform/db';
import { createLogger } from '@mcq-platform/logger';
import { eq, and } from 'drizzle-orm';

const logger = createLogger('worker:notification');

/**
 * Notification Worker
 *
 * Creates notification records in the database.
 * If userId is empty, broadcasts to all workspace admins.
 */
export async function processNotification(job: Job<NotificationPayload>) {
  const { workspaceId, userId, type, title, message, data } = job.data;
  logger.info({ workspaceId, userId, type }, 'Processing notification');

  let targetUserIds: string[] = [];

  if (userId) {
    targetUserIds = [userId];
  } else {
    // Broadcast to workspace admins and operators
    const admins = await db
      .select({ id: users.id })
      .from(users)
      .where(and(
        eq(users.workspaceId, workspaceId),
        eq(users.status, 'active'),
      ));

    targetUserIds = admins
      .filter(() => true)  // All active users in workspace get notifications
      .map((u) => u.id);
  }

  if (targetUserIds.length === 0) {
    logger.warn({ workspaceId, type }, 'No target users for notification');
    return;
  }

  // Insert notification for each target user
  await db.insert(notifications).values(
    targetUserIds.map((uid) => ({
      workspaceId,
      userId: uid,
      type,
      title,
      message,
      data: data ?? {},
      read: false,
    })),
  );

  logger.info(
    { workspaceId, type, recipientCount: targetUserIds.length },
    'Notifications created',
  );
}
