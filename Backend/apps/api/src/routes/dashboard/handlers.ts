import type { Request, Response, NextFunction } from 'express';
import { eq, and, count, sql, avg, gte, desc } from 'drizzle-orm';
import { db, documents, mcqRecords, jobs, providerConfigs, providerBenchmarks, auditLogs } from '@mcq-platform/db';

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
        sql`${jobs.status} IN ('pending', 'queued', 'processing', 'extracting')`,
      ));

    const approvalRate = mcqCount.count > 0
      ? Math.round((approvedCount.count / mcqCount.count) * 100)
      : 0;

    res.json({
      data: {
        documentsProcessed: docCount.count,
        mcqsExtracted: mcqCount.count,
        approvalRate,
        activeJobs: activeJobCount.count,
        // Trends would be computed from time-series comparison — returning 0 for now
        documentsProcessedTrend: 0,
        mcqsExtractedTrend: 0,
        approvalRateTrend: 0,
        activeJobsTrend: 0,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function getSparklines(req: Request, res: Response, next: NextFunction) {
  try {
    // Generate 7-day sparkline data
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

      sparklines.documentsProcessed.push(docs.count);
      sparklines.mcqsExtracted.push(mcqs.count);
      sparklines.approvalRate.push(0); // Simplified
      sparklines.activeJobs.push(0);
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
        sql`${jobs.status} IN ('pending', 'queued', 'processing', 'extracting')`,
      ))
      .orderBy(desc(jobs.createdAt))
      .limit(10);

    res.json({ data: activeJobs });
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

    res.json({ data: logs });
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
        providerType: providerConfigs.providerType,
        category: providerConfigs.category,
        healthStatus: providerConfigs.healthStatus,
        isEnabled: providerConfigs.isEnabled,
        lastHealthCheck: providerConfigs.lastHealthCheck,
      })
      .from(providerConfigs)
      .where(and(eq(providerConfigs.workspaceId, req.workspaceId), eq(providerConfigs.isEnabled, true)));

    res.json({ data: providers });
  } catch (err) {
    next(err);
  }
}
