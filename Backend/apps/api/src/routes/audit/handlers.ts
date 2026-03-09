import type { Request, Response, NextFunction } from 'express';
import { eq, count, desc } from 'drizzle-orm';
import { db, auditLogs, users } from '@mcq-platform/db';

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const { page, limit } = req.query as unknown as { page: number; limit: number };
    const offset = (page - 1) * limit;

    const items = await db
      .select()
      .from(auditLogs)
      .where(eq(auditLogs.workspaceId, req.workspaceId))
      .orderBy(desc(auditLogs.createdAt))
      .limit(limit)
      .offset(offset);

    const [{ total }] = await db
      .select({ total: count() })
      .from(auditLogs)
      .where(eq(auditLogs.workspaceId, req.workspaceId));

    // Enrich with user names
    const enriched = await Promise.all(
      items.map(async (log) => {
        let actorName = 'System';
        if (log.userId) {
          const [user] = await db
            .select({ name: users.name })
            .from(users)
            .where(eq(users.id, log.userId))
            .limit(1);
          if (user) actorName = user.name;
        }
        return { ...log, actor: actorName };
      }),
    );

    res.json({
      data: { items: enriched, total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
}
