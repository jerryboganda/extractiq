import type { Request, Response, NextFunction } from 'express';
import { eq, and, count, desc } from 'drizzle-orm';
import { db, documents } from '@mcq-platform/db';
import { getPresignedUploadUrl, buildDocumentKey } from '@mcq-platform/storage';
import { AppError } from '../../middleware/error-handler.js';
import { v4 as uuidv4 } from 'uuid';

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const { page, limit } = req.query as unknown as { page: number; limit: number };
    const offset = (page - 1) * limit;

    const items = await db
      .select()
      .from(documents)
      .where(eq(documents.workspaceId, req.workspaceId))
      .orderBy(desc(documents.createdAt))
      .limit(limit)
      .offset(offset);

    const [{ total }] = await db
      .select({ total: count() })
      .from(documents)
      .where(eq(documents.workspaceId, req.workspaceId));

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

export async function presignUpload(req: Request, res: Response, next: NextFunction) {
  try {
    const { filename, contentType, fileSize, projectId } = req.body;

    // Validate project belongs to workspace
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

    res.status(201).json({
      data: {
        uploadUrl,
        documentId: doc.id,
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
        status: 'preprocessing',
        checksumSha256: checksumSha256 ?? null,
      })
      .where(and(eq(documents.id, uploadId), eq(documents.workspaceId, req.workspaceId)))
      .returning();

    if (!doc) throw new AppError(404, 'NOT_FOUND', 'Document not found');

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
    const [doc] = await db
      .delete(documents)
      .where(and(eq(documents.id, id), eq(documents.workspaceId, req.workspaceId)))
      .returning();

    if (!doc) throw new AppError(404, 'NOT_FOUND', 'Document not found');

    res.json({ data: { message: 'Document deleted' } });
  } catch (err) {
    next(err);
  }
}
