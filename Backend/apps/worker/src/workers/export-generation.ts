import type { Job } from 'bullmq';
import type { ExportGenerationPayload } from '@mcq-platform/queue';
import {
  db,
  mcqRecords,
  exportJobs,
  exportArtifacts,
} from '@mcq-platform/db';
import { upload, buildExportKey } from '@mcq-platform/storage';
import { createLogger } from '@mcq-platform/logger';
import { eq, and, inArray } from 'drizzle-orm';

const logger = createLogger('worker:export-generation');

/**
 * Export Generation Worker
 *
 * Generates export files in various formats:
 * - JSON (structured MCQ data)
 * - CSV (flat tabular format)
 * - QTI (IMS Question & Test Interoperability)
 * - GIFT (Moodle GIFT format)
 * - Aiken (Aiken format)
 * - PDF (formatted exam document)
 */
export async function processExportGeneration(job: Job<ExportGenerationPayload>) {
  const { exportJobId, workspaceId, projectId, format, scope } = job.data;
  logger.info({ exportJobId, format }, 'Starting export generation');

  // Update export job status
  await db.update(exportJobs).set({
    status: 'processing',
    progressPercent: 10,
  }).where(eq(exportJobs.id, exportJobId));

  // Fetch MCQ records based on scope
  const conditions = [
    eq(mcqRecords.workspaceId, workspaceId),
    eq(mcqRecords.projectId, projectId),
  ];

  // Add scope filters
  if (scope.documentIds && Array.isArray(scope.documentIds)) {
    conditions.push(inArray(mcqRecords.documentId, scope.documentIds as string[]));
  }
  if (scope.reviewStatus && typeof scope.reviewStatus === 'string') {
    conditions.push(eq(mcqRecords.reviewStatus, scope.reviewStatus));
  }

  const records = await db
    .select()
    .from(mcqRecords)
    .where(and(...conditions))
    .orderBy(mcqRecords.sourcePage, mcqRecords.questionNumber);

  await db.update(exportJobs).set({ progressPercent: 30 }).where(eq(exportJobs.id, exportJobId));

  // Generate the file
  let content: string;
  let contentType: string;
  let fileExtension: string;

  switch (format) {
    case 'json':
      content = generateJson(records);
      contentType = 'application/json';
      fileExtension = 'json';
      break;
    case 'csv':
      content = generateCsv(records);
      contentType = 'text/csv';
      fileExtension = 'csv';
      break;
    case 'qti':
      content = generateQti(records);
      contentType = 'application/xml';
      fileExtension = 'xml';
      break;
    case 'gift':
      content = generateGift(records);
      contentType = 'text/plain';
      fileExtension = 'txt';
      break;
    case 'aiken':
      content = generateAiken(records);
      contentType = 'text/plain';
      fileExtension = 'txt';
      break;
    default:
      content = generateJson(records);
      contentType = 'application/json';
      fileExtension = 'json';
  }

  await db.update(exportJobs).set({ progressPercent: 70 }).where(eq(exportJobs.id, exportJobId));

  // Upload to S3
  const filename = `export-${projectId}-${Date.now()}.${fileExtension}`;
  const s3Key = buildExportKey(workspaceId, exportJobId, filename);
  const buffer = Buffer.from(content, 'utf-8');

  await upload({
    key: s3Key,
    body: buffer,
    contentType,
    metadata: { format, projectId, exportJobId },
  });

  // Create export artifact record
  await db.insert(exportArtifacts).values({
    exportJobId,
    s3Key,
    filename,
    fileSize: buffer.length,
    contentType,
  });

  // Mark export job as complete
  await db.update(exportJobs).set({
    status: 'completed',
    totalRecords: records.length,
    fileSize: buffer.length,
    progressPercent: 100,
    completedAt: new Date(),
  }).where(eq(exportJobs.id, exportJobId));

  logger.info(
    { exportJobId, format, recordCount: records.length, fileSize: buffer.length },
    'Export generation complete',
  );
}

// ──────────────────────────────────────────────
// Format Generators
// ──────────────────────────────────────────────

type McqRow = typeof mcqRecords.$inferSelect;

