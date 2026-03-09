import type { Request, Response, NextFunction } from 'express';
import { eq, and, count, sql, desc, gte, avg, sum } from 'drizzle-orm';
import { db, mcqRecords, costRecords, jobs, providerConfigs, providerBenchmarks } from '@mcq-platform/db';

function getDateRange(query: any): { start: Date; end: Date } {
  const end = new Date();
  const start = new Date();
  
  switch (query.range) {
    case '7d': start.setDate(end.getDate() - 7); break;
    case '30d': start.setDate(end.getDate() - 30); break;
    case '90d': start.setDate(end.getDate() - 90); break;
    case 'custom':
      if (query.from) start.setTime(new Date(query.from).getTime());
      if (query.to) end.setTime(new Date(query.to).getTime());
      break;
  }
  
  return { start, end };
}

export async function timeSeries(req: Request, res: Response, next: NextFunction) {
  try {
    const { start, end } = getDateRange(req.query);
    const wid = req.workspaceId;

    const data = await db
      .select({
        date: sql<string>`DATE(${mcqRecords.createdAt})`,
        mcqCount: count(),
        confidence: avg(mcqRecords.confidence),
      })
      .from(mcqRecords)
      .where(and(
        eq(mcqRecords.workspaceId, wid),
        gte(mcqRecords.createdAt, start),
        sql`${mcqRecords.createdAt} <= ${end}`,
      ))
      .groupBy(sql`DATE(${mcqRecords.createdAt})`)
      .orderBy(sql`DATE(${mcqRecords.createdAt})`);

    // Add cost data
    const costs = await db
      .select({
        date: sql<string>`DATE(${costRecords.createdAt})`,
        cost: sum(costRecords.costUsd),
      })
      .from(costRecords)
      .where(and(
        eq(costRecords.workspaceId, wid),
        gte(costRecords.createdAt, start),
        sql`${costRecords.createdAt} <= ${end}`,
      ))
      .groupBy(sql`DATE(${costRecords.createdAt})`);

    const costMap = new Map(costs.map((c) => [c.date, Number(c.cost ?? 0)]));

    const series = data.map((d) => ({
      date: d.date,
      mcqCount: Number(d.mcqCount),
      cost: costMap.get(d.date) ?? 0,
      confidence: Math.round(Number(d.confidence ?? 0)),
    }));

    res.json({ data: series });
  } catch (err) {
    next(err);
  }
}

export async function confidenceDistribution(req: Request, res: Response, next: NextFunction) {
  try {
    const wid = req.workspaceId;
    const ranges = [
      { label: '0-20', min: 0, max: 20 },
      { label: '21-40', min: 21, max: 40 },
      { label: '41-60', min: 41, max: 60 },
      { label: '61-80', min: 61, max: 80 },
      { label: '81-100', min: 81, max: 100 },
    ];

    const colors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4'];

    const buckets = await Promise.all(
      ranges.map(async (r, i) => {
        const [result] = await db
          .select({ count: count() })
          .from(mcqRecords)
          .where(and(
            eq(mcqRecords.workspaceId, wid),
            sql`${mcqRecords.confidence} >= ${r.min}`,
            sql`${mcqRecords.confidence} <= ${r.max}`,
          ));

        return { range: r.label, count: result.count, fill: colors[i] };
      }),
    );

    res.json({ data: buckets });
  } catch (err) {
    next(err);
  }
}

export async function providerComparison(req: Request, res: Response, next: NextFunction) {
  try {
    const providers = await db
      .select({
        id: providerConfigs.id,
        displayName: providerConfigs.displayName,
      })
      .from(providerConfigs)
      .where(and(eq(providerConfigs.workspaceId, req.workspaceId), eq(providerConfigs.isEnabled, true)));

    const comparison = await Promise.all(
      providers.map(async (p) => {
        const [benchmark] = await db
          .select()
          .from(providerBenchmarks)
          .where(eq(providerBenchmarks.providerConfigId, p.id))
          .orderBy(desc(providerBenchmarks.measuredAt))
          .limit(1);

        return {
          provider: p.displayName,
          accuracy: benchmark?.accuracy ?? 0,
          speed: benchmark?.avgLatencyMs ? Math.round(100 - (benchmark.avgLatencyMs / 100)) : 0,
          costEfficiency: benchmark?.costPerRecord ? Math.round(100 - (benchmark.costPerRecord * 100)) : 0,
        };
      }),
    );

    res.json({ data: comparison });
  } catch (err) {
    next(err);
  }
}

