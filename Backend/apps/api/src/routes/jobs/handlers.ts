import type { Request, Response, NextFunction } from 'express';
import { eq, and, count, desc } from 'drizzle-orm';
import { db, jobs, jobDocuments, documents, jobTasks } from '@mcq-platform/db';
import { enqueue, QUEUE_NAMES, type DocumentPreprocessingPayload } from '@mcq-platform/queue';
import { AppError } from '../../middleware/error-handler.js';

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const { page, limit } = req.query as unknown as { page: number; limit: number };
    const offset = (page - 1) * limit;

    const items = await db
      .select()
      .from(jobs)
      .where(eq(jobs.workspaceId, req.workspaceId))
      .orderBy(desc(jobs.createdAt))
      .limit(limit)
      .offset(offset);

    const [{ total }] = await db
      .select({ total: count() })
      .from(jobs)
      .where(eq(jobs.workspaceId, req.workspaceId));

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

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const { documentIds, projectId, extractionProfile } = req.body;

    // Create job
    const [job] = await db
      .insert(jobs)
      .values({
        workspaceId: req.workspaceId,
        projectId,
        status: 'pending',
        totalDocuments: documentIds.length,
        extractionProfile: extractionProfile ?? null,
      })
      .returning();

    // Link documents to job
    await db.insert(jobDocuments).values(
      documentIds.map((docId: string) => ({
        jobId: job.id,
        documentId: docId,
      })),
    );

    // Enqueue preprocessing for each document
    const docRecords = await db
      .select({ id: documents.id, s3Key: documents.s3Key })
      .from(documents)
      .where(and(eq(documents.workspaceId, req.workspaceId)));

    const docMap = new Map(docRecords.map((d) => [d.id, d]));

    for (const docId of documentIds) {
      const doc = docMap.get(docId);
      if (doc) {
        await enqueue<DocumentPreprocessingPayload>(QUEUE_NAMES.DOCUMENT_PREPROCESSING, {
          jobId: job.id,
          documentId: docId,
          workspaceId: req.workspaceId,
          s3Key: doc.s3Key,
        });
      }
    }

    // Update job status to queued
    await db.update(jobs).set({ status: 'queued' }).where(eq(jobs.id, job.id));

    res.status(201).json({ data: { ...job, status: 'queued' } });
  } catch (err) {
    next(err);
  }
}

export async function getById(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;
    const [job] = await db
      .select()
      .from(jobs)
      .where(and(eq(jobs.id, id), eq(jobs.workspaceId, req.workspaceId)))
      .limit(1);

    if (!job) throw new AppError(404, 'NOT_FOUND', 'Job not found');

    // Get tasks
    const tasks = await db
      .select()
      .from(jobTasks)
      .where(eq(jobTasks.jobId, job.id));

    res.json({ data: { ...job, tasks } });
  } catch (err) {
    next(err);
  }
}

export async function cancel(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;
    const [job] = await db
      .update(jobs)
      .set({ status: 'cancelling' })
      .where(and(
        eq(jobs.id, id),
        eq(jobs.workspaceId, req.workspaceId),
      ))
      .returning();

    if (!job) throw new AppError(404, 'NOT_FOUND', 'Job not found');

    res.json({ data: job });
  } catch (err) {
    next(err);
  }
}

export async function retry(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;
    const [existing] = await db
      .select()
      .from(jobs)
      .where(and(eq(jobs.id, id), eq(jobs.workspaceId, req.workspaceId)))
      .limit(1);

    if (!existing) throw new AppError(404, 'NOT_FOUND', 'Job not found');

    // Reset job
    const [job] = await db
      .update(jobs)
      .set({
        status: 'pending',
        completedTasks: 0,
        failedTasks: 0,
        progressPercent: 0,
        errorSummary: null,
        completedAt: null,
      })
      .where(eq(jobs.id, existing.id))
      .returning();

    res.json({ data: job });
  } catch (err) {
    next(err);
  }
}