function generateJson(records: McqRow[]): string {
  const output = records.map((r) => ({
    id: r.id,
    questionNumber: r.questionNumber,
    questionText: r.questionText,
    questionType: r.questionType,
    options: r.options,
    correctAnswer: r.correctAnswer,
    explanation: r.explanation,
    subject: r.subject,
    topic: r.topic,
    difficulty: r.difficulty,
    confidence: r.confidence,
    sourcePage: r.sourcePage,
    extractionPathway: r.extractionPathway,
    reviewStatus: r.reviewStatus,
  }));

  return JSON.stringify({ questions: output, exportedAt: new Date().toISOString(), count: output.length }, null, 2);
}

function generateCsv(records: McqRow[]): string {
  const headers = [
    'Question Number',
    'Question Text',
    'Question Type',
    'Option A',
    'Option B',
    'Option C',
    'Option D',
    'Option E',
    'Correct Answer',
    'Explanation',
    'Subject',
    'Topic',
    'Difficulty',
    'Confidence',
    'Source Page',
    'Review Status',
  ];

  const rows = records.map((r) => {
    const options = (r.options ?? []) as Array<{ label: string; text: string }>;
    const getOption = (label: string) => options.find((o) => o.label === label)?.text ?? '';

    return [
      r.questionNumber ?? '',
      escapeCsv(r.questionText),
      r.questionType ?? '',
      escapeCsv(getOption('A')),
      escapeCsv(getOption('B')),
      escapeCsv(getOption('C')),
      escapeCsv(getOption('D')),
      escapeCsv(getOption('E')),
      r.correctAnswer ?? '',
      escapeCsv(r.explanation ?? ''),
      r.subject ?? '',
      r.topic ?? '',
      r.difficulty ?? '',
      (r.confidence ?? 0).toFixed(2),
      String(r.sourcePage),
      r.reviewStatus ?? '',
    ].join(',');
  });

  return [headers.join(','), ...rows].join('\n');
}

function escapeCsv(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function generateQti(records: McqRow[]): string {
  const items = records.map((r, i) => {
    const options = (r.options ?? []) as Array<{ label: string; text: string }>;
    const ident = `item_${r.id}`;
    const correctAnswer = r.correctAnswer ?? 'A';

    const responseDeclarations = `
      <responseDeclaration identifier="RESPONSE" cardinality="single" baseType="identifier">
        <correctResponse>
          <value>${escapeXml(correctAnswer)}</value>
        </correctResponse>
      </responseDeclaration>`;

    const choices = options
      .map(
        (o) =>
          `        <simpleChoice identifier="${escapeXml(o.label)}">${escapeXml(o.text)}</simpleChoice>`,
      )
      .join('\n');

    return `
    <assessmentItem identifier="${ident}" title="Question ${r.questionNumber ?? i + 1}" adaptive="false" timeDependent="false">
      ${responseDeclarations}
      <itemBody>
        <choiceInteraction responseIdentifier="RESPONSE" shuffle="false" maxChoices="1">
          <prompt>${escapeXml(r.questionText)}</prompt>
${choices}
        </choiceInteraction>
      </itemBody>
    </assessmentItem>`;
  });

  return `<?xml version="1.0" encoding="UTF-8"?>
<assessmentTest xmlns="http://www.imsglobal.org/xsd/imsqti_v2p1" identifier="test_export" title="MCQ Export">
  <testPart identifier="part1" navigationMode="linear" submissionMode="individual">
    <assessmentSection identifier="section1" title="Questions" visible="true">
${items.join('\n')}
    </assessmentSection>
  </testPart>
</assessmentTest>`;
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function generateGift(records: McqRow[]): string {
  return records
    .map((r) => {
      const options = (r.options ?? []) as Array<{ label: string; text: string }>;
      const correct = r.correctAnswer ?? '';

      const optionLines = options
        .map((o) => {
          const prefix = o.label === correct ? '=' : '~';
          return `  ${prefix}${o.text}`;
        })
        .join('\n');

      return `::Q${r.questionNumber ?? ''}:: ${r.questionText} {\n${optionLines}\n}`;
    })
    .join('\n\n');
}

function generateAiken(records: McqRow[]): string {
  return records
    .map((r) => {
      const options = (r.options ?? []) as Array<{ label: string; text: string }>;
      const optionLines = options.map((o) => `${o.label}. ${o.text}`).join('\n');
      const answer = r.correctAnswer ?? 'A';

      return `${r.questionText}\n${optionLines}\nANSWER: ${answer}`;
    })
    .join('\n\n');
}
