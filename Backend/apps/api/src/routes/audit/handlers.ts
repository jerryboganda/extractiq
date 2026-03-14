import type { Request, Response, NextFunction } from 'express';
import { eq, count, desc } from 'drizzle-orm';
import { db, auditLogs, users } from '@mcq-platform/db';

function parsePag(query: Record<string, unknown>) {
  const page = Math.max(1, Math.floor(Number(query.page) || 1));
  const limit = Math.min(100, Math.max(1, Math.floor(Number(query.limit) || 20)));
  return { page, limit, offset: (page - 1) * limit };
}

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const { page, limit, offset } = parsePag(req.query as Record<string, unknown>);

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
