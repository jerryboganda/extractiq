import type { Request, Response, NextFunction } from 'express';
import { eq, and, ilike, sql } from 'drizzle-orm';
import { db, documents, projects, mcqRecords, jobs } from '@mcq-platform/db';

export async function search(req: Request, res: Response, next: NextFunction) {
  try {
    const { q } = req.query as { q: string };
    const wid = req.workspaceId;
    const searchPattern = `%${q}%`;

    // Search across multiple entity types in parallel
    const [docResults, projectResults, mcqResults, jobResults] = await Promise.all([
      db
        .select({ id: documents.id, name: documents.filename, status: documents.status })
        .from(documents)
        .where(and(eq(documents.workspaceId, wid), ilike(documents.filename, searchPattern)))
        .limit(5),
      db
        .select({ id: projects.id, name: projects.name, status: projects.status })
        .from(projects)
        .where(and(eq(projects.workspaceId, wid), ilike(projects.name, searchPattern)))
        .limit(5),
      db
        .select({ id: mcqRecords.id, name: mcqRecords.questionText, status: mcqRecords.reviewStatus })
        .from(mcqRecords)
        .where(and(eq(mcqRecords.workspaceId, wid), ilike(mcqRecords.questionText, searchPattern)))
        .limit(5),
      db
        .select({ id: jobs.id, status: jobs.status })
        .from(jobs)
        .where(and(eq(jobs.workspaceId, wid), sql`${jobs.id}::text ILIKE ${searchPattern}`))
        .limit(5),
    ]);

    const results = [
      ...docResults.map((d) => ({
        id: d.id, type: 'document' as const, name: d.name,
        status: d.status, metadata: '', url: '/documents',
      })),
      ...projectResults.map((p) => ({
        id: p.id, type: 'project' as const, name: p.name,
        status: p.status, metadata: '', url: '/projects',
      })),
      ...mcqResults.map((m) => ({
        id: m.id, type: 'mcq' as const, name: m.name.slice(0, 100),
        status: m.status, metadata: '', url: '/mcq-records',
      })),
      ...jobResults.map((j) => ({
        id: j.id, type: 'job' as const, name: `Job ${j.id.slice(0, 8)}`,
        status: j.status, metadata: '', url: '/jobs',
      })),
    ];

    res.json({ data: results });
  } catch (err) {
    next(err);
  }
}
