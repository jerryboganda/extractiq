import { db, jobs } from '@mcq-platform/db';
import { eq } from 'drizzle-orm';
import { createLogger } from '@mcq-platform/logger';

const logger = createLogger('worker:job-guard');

/**
 * Check if the parent job has been cancelled.
 * Workers should call this at the start of processing.
 * Returns true if the job should be skipped.
 */
export async function isJobCancelled(jobId: string): Promise<boolean> {
  const [job] = await db
    .select({ status: jobs.status })
    .from(jobs)
    .where(eq(jobs.id, jobId))
    .limit(1);

  if (!job || ['cancelled', 'failed', 'completed'].includes(job.status)) {
    logger.info({ jobId, status: job?.status ?? 'missing' }, 'Job is terminal, skipping task');
    return true;
  }
  return false;
}

/**
 * Update the job status to an intermediate processing stage.
 * Only updates if the job is not in a terminal state.
 */
export async function updateJobStage(jobId: string, status: string): Promise<void> {
  const [job] = await db
    .select({ status: jobs.status })
    .from(jobs)
    .where(eq(jobs.id, jobId))
    .limit(1);

  // Don't overwrite terminal or later-stage statuses
  const terminalStatuses = ['completed', 'failed', 'cancelled'];
  if (!job || terminalStatuses.includes(job.status)) return;

  await db.update(jobs).set({
    status,
    ...(job.status === 'queued' || job.status === 'pending' ? { startedAt: new Date() } : {}),
  }).where(eq(jobs.id, jobId));
}