export async function processingTime(req: Request, res: Response, next: NextFunction) {
  try {
    const { start, end } = getDateRange(req.query);
    const wid = req.workspaceId;

    const data = await db
      .select({
        date: sql<string>`DATE(${jobs.createdAt})`,
        avgDuration: sql<number>`AVG(EXTRACT(EPOCH FROM (${jobs.completedAt} - ${jobs.startedAt})))`,
        p95Duration: sql<number>`PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY EXTRACT(EPOCH FROM (${jobs.completedAt} - ${jobs.startedAt})))`,
      })
      .from(jobs)
      .where(and(
        eq(jobs.workspaceId, wid),
        gte(jobs.createdAt, start),
        sql`${jobs.createdAt} <= ${end}`,
        sql`${jobs.completedAt} IS NOT NULL`,
      ))
      .groupBy(sql`DATE(${jobs.createdAt})`)
      .orderBy(sql`DATE(${jobs.createdAt})`);

    res.json({
      data: data.map((d) => ({
        date: d.date,
        avgDuration: Math.round(Number(d.avgDuration ?? 0)),
        p95Duration: Math.round(Number(d.p95Duration ?? 0)),
      })),
    });
  } catch (err) {
    next(err);
  }
}

export async function costBreakdown(req: Request, res: Response, next: NextFunction) {
  try {
    const { start, end } = getDateRange(req.query);
    const wid = req.workspaceId;

    const data = await db
      .select({
        week: sql<string>`TO_CHAR(DATE_TRUNC('week', ${costRecords.createdAt}), 'YYYY-MM-DD')`,
        operationType: costRecords.operationType,
        totalCost: sum(costRecords.costUsd),
      })
      .from(costRecords)
      .where(and(
        eq(costRecords.workspaceId, wid),
        gte(costRecords.createdAt, start),
        sql`${costRecords.createdAt} <= ${end}`,
      ))
      .groupBy(sql`DATE_TRUNC('week', ${costRecords.createdAt})`, costRecords.operationType)
      .orderBy(sql`DATE_TRUNC('week', ${costRecords.createdAt})`);

    // Pivot data by week
    const weekMap = new Map<string, Record<string, number>>();
    for (const row of data) {
      if (!weekMap.has(row.week)) weekMap.set(row.week, {});
      weekMap.get(row.week)![row.operationType] = Number(row.totalCost ?? 0);
    }

    const result = Array.from(weekMap.entries()).map(([week, ops]) => ({
      week,
      ...ops,
    }));

    res.json({ data: result });
  } catch (err) {
    next(err);
  }
}

export async function summary(req: Request, res: Response, next: NextFunction) {
  try {
    const wid = req.workspaceId;

    const [totalMcqs] = await db.select({ count: count() }).from(mcqRecords).where(eq(mcqRecords.workspaceId, wid));
    const [avgConf] = await db.select({ avg: avg(mcqRecords.confidence) }).from(mcqRecords).where(eq(mcqRecords.workspaceId, wid));
    const [totalCost] = await db.select({ sum: sum(costRecords.costUsd) }).from(costRecords).where(eq(costRecords.workspaceId, wid));

    res.json({
      data: {
        totalMcqRecords: totalMcqs.count,
        averageConfidence: Math.round(Number(avgConf.avg ?? 0)),
        totalCostUsd: Number(totalCost.sum ?? 0),
      },
    });
  } catch (err) {
    next(err);
  }
}
