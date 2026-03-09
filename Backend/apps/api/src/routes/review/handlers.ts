import type { Request, Response, NextFunction } from 'express';
import { eq, and, count, desc, sql } from 'drizzle-orm';
import { db, reviewItems, reviewActions, mcqRecords } from '@mcq-platform/db';
import { AppError } from '../../middleware/error-handler.js';

export async function listQueue(req: Request, res: Response, next: NextFunction) {
  try {
    const { page, limit } = req.query as unknown as { page: number; limit: number };
    const offset = (page - 1) * limit;

    const items = await db
      .select({
        id: reviewItems.id,
        mcqRecordId: reviewItems.mcqRecordId,
        severity: reviewItems.severity,
        flagTypes: reviewItems.flagTypes,
        reasonSummary: reviewItems.reasonSummary,
        assignedTo: reviewItems.assignedTo,
        status: reviewItems.status,
        createdAt: reviewItems.createdAt,
      })
      .from(reviewItems)
      .where(and(
        eq(reviewItems.workspaceId, req.workspaceId),
        sql`${reviewItems.status} IN ('pending', 'in_review')`,
      ))
      .orderBy(desc(reviewItems.createdAt))
      .limit(limit)
      .offset(offset);

    const [{ total }] = await db
      .select({ total: count() })
      .from(reviewItems)
      .where(and(
        eq(reviewItems.workspaceId, req.workspaceId),
        sql`${reviewItems.status} IN ('pending', 'in_review')`,
      ));

    // Enrich with MCQ data
    const enriched = await Promise.all(
      items.map(async (item) => {
        const [mcq] = await db
          .select({
            questionText: mcqRecords.questionText,
            confidence: mcqRecords.confidence,
            options: mcqRecords.options,
          })
          .from(mcqRecords)
          .where(eq(mcqRecords.id, item.mcqRecordId))
          .limit(1);

        return {
          ...item,
          question: mcq?.questionText ?? '',
          confidence: mcq?.confidence ?? 0,
        };
      }),
    );

    res.json({
      data: { items: enriched, total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
}

export async function getDetail(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;
    const [item] = await db
      .select()
      .from(reviewItems)
      .where(and(eq(reviewItems.id, id), eq(reviewItems.workspaceId, req.workspaceId)))
      .limit(1);

    if (!item) throw new AppError(404, 'NOT_FOUND', 'Review item not found');

    const [mcq] = await db
      .select()
      .from(mcqRecords)
      .where(eq(mcqRecords.id, item.mcqRecordId))
      .limit(1);

    const actions = await db
      .select()
      .from(reviewActions)
      .where(eq(reviewActions.reviewItemId, item.id))
      .orderBy(desc(reviewActions.createdAt));

    res.json({ data: { ...item, mcq, actions } });
  } catch (err) {
    next(err);
  }
}

async function performReviewAction(
  reviewItemId: string,
  workspaceId: string,
  userId: string,
  actionType: string,
  newStatus: string,
  changes?: Record<string, unknown>,
  notes?: string,
) {
  const [item] = await db
    .select()
    .from(reviewItems)
    .where(and(eq(reviewItems.id, reviewItemId), eq(reviewItems.workspaceId, workspaceId)))
    .limit(1);

  if (!item) throw new AppError(404, 'NOT_FOUND', 'Review item not found');

  await db.insert(reviewActions).values({
    reviewItemId: item.id,
    actionType,
    performedBy: userId,
    changes: changes ?? null,
    reviewerNotes: notes ?? null,
  });

  const [updated] = await db
    .update(reviewItems)
    .set({ status: newStatus, resolvedAt: new Date() })
    .where(eq(reviewItems.id, item.id))
    .returning();

  // Update MCQ review status
  await db
    .update(mcqRecords)
    .set({ reviewStatus: newStatus, updatedAt: new Date() })
    .where(eq(mcqRecords.id, item.mcqRecordId));

  return updated;
}

export async function approve(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await performReviewAction(req.params.id as string, req.workspaceId, req.userId, 'approve', 'approved');
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
}

export async function reject(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await performReviewAction(req.params.id as string, req.workspaceId, req.userId, 'reject', 'rejected');
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
}

export async function flag(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await performReviewAction(
      req.params.id as string, req.workspaceId, req.userId, 'flag', 'flagged',
      undefined, req.body.reason,
    );
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
}

export async function edit(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;
    const [item] = await db
      .select()
      .from(reviewItems)
      .where(and(eq(reviewItems.id, id), eq(reviewItems.workspaceId, req.workspaceId)))
      .limit(1);

    if (!item) throw new AppError(404, 'NOT_FOUND', 'Review item not found');

    // Apply edits to the MCQ record
    const mcqUpdates: Record<string, unknown> = {};
    if (req.body.question) mcqUpdates.questionText = req.body.question;
    if (req.body.explanation) mcqUpdates.explanation = req.body.explanation;
    if (req.body.difficulty) mcqUpdates.difficulty = req.body.difficulty;
    if (req.body.tags) mcqUpdates.flags = req.body.tags;

    if (Object.keys(mcqUpdates).length > 0) {
      mcqUpdates.updatedAt = new Date();
      await db.update(mcqRecords).set(mcqUpdates).where(eq(mcqRecords.id, item.mcqRecordId));
    }

    await db.insert(reviewActions).values({
      reviewItemId: item.id,
      actionType: 'edit',
      performedBy: req.userId,
      changes: req.body,
      reviewerNotes: req.body.reviewerNotes ?? null,
    });

    res.json({ data: { message: 'Edit applied' } });
  } catch (err) {
    next(err);
  }
}

export async function navigation(req: Request, res: Response, next: NextFunction) {
  try {
    // Get all pending review items for navigation
    const allItems = await db
      .select({ id: reviewItems.id })
      .from(reviewItems)
      .where(and(
        eq(reviewItems.workspaceId, req.workspaceId),
        sql`${reviewItems.status} IN ('pending', 'in_review')`,
      ))
      .orderBy(desc(reviewItems.createdAt));

    const currentIndex = allItems.findIndex((i) => i.id === (req.params.id as string));

    res.json({
      data: {
        previousId: currentIndex > 0 ? allItems[currentIndex - 1].id : null,
        nextId: currentIndex < allItems.length - 1 ? allItems[currentIndex + 1].id : null,
        hasPrevious: currentIndex > 0,
        hasNext: currentIndex < allItems.length - 1,
        currentIndex: currentIndex + 1,
        totalCount: allItems.length,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function bulk(req: Request, res: Response, next: NextFunction) {
  try {
    const { ids, action, reason } = req.body;
    const statusMap: Record<string, string> = {
      approve: 'approved',
      reject: 'rejected',
      flag: 'flagged',
    };

    const results = await Promise.all(
      ids.map((id: string) =>
        performReviewAction(id, req.workspaceId, req.userId, action, statusMap[action], undefined, reason)
          .catch((err) => ({ id, error: err.message })),
      ),
    );

    res.json({ data: { processed: results.length, results } });
  } catch (err) {
    next(err);
  }
}
