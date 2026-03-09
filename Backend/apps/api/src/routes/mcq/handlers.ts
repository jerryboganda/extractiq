import type { Request, Response, NextFunction } from 'express';
import { eq, and, count, desc } from 'drizzle-orm';
import { db, mcqRecords, mcqRecordHistory } from '@mcq-platform/db';
import { AppError } from '../../middleware/error-handler.js';

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const { page, limit } = req.query as unknown as { page: number; limit: number };
    const offset = (page - 1) * limit;

    const items = await db
      .select()
      .from(mcqRecords)
      .where(eq(mcqRecords.workspaceId, req.workspaceId))
      .orderBy(desc(mcqRecords.createdAt))
      .limit(limit)
      .offset(offset);

    const [{ total }] = await db
      .select({ total: count() })
      .from(mcqRecords)
      .where(eq(mcqRecords.workspaceId, req.workspaceId));

    res.json({
      data: {
        items,
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

export async function getById(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;
    const [record] = await db
      .select()
      .from(mcqRecords)
      .where(and(eq(mcqRecords.id, id), eq(mcqRecords.workspaceId, req.workspaceId)))
      .limit(1);

    if (!record) throw new AppError(404, 'NOT_FOUND', 'MCQ record not found');

    res.json({ data: record });
  } catch (err) {
    next(err);
  }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;
    const { version, ...updates } = req.body;

    // Optimistic concurrency: check version
    const [existing] = await db
      .select()
      .from(mcqRecords)
      .where(and(eq(mcqRecords.id, id), eq(mcqRecords.workspaceId, req.workspaceId)))
      .limit(1);

    if (!existing) throw new AppError(404, 'NOT_FOUND', 'MCQ record not found');
    if (existing.version !== version) throw new AppError(409, 'VERSION_CONFLICT', 'Record has been modified by another user');

    // Save history
    await db.insert(mcqRecordHistory).values({
      mcqRecordId: existing.id,
      version: existing.version,
      previousValues: updates,
      changedBy: req.userId,
      changeType: 'manual_edit',
    });

    // Apply update
    const [updated] = await db
      .update(mcqRecords)
      .set({
        ...updates,
        version: existing.version + 1,
        updatedAt: new Date(),
      })
      .where(eq(mcqRecords.id, id))
      .returning();

    res.json({ data: updated });
  } catch (err) {
    next(err);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;
    const [record] = await db
      .delete(mcqRecords)
      .where(and(eq(mcqRecords.id, id), eq(mcqRecords.workspaceId, req.workspaceId)))
      .returning();

    if (!record) throw new AppError(404, 'NOT_FOUND', 'MCQ record not found');

    res.json({ data: { message: 'MCQ record deleted' } });
  } catch (err) {
    next(err);
  }
}

export async function getHistory(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;
    const history = await db
      .select()
      .from(mcqRecordHistory)
      .where(eq(mcqRecordHistory.mcqRecordId, id))
      .orderBy(desc(mcqRecordHistory.createdAt));

    res.json({ data: history });
  } catch (err) {
    next(err);
  }
}
