import type { Request, Response, NextFunction } from 'express';
import { eq, and, count, desc } from 'drizzle-orm';
import { db, exportJobs, exportArtifacts, projects } from '@mcq-platform/db';
import { getPresignedDownloadUrl } from '@mcq-platform/storage';
import { enqueue, QUEUE_NAMES, type ExportGenerationPayload } from '@mcq-platform/queue';
import { AppError } from '../../middleware/error-handler.js';
import { writeAuditLog } from '../../lib/audit.js';

function parsePagination(query: Request['query']) {
  const page = Number.parseInt(String(query.page ?? '1'), 10);
  const limit = Number.parseInt(String(query.limit ?? '20'), 10);

  return {
    page: Number.isFinite(page) && page > 0 ? page : 1,
    limit: Number.isFinite(limit) && limit > 0 && limit <= 100 ? limit : 20,
  };
}

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const { page, limit } = parsePagination(req.query);
    const offset = (page - 1) * limit;

    const items = await db
      .select()
      .from(exportJobs)
      .where(eq(exportJobs.workspaceId, req.workspaceId))
      .orderBy(desc(exportJobs.createdAt))
      .limit(limit)
      .offset(offset);

    const [{ total }] = await db
      .select({ total: count() })
      .from(exportJobs)
      .where(eq(exportJobs.workspaceId, req.workspaceId));

    res.json({
      data: { items, total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const { format, projectId, dateFrom, dateTo, minConfidence, status } = req.body;

    const [project] = await db
      .select({ id: projects.id })
      .from(projects)
      .where(and(eq(projects.id, projectId), eq(projects.workspaceId, req.workspaceId)))
      .limit(1);

    if (!project) {
      throw new AppError(404, 'PROJECT_NOT_FOUND', 'Project not found');
    }

    const reviewStatus = status === 'all_clean' ? 'approved' : status;
    const scope = { dateFrom, dateTo, minConfidence, reviewStatus };

    const [exportJob] = await db
      .insert(exportJobs)
      .values({
        workspaceId: req.workspaceId,
        projectId,
        format,
        scope,
        status: 'pending',
        createdBy: req.userId,
      })
      .returning();

    // Enqueue export generation
    await enqueue<ExportGenerationPayload>(QUEUE_NAMES.EXPORT_GENERATION, {
      exportJobId: exportJob.id,
      workspaceId: req.workspaceId,
      projectId,
      format,
      scope,
    });

    writeAuditLog({
      workspaceId: req.workspaceId,
      userId: req.userId,
      resourceType: 'export',
      resourceId: exportJob.id,
      action: 'export.created',
      details: { format, projectId, scope },
    });

    res.status(201).json({ data: exportJob });
  } catch (err) {
    next(err);
  }
}

export async function getById(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;
    const [exportJob] = await db
      .select()
      .from(exportJobs)
      .where(and(eq(exportJobs.id, id), eq(exportJobs.workspaceId, req.workspaceId)))
      .limit(1);

    if (!exportJob) throw new AppError(404, 'NOT_FOUND', 'Export job not found');

    const artifacts = await db
      .select()
      .from(exportArtifacts)
      .where(eq(exportArtifacts.exportJobId, exportJob.id));

    res.json({ data: { ...exportJob, artifacts } });
  } catch (err) {
    next(err);
  }
}

export async function download(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;
    const [exportJob] = await db
      .select()
      .from(exportJobs)
      .where(and(eq(exportJobs.id, id), eq(exportJobs.workspaceId, req.workspaceId)))
      .limit(1);

    if (!exportJob) throw new AppError(404, 'NOT_FOUND', 'Export job not found');
    if (exportJob.status !== 'completed') throw new AppError(400, 'NOT_READY', 'Export is not ready for download');

    const [artifact] = await db
      .select()
      .from(exportArtifacts)
      .where(eq(exportArtifacts.exportJobId, exportJob.id))
      .limit(1);

    if (!artifact) throw new AppError(404, 'NOT_FOUND', 'Export artifact not found');

    const downloadUrl = await getPresignedDownloadUrl({
      key: artifact.s3Key,
      filename: artifact.filename,
      expiresIn: 300,
    });

    res.json({ data: { downloadUrl, filename: artifact.filename, expiresIn: 300 } });
  } catch (err) {
    next(err);
  }
}
