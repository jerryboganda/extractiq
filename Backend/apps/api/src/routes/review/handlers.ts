import type { Request, Response, NextFunction } from 'express';
import { eq, and, count, desc, sql } from 'drizzle-orm';
import { db, reviewItems, reviewActions, mcqRecords, documents, users, mcqRecordHistory } from '@mcq-platform/db';
import { AppError } from '../../middleware/error-handler.js';

function parsePagination(query: Request['query']) {
  const page = Number.parseInt(String(query.page ?? '1'), 10);
  const limit = Number.parseInt(String(query.limit ?? '20'), 10);

  return {
    page: Number.isFinite(page) && page > 0 ? page : 1,
    limit: Number.isFinite(limit) && limit > 0 && limit <= 100 ? limit : 20,
  };
}

export async function listQueue(req: Request, res: Response, next: NextFunction) {
  try {
    const { page, limit } = parsePagination(req.query);
    const offset = (page - 1) * limit;
    const { status } = req.query as { status?: string };

    const filters = [eq(reviewItems.workspaceId, req.workspaceId)];
    if (status) {
      filters.push(eq(reviewItems.status, status));
    }

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
      .where(and(...filters))
      .orderBy(desc(reviewItems.createdAt))
      .limit(limit)
      .offset(offset);

    const [{ total }] = await db
      .select({ total: count() })
      .from(reviewItems)
      .where(and(...filters));

    // Enrich with MCQ data
    const enriched = await Promise.all(
      items.map(async (item) => {
        const [mcq] = await db
          .select({
            questionText: mcqRecords.questionText,
            confidence: mcqRecords.confidence,
            options: mcqRecords.options,
            documentId: mcqRecords.documentId,
          })
          .from(mcqRecords)
          .where(eq(mcqRecords.id, item.mcqRecordId))
          .limit(1);

        const [document] = mcq?.documentId
          ? await db
            .select({ filename: documents.filename })
            .from(documents)
            .where(eq(documents.id, mcq.documentId))
            .limit(1)
          : [];

        const [reviewer] = item.assignedTo
          ? await db
            .select({ name: users.name })
            .from(users)
            .where(eq(users.id, item.assignedTo))
            .limit(1)
          : [];

        return {
          ...item,
          question: mcq?.questionText ?? '',
          confidence: Math.round((mcq?.confidence ?? 0) * 100),
          document: document?.filename ?? 'Unknown document',
          reviewer: reviewer?.name ?? null,
          flags: Array.isArray(item.flagTypes) ? item.flagTypes.length : 0,
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

    const [document] = await db
      .select({ filename: documents.filename })
      .from(documents)
      .where(eq(documents.id, mcq?.documentId ?? ''))
      .limit(1);

    res.json({
      data: {
        ...item,
        question: mcq?.questionText ?? '',
        options: Array.isArray(mcq?.options) ? (mcq?.options as Array<{ text: string }>).map((option) => option.text) : [],
        correctIndex: Array.isArray(mcq?.options)
          ? (mcq?.options as Array<{ label: string; text: string }>).findIndex((option) => option.label === mcq?.correctAnswer)
          : -1,
        explanation: mcq?.explanation ?? '',
        confidence: Math.round((mcq?.confidence ?? 0) * 100),
        confidenceBreakdown: Object.values((mcq?.confidenceBreakdown ?? {}) as Record<string, number>).map((value) => Math.round(value * 100)),
        status: item.status,
        document: document?.filename ?? 'Unknown document',
        page: mcq?.sourcePage ?? 1,
        sourceExcerpt: mcq?.sourceExcerpt ?? '',
        pageContent: mcq?.sourceExcerpt ?? '',
        difficulty: (mcq?.difficulty as 'easy' | 'medium' | 'hard' | undefined) ?? 'medium',
        tags: Array.isArray(mcq?.flags) ? mcq.flags as string[] : [],
        reviewer: item.assignedTo,
        actions,
      },
    });
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

  return db.transaction(async (tx) => {
    await tx.insert(reviewActions).values({
      reviewItemId: item.id,
      actionType,
      performedBy: userId,
      changes: changes ?? null,
      reviewerNotes: notes ?? null,
    });

    const [updated] = await tx
      .update(reviewItems)
      .set({ status: newStatus, resolvedAt: new Date() })
      .where(eq(reviewItems.id, item.id))
      .returning();

    await tx
      .update(mcqRecords)
      .set({ reviewStatus: newStatus, updatedAt: new Date() })
      .where(eq(mcqRecords.id, item.mcqRecordId));

    return updated;
  });
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
    if (req.body.options) {
      mcqUpdates.options = req.body.options.map((text: string, index: number) => ({
        label: String.fromCharCode(65 + index),
        text,
      }));
    }
    if (typeof req.body.correctIndex === 'number' && Array.isArray(req.body.options)) {
      mcqUpdates.correctAnswer = String.fromCharCode(65 + req.body.correctIndex);
    }

    if (Object.keys(mcqUpdates).length > 0) {
      mcqUpdates.updatedAt = new Date();
      const [currentRecord] = await db.select().from(mcqRecords).where(eq(mcqRecords.id, item.mcqRecordId)).limit(1);
      if (currentRecord) {
        await db.insert(mcqRecordHistory).values({
          mcqRecordId: currentRecord.id,
          version: currentRecord.version,
          previousValues: currentRecord,
          changedBy: req.userId,
          changeType: 'review_edit',
        });
      }
      await db.update(mcqRecords).set({
        ...mcqUpdates,
        reviewStatus: 'edited',
        version: sql`${mcqRecords.version} + 1`,
      }).where(eq(mcqRecords.id, item.mcqRecordId));
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
        ids: allItems.map((item) => item.id),
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
