import type { Job as QueueJob } from 'bullmq';
import { eq } from 'drizzle-orm';
import { db, jobs, documents, documentPages, mcqRecords } from '@mcq-platform/db';

interface FailureParams {
  jobId?: string;
  taskType: string;
  error: unknown;
  documentId?: string;
  documentPageId?: string;
  mcqRecordId?: string;
}

async function resolveDocumentId(params: FailureParams): Promise<string | null> {
  if (params.documentId) return params.documentId;

  if (params.documentPageId) {
    const [page] = await db
      .select({ documentId: documentPages.documentId })
      .from(documentPages)
      .where(eq(documentPages.id, params.documentPageId))
      .limit(1);
    return page?.documentId ?? null;
  }

  if (params.mcqRecordId) {
    const [record] = await db
      .select({ documentId: mcqRecords.documentId })
      .from(mcqRecords)
      .where(eq(mcqRecords.id, params.mcqRecordId))
      .limit(1);
    return record?.documentId ?? null;
  }

  return null;
}

export async function markProcessingFailure(params: FailureParams): Promise<void> {
  const message = params.error instanceof Error ? params.error.message : String(params.error);
  const documentId = await resolveDocumentId(params);

  if (documentId) {
    await db.update(documents)
      .set({ status: 'failed' })
      .where(eq(documents.id, documentId));
  }

  if (params.jobId) {
    await db.update(jobs)
      .set({
        status: 'failed',
        completedAt: new Date(),
        errorSummary: {
          taskType: params.taskType,
          message,
          ...(documentId ? { documentId } : {}),
        },
      })
      .where(eq(jobs.id, params.jobId));
  }
}

export function shouldPersistFailure(job: QueueJob<unknown>): boolean {
  const attempts = typeof job.opts.attempts === 'number' ? job.opts.attempts : 1;
  return job.attemptsMade + 1 >= attempts;
}
