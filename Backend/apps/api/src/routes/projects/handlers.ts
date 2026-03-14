import type { Request, Response, NextFunction } from 'express';
import { eq, and, count, desc } from 'drizzle-orm';
import { db, projects, documents, mcqRecords } from '@mcq-platform/db';
import { AppError } from '../../middleware/error-handler.js';

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const { page, limit } = req.query as unknown as { page: number; limit: number };
    const offset = (page - 1) * limit;

    const items = await db
      .select({
        id: projects.id,
        name: projects.name,
        description: projects.description,
        status: projects.status,
        createdAt: projects.createdAt,
      })
      .from(projects)
      .where(eq(projects.workspaceId, req.workspaceId))
      .orderBy(desc(projects.createdAt))
      .limit(limit)
      .offset(offset);

    const [{ total }] = await db
      .select({ total: count() })
      .from(projects)
      .where(eq(projects.workspaceId, req.workspaceId));

    // Enrich with doc + mcq counts
    const enriched = await Promise.all(
      items.map(async (p) => {
        const [docCount] = await db.select({ count: count() }).from(documents).where(eq(documents.projectId, p.id));
        const [mcqCount] = await db.select({ count: count() }).from(mcqRecords).where(eq(mcqRecords.projectId, p.id));
        return { ...p, documentsCount: docCount.count, mcqCount: mcqCount.count };
      }),
    );

    res.json({
      data: {
        items: enriched,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const [project] = await db
      .insert(projects)
      .values({
        workspaceId: req.workspaceId,
        name: req.body.name,
        description: req.body.description ?? null,
      })
      .returning();

    res.status(201).json({ data: project });
  } catch (err) {
    next(err);
  }
}

export async function getById(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;
    const [project] = await db
      .select()
      .from(projects)
      .where(and(eq(projects.id, id), eq(projects.workspaceId, req.workspaceId)))
      .limit(1);

    if (!project) throw new AppError(404, 'NOT_FOUND', 'Project not found');

    const [docCount] = await db.select({ count: count() }).from(documents).where(eq(documents.projectId, project.id));
    const [mcqCount] = await db.select({ count: count() }).from(mcqRecords).where(eq(mcqRecords.projectId, project.id));

    res.json({ data: { ...project, documentsCount: docCount.count, mcqCount: mcqCount.count } });
  } catch (err) {
    next(err);
  }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;
    const [project] = await db
      .update(projects)
      .set(req.body)
      .where(and(eq(projects.id, id), eq(projects.workspaceId, req.workspaceId)))
      .returning();

    if (!project) throw new AppError(404, 'NOT_FOUND', 'Project not found');

    res.json({ data: project });
  } catch (err) {
    next(err);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;
    const [project] = await db
      .delete(projects)
      .where(and(eq(projects.id, id), eq(projects.workspaceId, req.workspaceId)))
      .returning();

    if (!project) throw new AppError(404, 'NOT_FOUND', 'Project not found');

    res.json({ data: { message: 'Project deleted' } });
  } catch (err) {
    next(err);
  }
}
