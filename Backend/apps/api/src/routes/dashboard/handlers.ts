import type { Request, Response, NextFunction } from 'express';
import { eq, and, count, sql, gte, desc } from 'drizzle-orm';
import { db, documents, mcqRecords, jobs, providerConfigs, providerBenchmarks, auditLogs, jobDocuments, jobTasks } from '@mcq-platform/db';

function calculateTrend(current: number, previous: number): number {
  if (previous === 0) {
    return current > 0 ? 100 : 0;
  }
  return Math.round(((current - previous) / previous) * 100);
}

function getDateRange(periodDays: number): { currentStart: Date; previousStart: Date; previousEnd: Date } {
  const now = new Date();
  const currentStart = new Date(now);
  currentStart.setDate(currentStart.getDate() - periodDays);
  
  const previousStart = new Date(currentStart);
  previousStart.setDate(previousStart.getDate() - periodDays);
  
  const previousEnd = new Date(currentStart);
  
  return { currentStart, previousStart, previousEnd };
}

export async function getStats(req: Request, res: Response, next: NextFunction) {
  try {
    const wid = req.workspaceId;

    const [docCount] = await db
      .select({ count: count() })
      .from(documents)
      .where(eq(documents.workspaceId, wid));

    const [mcqCount] = await db
      .select({ count: count() })
      .from(mcqRecords)
      .where(eq(mcqRecords.workspaceId, wid));

    const [approvedCount] = await db
      .select({ count: count() })
      .from(mcqRecords)
      .where(and(eq(mcqRecords.workspaceId, wid), eq(mcqRecords.reviewStatus, 'approved')));

    const [activeJobCount] = await db
      .select({ count: count() })
      .from(jobs)
      .where(and(
        eq(jobs.workspaceId, wid),
        sql`${jobs.status} IN ('queued', 'preprocessing', 'ocr_processing', 'vlm_processing', 'extracting', 'validating', 'review_required')`,
      ));

    const approvalRate = mcqCount.count > 0
      ? Math.round((approvedCount.count / mcqCount.count) * 100)
      : 0;

    const { currentStart: docsCurrentStart, previousStart: docsPrevStart, previousEnd: docsPrevEnd } = getDateRange(7);
    const { currentStart: mcqsCurrentStart, previousStart: mcqsPrevStart, previousEnd: mcqsPrevEnd } = getDateRange(7);
    const { currentStart: jobsCurrentStart, previousStart: jobsPrevStart, previousEnd: jobsPrevEnd } = getDateRange(7);

    const [currentDocs] = await db
      .select({ count: count() })
      .from(documents)
      .where(and(
        eq(documents.workspaceId, wid),
        gte(documents.createdAt, docsCurrentStart),
      ));

    const [previousDocs] = await db
      .select({ count: count() })
      .from(documents)
      .where(and(
        eq(documents.workspaceId, wid),
        gte(documents.createdAt, docsPrevStart),
        sql`${documents.createdAt} < ${docsPrevEnd}`,
      ));

    const [currentMcqs] = await db
      .select({ count: count() })
      .from(mcqRecords)
      .where(and(
        eq(mcqRecords.workspaceId, wid),
        gte(mcqRecords.createdAt, mcqsCurrentStart),
      ));

    const [previousMcqs] = await db
      .select({ count: count() })
      .from(mcqRecords)
      .where(and(
        eq(mcqRecords.workspaceId, wid),
        gte(mcqRecords.createdAt, mcqsPrevStart),
        sql`${mcqRecords.createdAt} < ${mcqsPrevEnd}`,
      ));

    const [currentApproved] = await db
      .select({ count: count() })
      .from(mcqRecords)
      .where(and(
        eq(mcqRecords.workspaceId, wid),
        eq(mcqRecords.reviewStatus, 'approved'),
        gte(mcqRecords.updatedAt, mcqsCurrentStart),
      ));

    const [previousApproved] = await db
      .select({ count: count() })
      .from(mcqRecords)
      .where(and(
        eq(mcqRecords.workspaceId, wid),
        eq(mcqRecords.reviewStatus, 'approved'),
        gte(mcqRecords.updatedAt, mcqsPrevStart),
        sql`${mcqRecords.updatedAt} < ${mcqsPrevEnd}`,
      ));

    const currentApprovalRate = currentMcqs.count > 0
      ? Math.round((currentApproved.count / currentMcqs.count) * 100)
      : 0;
    const previousApprovalRate = previousMcqs.count > 0
      ? Math.round((previousApproved.count / previousMcqs.count) * 100)
      : 0;

    const [currentActiveJobs] = await db
      .select({ count: count() })
      .from(jobs)
      .where(and(
        eq(jobs.workspaceId, wid),
        sql`${jobs.status} IN ('queued', 'preprocessing', 'ocr_processing', 'vlm_processing', 'extracting', 'validating', 'review_required')`,
        gte(jobs.createdAt, jobsCurrentStart),
      ));

    const [previousActiveJobs] = await db
      .select({ count: count() })
      .from(jobs)
      .where(and(
        eq(jobs.workspaceId, wid),
        sql`${jobs.status} IN ('queued', 'preprocessing', 'ocr_processing', 'vlm_processing', 'extracting', 'validating', 'review_required')`,
        gte(jobs.createdAt, jobsPrevStart),
        sql`${jobs.createdAt} < ${jobsPrevEnd}`,
      ));

    const documentsProcessedTrend = calculateTrend(currentDocs.count, previousDocs.count);
    const mcqsExtractedTrend = calculateTrend(currentMcqs.count, previousMcqs.count);
    const approvalRateTrend = currentApprovalRate - previousApprovalRate;
    const activeJobsTrend = calculateTrend(currentActiveJobs.count, previousActiveJobs.count);

    res.json({
      data: {
        documentsProcessed: docCount.count,
        mcqsExtracted: mcqCount.count,
        approvalRate,
        activeJobs: activeJobCount.count,
        documentsProcessedTrend,
        mcqsExtractedTrend,
        approvalRateTrend,
        activeJobsTrend,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function getSparklines(req: Request, res: Response, next: NextFunction) {
  try {
    const wid = req.workspaceId;
    const days = 7;
    const sparklines = {
      documentsProcessed: [] as number[],
      mcqsExtracted: [] as number[],
      approvalRate: [] as number[],
      activeJobs: [] as number[],
    };

    for (let i = days - 1; i >= 0; i--) {
      const dayStart = new Date();
      dayStart.setDate(dayStart.getDate() - i);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);

      const [docs] = await db
        .select({ count: count() })
        .from(documents)
        .where(and(
          eq(documents.workspaceId, wid),
          gte(documents.createdAt, dayStart),
          sql`${documents.createdAt} < ${dayEnd}`,
        ));

      const [mcqs] = await db
        .select({ count: count() })
        .from(mcqRecords)
        .where(and(
          eq(mcqRecords.workspaceId, wid),
          gte(mcqRecords.createdAt, dayStart),
          sql`${mcqRecords.createdAt} < ${dayEnd}`,
        ));

      const [approved] = await db
        .select({ count: count() })
        .from(mcqRecords)
        .where(and(
          eq(mcqRecords.workspaceId, wid),
          eq(mcqRecords.reviewStatus, 'approved'),
          gte(mcqRecords.updatedAt, dayStart),
          sql`${mcqRecords.updatedAt} < ${dayEnd}`,
        ));

      const [activeJobs] = await db
        .select({ count: count() })
        .from(jobs)
        .where(and(
          eq(jobs.workspaceId, wid),
          sql`${jobs.status} IN ('queued', 'preprocessing', 'ocr_processing', 'vlm_processing', 'extracting', 'validating', 'review_required')`,
          gte(jobs.createdAt, dayStart),
          sql`${jobs.createdAt} < ${dayEnd}`,
        ));

      sparklines.documentsProcessed.push(docs.count);
      sparklines.mcqsExtracted.push(mcqs.count);
      sparklines.approvalRate.push(
        mcqs.count > 0 ? Math.round((approved.count / mcqs.count) * 100) : 0
      );
      sparklines.activeJobs.push(activeJobs.count);
    }

    res.json({ data: sparklines });
  } catch (err) {
    next(err);
  }
}

export async function getActiveJobs(req: Request, res: Response, next: NextFunction) {
  try {
    const activeJobs = await db
      .select({
        id: jobs.id,
        status: jobs.status,
        progressPercent: jobs.progressPercent,
        startedAt: jobs.startedAt,
        createdAt: jobs.createdAt,
      })
      .from(jobs)
      .where(and(
        eq(jobs.workspaceId, req.workspaceId),
        sql`${jobs.status} IN ('queued', 'preprocessing', 'ocr_processing', 'vlm_processing', 'extracting', 'validating', 'review_required')`,
      ))
      .orderBy(desc(jobs.createdAt))
      .limit(10);

    res.json({
      data: await Promise.all(activeJobs.map(async (job) => {
        const [linkedDocument] = await db
          .select({ filename: documents.filename })
          .from(jobDocuments)
          .innerJoin(documents, eq(documents.id, jobDocuments.documentId))
          .where(eq(jobDocuments.jobId, job.id))
          .limit(1);

        const [latestTask] = await db
          .select({ taskType: jobTasks.taskType })
          .from(jobTasks)
          .where(eq(jobTasks.jobId, job.id))
          .orderBy(desc(jobTasks.createdAt))
          .limit(1);

        return {
          id: job.id,
          document: linkedDocument?.filename ?? `Job ${job.id.slice(0, 8)}`,
          status: job.status,
          progress: Math.round(job.progressPercent),
          provider: latestTask?.taskType?.includes('vlm') ? 'vlm pipeline' : 'ocr pipeline',
          stage: latestTask?.taskType ?? job.status,
          startedAt: job.startedAt?.toISOString() ?? job.createdAt.toISOString(),
        };
      })),
    });
  } catch (err) {
    next(err);
  }
}

export async function getRecentActivity(req: Request, res: Response, next: NextFunction) {
  try {
    const logs = await db
      .select({
        id: auditLogs.id,
        action: auditLogs.action,
        resourceType: auditLogs.resourceType,
        resourceId: auditLogs.resourceId,
        userId: auditLogs.userId,
        details: auditLogs.details,
        createdAt: auditLogs.createdAt,
      })
      .from(auditLogs)
      .where(eq(auditLogs.workspaceId, req.workspaceId))
      .orderBy(desc(auditLogs.createdAt))
      .limit(20);

    res.json({
      data: logs.map((log) => ({
        id: log.id,
        action: log.action,
        target: `${log.resourceType}${log.resourceId ? ` ${log.resourceId}` : ''}`,
        user: log.userId ?? 'system',
        time: log.createdAt.toISOString(),
        type: log.action.includes('document') ? 'upload'
          : log.action.includes('approve') ? 'approve'
          : log.action.includes('export') ? 'export'
          : log.action.includes('provider') ? 'settings'
          : 'extract',
      })),
    });
  } catch (err) {
    next(err);
  }
}

export async function getProviderHealth(req: Request, res: Response, next: NextFunction) {
  try {
    const providers = await db
      .select({
        id: providerConfigs.id,
        displayName: providerConfigs.displayName,
        healthStatus: providerConfigs.healthStatus,
        lastHealthCheck: providerConfigs.lastHealthCheck,
      })
      .from(providerConfigs)
      .where(and(eq(providerConfigs.workspaceId, req.workspaceId), eq(providerConfigs.isEnabled, true)));

    res.json({
      data: await Promise.all(providers.map(async (provider) => {
        const [benchmark] = await db
          .select({
            accuracy: providerBenchmarks.accuracy,
            avgLatencyMs: providerBenchmarks.avgLatencyMs,
          })
          .from(providerBenchmarks)
          .where(eq(providerBenchmarks.providerConfigId, provider.id))
          .orderBy(desc(providerBenchmarks.measuredAt))
          .limit(1);

        return {
          name: provider.displayName,
          status: provider.healthStatus === 'offline' ? 'offline' : provider.healthStatus,
          accuracy: Math.round((benchmark?.accuracy ?? 0) * 100),
          latency: benchmark?.avgLatencyMs ? `${Math.round(benchmark.avgLatencyMs)}ms` : 'n/a',
          lastHealthCheck: provider.lastHealthCheck?.toISOString() ?? null,
        };
      })),
    });
  } catch (err) {
    next(err);
  }
}
