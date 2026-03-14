import type { Request, Response, NextFunction } from 'express';
import { eq, and, count, desc } from 'drizzle-orm';
import { db, jobs, jobDocuments, documents, jobTasks, projects } from '@mcq-platform/db';
import { enqueue, QUEUE_NAMES, type DocumentPreprocessingPayload } from '@mcq-platform/queue';
import { AppError } from '../../middleware/error-handler.js';

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const { page, limit } = req.query as unknown as { page: number; limit: number };
    const offset = (page - 1) * limit;

    const items = await db
      .select({
        id: jobs.id,
        projectId: jobs.projectId,
        status: jobs.status,
        progressPercent: jobs.progressPercent,
        startedAt: jobs.startedAt,
        completedAt: jobs.completedAt,
        createdAt: jobs.createdAt,
        totalTasks: jobs.totalTasks,
        completedTasks: jobs.completedTasks,
        failedTasks: jobs.failedTasks,
      })
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
        items: await Promise.all(items.map(async (item) => {
          const [jobDoc] = await db
            .select({
              filename: documents.filename,
            })
            .from(jobDocuments)
            .innerJoin(documents, eq(documents.id, jobDocuments.documentId))
            .where(eq(jobDocuments.jobId, item.id))
            .limit(1);

          const [latestTask] = await db
            .select({
              taskType: jobTasks.taskType,
              providerConfigId: jobTasks.providerConfigId,
            })
            .from(jobTasks)
            .where(eq(jobTasks.jobId, item.id))
            .orderBy(desc(jobTasks.createdAt))
            .limit(1);

          const stageOrder = ['queued', 'preprocessing', 'ocr', 'vlm_extraction', 'segmentation', 'validation', 'review'];
          const stageIndex = Math.max(0, stageOrder.findIndex((stage) => latestTask?.taskType?.includes(stage)));

          return {
            ...item,
            documentName: jobDoc?.filename ?? `Job ${item.id.slice(0, 8)}`,
            provider: latestTask?.providerConfigId ? 'configured provider' : 'system',
            duration: item.completedAt && item.startedAt
              ? `${Math.max(1, Math.round((item.completedAt.getTime() - item.startedAt.getTime()) / 1000))}s`
              : item.startedAt
                ? `${Math.max(1, Math.round((Date.now() - item.startedAt.getTime()) / 1000))}s`
                : 'Queued',
            progress: Math.round(item.progressPercent),
            currentStage: stageIndex + 1,
          };
        })),
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

    const [project] = await db
      .select({ id: projects.id })
      .from(projects)
      .where(and(eq(projects.id, projectId), eq(projects.workspaceId, req.workspaceId)))
      .limit(1);

    if (!project) {
      throw new AppError(404, 'PROJECT_NOT_FOUND', 'Project not found');
    }

    const docRecords = await db
      .select({ id: documents.id, s3Key: documents.s3Key, status: documents.status })
      .from(documents)
      .where(eq(documents.workspaceId, req.workspaceId));

    const requestedDocs = docRecords.filter((doc) => documentIds.includes(doc.id));
    if (requestedDocs.length !== documentIds.length) {
      throw new AppError(400, 'DOCUMENT_NOT_FOUND', 'One or more selected documents could not be found');
    }

    const nonReadyDocs = requestedDocs.filter((doc) => !['uploaded', 'failed'].includes(doc.status));
    if (nonReadyDocs.length > 0) {
      throw new AppError(409, 'DOCUMENT_NOT_READY', 'Selected documents are already being processed');
    }

    const [job] = await db
      .insert(jobs)
      .values({
        workspaceId: req.workspaceId,
        projectId,
        status: 'queued',
        totalDocuments: documentIds.length,
        totalTasks: documentIds.length,
        startedAt: new Date(),
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
    const docMap = new Map(requestedDocs.map((d) => [d.id, d]));

    for (const docId of documentIds) {
      const doc = docMap.get(docId);
      if (doc) {
        await db.insert(jobTasks).values({
          jobId: job.id,
          documentId: docId,
          taskType: 'preprocessing',
          status: 'queued',
          inputData: { s3Key: doc.s3Key },
        });

        await db.update(documents)
          .set({ status: 'preprocessing' })
          .where(eq(documents.id, docId));

        await enqueue<DocumentPreprocessingPayload>(QUEUE_NAMES.DOCUMENT_PREPROCESSING, {
          jobId: job.id,
          documentId: docId,
          workspaceId: req.workspaceId,
          s3Key: doc.s3Key,
        });
      }
    }

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
      .set({ status: 'cancelled', completedAt: new Date(), errorSummary: { reason: 'Cancelled by user' } })
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

    const linkedDocs = await db
      .select({
        documentId: jobDocuments.documentId,
        s3Key: documents.s3Key,
      })
      .from(jobDocuments)
      .innerJoin(documents, eq(documents.id, jobDocuments.documentId))
      .where(eq(jobDocuments.jobId, existing.id));

    const [job] = await db
      .update(jobs)
      .set({
        status: 'queued',
        completedTasks: 0,
        failedTasks: 0,
        progressPercent: 0,
        errorSummary: null,
        completedAt: null,
        startedAt: new Date(),
      })
      .where(eq(jobs.id, existing.id))
      .returning();

    await db.delete(jobTasks).where(eq(jobTasks.jobId, existing.id));

    for (const doc of linkedDocs) {
      await db.insert(jobTasks).values({
        jobId: existing.id,
        documentId: doc.documentId,
        taskType: 'preprocessing',
        status: 'queued',
        inputData: { s3Key: doc.s3Key },
      });

      await db.update(documents)
        .set({ status: 'preprocessing' })
        .where(eq(documents.id, doc.documentId));

      await enqueue<DocumentPreprocessingPayload>(QUEUE_NAMES.DOCUMENT_PREPROCESSING, {
        jobId: existing.id,
        documentId: doc.documentId,
        workspaceId: req.workspaceId,
        s3Key: doc.s3Key,
      });
    }

    res.json({ data: job });
  } catch (err) {
    next(err);
  }
}
