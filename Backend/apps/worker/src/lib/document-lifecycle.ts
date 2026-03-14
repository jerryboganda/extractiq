import { and, avg, count, eq, sql } from 'drizzle-orm';
import { db, documentPages, documents, jobTasks, mcqRecords } from '@mcq-platform/db';

export async function finalizeDocumentIfReady(documentId: string): Promise<void> {
  const [pageTotals] = await db
    .select({ count: count() })
    .from(documentPages)
    .where(eq(documentPages.documentId, documentId));

  const [completedExtractionTotals] = await db
    .select({ count: sql<number>`count(distinct ${jobTasks.documentPageId})` })
    .from(jobTasks)
    .where(and(
      eq(jobTasks.taskType, 'mcq_extraction'),
      eq(jobTasks.status, 'completed'),
      sql`${jobTasks.documentPageId} IN (select ${documentPages.id} from ${documentPages} where ${documentPages.documentId} = ${documentId})`,
    ));

  const totalPages = Number(pageTotals?.count ?? 0);
  const completedPages = Number(completedExtractionTotals?.count ?? 0);

  if (totalPages === 0 || completedPages < totalPages) {
    return;
  }

  const [mcqStats] = await db
    .select({
      count: count(),
      confidenceAvg: avg(mcqRecords.confidence),
    })
    .from(mcqRecords)
    .where(eq(mcqRecords.documentId, documentId));

  await db.update(documents)
    .set({
      status: 'completed',
      mcqCount: Number(mcqStats?.count ?? 0),
      confidenceAvg: mcqStats?.confidenceAvg === null || mcqStats?.confidenceAvg === undefined
        ? null
        : Number(mcqStats.confidenceAvg),
    })
    .where(eq(documents.id, documentId));
}
