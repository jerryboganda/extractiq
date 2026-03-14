import type { Job } from 'bullmq';
import type { ReviewRoutingPayload, NotificationPayload } from '@mcq-platform/queue';
import { enqueue, QUEUE_NAMES } from '@mcq-platform/queue';
import { db, mcqRecords, reviewItems, jobs, jobTasks } from '@mcq-platform/db';
import { createLogger } from '@mcq-platform/logger';
import { eq, sql } from 'drizzle-orm';
import { markProcessingFailure, shouldPersistFailure } from '../lib/failure-state.js';

const logger = createLogger('worker:review-routing');

/**
 * Review Routing Worker
 *
 * Determines what happens to each MCQ after validation:
 * - Auto-approve: high confidence, no flags → reviewStatus = 'approved'
 * - Route to review queue: medium confidence or flags → creates ReviewItem
 * - Auto-reject: critical issues → reviewStatus = 'rejected'
 *
 * Also checks if the parent job is complete and updates its status.
 */
export async function processReviewRouting(job: Job<ReviewRoutingPayload>) {
  const { jobId, mcqRecordId, workspaceId } = job.data;
  logger.info({ jobId, mcqRecordId }, 'Starting review routing');

  try {

    const [record] = await db
      .select()
      .from(mcqRecords)
      .where(eq(mcqRecords.id, mcqRecordId))
      .limit(1);

    if (!record) {
      throw new Error(`MCQ record ${mcqRecordId} not found`);
    }

    const confidence = record.confidence ?? 0;
    const flags = (record.flags ?? []) as string[];
    const hallucinationRisk = record.hallucinationRiskTier ?? 'low';

  // Auto-approve threshold (configurable per workspace in the future)
  const autoApproveThreshold = 0.9;

  let reviewStatus: string;
  let severity: string | null = null;

  if (hallucinationRisk === 'high' || flags.includes('identical_options') || flags.includes('missing_question_text')) {
    // Auto-reject
    reviewStatus = 'rejected';
    severity = 'critical';
  } else if (confidence >= autoApproveThreshold && flags.length === 0 && hallucinationRisk === 'low') {
    // Auto-approve
    reviewStatus = 'approved';
  } else {
    // Route to review queue
    reviewStatus = 'pending';
    severity = hallucinationRisk === 'high' ? 'high' :
      confidence < 0.7 ? 'high' :
      confidence < 0.85 ? 'medium' : 'low';
  }

  // Update MCQ record status
  await db.update(mcqRecords).set({
    reviewStatus,
    updatedAt: new Date(),
  }).where(eq(mcqRecords.id, mcqRecordId));

  // Create review item if needs review or rejected
  if (reviewStatus === 'pending' || reviewStatus === 'rejected') {
    await db.insert(reviewItems).values({
      mcqRecordId,
      workspaceId,
      severity: severity ?? 'medium',
      flagTypes: flags,
      reasonSummary: buildReasonSummary(confidence, flags, hallucinationRisk),
      status: 'pending',
    });
  }

  // Update parent job progress
  await updateJobProgress(jobId);

    logger.info(
      { jobId, mcqRecordId, reviewStatus, confidence, flags },
      'Review routing complete',
    );
  } catch (err) {
    if (shouldPersistFailure(job)) {
      await markProcessingFailure({ jobId, mcqRecordId, taskType: 'review_routing', error: err });
    }
    throw err;
  }
}

// ──────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────

function buildReasonSummary(confidence: number, flags: string[], hallucinationRisk: string): string {
  const parts: string[] = [];

  if (confidence < 0.7) parts.push(`Low confidence (${(confidence * 100).toFixed(0)}%)`);
  else if (confidence < 0.85) parts.push(`Medium confidence (${(confidence * 100).toFixed(0)}%)`);

  if (hallucinationRisk !== 'low') parts.push(`Hallucination risk: ${hallucinationRisk}`);

  if (flags.length > 0) parts.push(`Flags: ${flags.join(', ')}`);

  return parts.join('. ') || 'Routed for manual review';
}

/**
 * Check if all MCQs for a job have been processed and update job status.
 */
async function updateJobProgress(jobId: string) {
  // Count completed tasks
  const taskCounts = await db
    .select({
      total: sql<number>`count(*)`,
      completed: sql<number>`count(*) filter (where ${jobTasks.status} = 'completed')`,
      failed: sql<number>`count(*) filter (where ${jobTasks.status} = 'failed')`,
    })
    .from(jobTasks)
    .where(eq(jobTasks.jobId, jobId));

  const { total, completed, failed } = taskCounts[0] ?? { total: 0, completed: 0, failed: 0 };
  const progressPercent = total > 0 ? ((completed + failed) / total) * 100 : 0;

  const isComplete = total > 0 && completed + failed >= total;

  await db.update(jobs).set({
    completedTasks: completed,
    failedTasks: failed,
    progressPercent,
    ...(isComplete && {
      status: failed > 0 ? 'failed' : 'completed',
      completedAt: new Date(),
    }),
  }).where(eq(jobs.id, jobId));

  // Send notification if job is complete
  if (isComplete) {
    const [jobRecord] = await db
      .select()
      .from(jobs)
      .where(eq(jobs.id, jobId))
      .limit(1);

    if (jobRecord) {
      await enqueue<NotificationPayload>(QUEUE_NAMES.NOTIFICATION, {
        workspaceId: jobRecord.workspaceId,
        userId: '', // Will be resolved by notification worker to workspace admins
        type: 'job_completed',
        title: 'Extraction Job Complete',
        message: `Job completed: ${completed} tasks succeeded, ${failed} failed.`,
        data: { jobId, completed, failed, total },
      });
    }
  }
}
