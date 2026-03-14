import type { Job } from 'bullmq';
import type { NotificationPayload } from '@mcq-platform/queue';
import { db, notifications, users, emailDeliveries } from '@mcq-platform/db';
import { createLogger } from '@mcq-platform/logger';
import { env } from '@mcq-platform/config';
import { eq, and } from 'drizzle-orm';
import nodemailer from 'nodemailer';

const logger = createLogger('worker:notification');
const mailTransport = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: env.SMTP_SECURE,
  auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASS } : undefined,
});

/**
 * Notification Worker
 *
 * Creates notification records in the database.
 * If userId is empty, broadcasts to all workspace admins.
 */
export async function processNotification(job: Job<NotificationPayload>) {
  const { workspaceId, userId, type, title, message, data, recipientUserIds, emails, relatedId, relatedType } = job.data;
  logger.info({ workspaceId, userId, type }, 'Processing notification');

  let targetUserIds: string[] = [];

  if (recipientUserIds?.length) {
    targetUserIds = recipientUserIds;
  } else if (userId) {
    targetUserIds = [userId];
  } else if (workspaceId) {
    // Broadcast to workspace admins and operators
    const admins = await db
      .select({ id: users.id })
      .from(users)
      .where(and(
        eq(users.workspaceId, workspaceId),
        eq(users.status, 'active'),
      ));

    targetUserIds = admins.map((u) => u.id);
  }

  if (targetUserIds.length === 0 && !emails?.length) {
    logger.warn({ workspaceId, type }, 'No target users for notification');
    return;
  }

  const createdNotifications = targetUserIds.length > 0 && workspaceId
    ? await db.insert(notifications).values(
      targetUserIds.map((uid) => ({
        workspaceId,
        userId: uid,
        type,
        title,
        message,
        data: data ?? {},
        read: false,
      })),
    ).returning({
      id: notifications.id,
      userId: notifications.userId,
    })
    : [];

  if (emails?.length) {
    for (const email of emails) {
      const [delivery] = await db.insert(emailDeliveries).values({
        workspaceId: workspaceId ?? null,
        notificationId: createdNotifications[0]?.id ?? null,
        recipient: email.to,
        subject: email.subject,
        bodyText: email.text,
        bodyHtml: email.html ?? null,
        relatedType: relatedType ?? null,
        relatedId: relatedId ?? null,
      }).returning();

      try {
        if (!env.ENABLE_EMAIL_DELIVERY) {
          await db.update(emailDeliveries)
            .set({ status: 'skipped' })
            .where(eq(emailDeliveries.id, delivery.id));
          continue;
        }

        await mailTransport.sendMail({
          from: `${env.SMTP_FROM_NAME} <${env.SMTP_FROM}>`,
          to: email.to,
          subject: email.subject,
          text: email.text,
          html: email.html,
        });

        await db.update(emailDeliveries)
          .set({ status: 'sent', sentAt: new Date(), errorMessage: null })
          .where(eq(emailDeliveries.id, delivery.id));
      } catch (err) {
        await db.update(emailDeliveries)
          .set({ status: 'failed', errorMessage: (err as Error).message })
          .where(eq(emailDeliveries.id, delivery.id));
        logger.error({ err, recipient: email.to, type }, 'Email delivery failed');
      }
    }
  }

  logger.info(
    { workspaceId, type, recipientCount: targetUserIds.length, emailCount: emails?.length ?? 0 },
    'Notifications created',
  );
}
