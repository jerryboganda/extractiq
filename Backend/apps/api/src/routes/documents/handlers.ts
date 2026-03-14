import type { Request, Response, NextFunction } from 'express';
import { eq, and, count, desc } from 'drizzle-orm';
import { db, documents, projects, segments } from '@mcq-platform/db';
import { getPresignedUploadUrl, buildDocumentKey, deleteObject, listObjects } from '@mcq-platform/storage';
import { AppError } from '../../middleware/error-handler.js';
import { writeAuditLog } from '../../lib/audit.js';
import { parsePagination } from '../../lib/pagination.js';
import { v4 as uuidv4 } from 'uuid';

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const { page, limit, offset } = parsePagination(req.query as Record<string, unknown>);
    const { status, projectId } = req.query as { status?: string; projectId?: string };

    const filters = [eq(documents.workspaceId, req.workspaceId)];
    if (status) filters.push(eq(documents.status, status));
    if (projectId) filters.push(eq(documents.projectId, projectId));

    const items = await db
      .select({
        id: documents.id,
        filename: documents.filename,
        status: documents.status,
        pageCount: documents.pageCount,
        fileSize: documents.fileSize,
        mcqCount: documents.mcqCount,
        confidenceAvg: documents.confidenceAvg,
        createdAt: documents.createdAt,
        projectId: documents.projectId,
        projectName: projects.name,
      })
      .from(documents)
      .innerJoin(projects, eq(projects.id, documents.projectId))
      .where(and(...filters))
      .orderBy(desc(documents.createdAt))
      .limit(limit)
      .offset(offset);

    const [{ total }] = await db
      .select({ total: count() })
      .from(documents)
      .where(and(...filters));

    res.json({
      data: {
        items: items.map((item) => ({
          id: item.id,
          filename: item.filename,
          status: item.status,
          pages: item.pageCount ?? 0,
          uploadDate: item.createdAt.toISOString(),
          mcqCount: item.mcqCount,
          confidence: Math.round((item.confidenceAvg ?? 0) * 100),
          size: `${(item.fileSize / (1024 * 1024)).toFixed(1)} MB`,
          project: item.projectName,
          projectId: item.projectId,
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

export async function presignUpload(req: Request, res: Response, next: NextFunction) {
  try {
    const { filename, contentType, fileSize, projectId } = req.body;

    const [project] = await db
      .select({ id: projects.id })
      .from(projects)
      .where(and(eq(projects.id, projectId), eq(projects.workspaceId, req.workspaceId)))
      .limit(1);

    if (!project) {
      throw new AppError(404, 'PROJECT_NOT_FOUND', 'Project not found');
    }

    const documentId = uuidv4();
    const s3Key = buildDocumentKey(req.workspaceId, documentId, filename);

    const uploadUrl = await getPresignedUploadUrl({
      key: s3Key,
      contentType,
      expiresIn: 3600,
    });

    // Create document record in uploaded state
    const [doc] = await db
      .insert(documents)
      .values({
        id: documentId,
        workspaceId: req.workspaceId,
        projectId,
        filename,
        s3Key,
        fileSize,
        mimeType: contentType,
        status: 'uploaded',
        uploadedBy: req.userId,
      })
      .returning();

    writeAuditLog({
      workspaceId: req.workspaceId,
      userId: req.userId,
      resourceType: 'document',
      resourceId: doc.id,
      action: 'document.upload_initiated',
      details: { filename, projectId },
    });

    res.status(201).json({
      data: {
        documentId: doc.id,
        uploadUrl,
        s3Key,
        expiresIn: 3600,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function completeUpload(req: Request, res: Response, next: NextFunction) {
  try {
    const { uploadId, s3Key, checksumSha256 } = req.body;

    const [doc] = await db
      .update(documents)
      .set({
        status: 'uploaded',
        checksumSha256: checksumSha256 ?? null,
      })
      .where(and(eq(documents.id, uploadId), eq(documents.workspaceId, req.workspaceId), eq(documents.s3Key, s3Key)))
      .returning();

    if (!doc) throw new AppError(404, 'NOT_FOUND', 'Document not found');

    writeAuditLog({
      workspaceId: req.workspaceId,
      userId: req.userId,
      resourceType: 'document',
      resourceId: doc.id,
      action: 'document.upload_completed',
      details: { filename: doc.filename },
    });

    res.json({ data: doc });
  } catch (err) {
    next(err);
  }
}

export async function getById(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;
    const [doc] = await db
      .select()
      .from(documents)
      .where(and(eq(documents.id, id), eq(documents.workspaceId, req.workspaceId)))
      .limit(1);

    if (!doc) throw new AppError(404, 'NOT_FOUND', 'Document not found');

    res.json({ data: doc });
  } catch (err) {
    next(err);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;

    // Look up before deleting so we can clean up S3
    const [doc] = await db
      .select({ id: documents.id, s3Key: documents.s3Key, filename: documents.filename })
      .from(documents)
      .where(and(eq(documents.id, id), eq(documents.workspaceId, req.workspaceId)))
      .limit(1);

    if (!doc) throw new AppError(404, 'NOT_FOUND', 'Document not found');

    // Clean up segments that reference this document (no cascade FK)
    await db.delete(segments).where(eq(segments.documentId, doc.id));

    // DB cascade handles: documentPages → pageImages, ocrArtifacts, vlmOutputs
    //                     mcqRecords → reviewItems, reviewActions, mcqRecordHistory, hallucinationEvents
    //                     jobDocuments
    await db.delete(documents).where(eq(documents.id, doc.id));

    // Clean up S3 objects (document file + any page images)
    try {
      await deleteObject(doc.s3Key);
      // Also delete page image folder if it exists
      const prefix = doc.s3Key.replace(/\/[^/]+$/, '/pages/');
      const pageObjects = await listObjects(prefix);
      await Promise.all(pageObjects.map((obj) => deleteObject(obj.key)));
    } catch {
      // S3 cleanup is best-effort — don't fail the API response
    }

    writeAuditLog({
      workspaceId: req.workspaceId,
      userId: req.userId,
      resourceType: 'document',
      resourceId: doc.id,
      action: 'document.deleted',
      details: { filename: doc.filename },
    });

    res.json({ data: { message: 'Document deleted' } });
  } catch (err) {
    next(err);
  }
}
