import type { Request, Response, NextFunction } from 'express';
import { eq, and, desc } from 'drizzle-orm';
import { db, notifications } from '@mcq-platform/db';
import { AppError } from '../../middleware/error-handler.js';

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const items = await db
      .select()
      .from(notifications)
      .where(and(eq(notifications.userId, req.userId), eq(notifications.workspaceId, req.workspaceId)))
      .orderBy(desc(notifications.createdAt))
      .limit(50);

    res.json({ data: items });
  } catch (err) {
    next(err);
  }
}

export async function markRead(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;
    const [notif] = await db
      .update(notifications)
      .set({ read: true })
      .where(and(eq(notifications.id, id), eq(notifications.userId, req.userId)))
      .returning();

    if (!notif) throw new AppError(404, 'NOT_FOUND', 'Notification not found');

    res.json({ data: notif });
  } catch (err) {
    next(err);
  }
}

export async function markAllRead(req: Request, res: Response, next: NextFunction) {
  try {
    await db
      .update(notifications)
      .set({ read: true })
      .where(and(eq(notifications.userId, req.userId), eq(notifications.workspaceId, req.workspaceId)));

    res.json({ data: { message: 'All notifications marked as read' } });
  } catch (err) {
    next(err);
  }
}
