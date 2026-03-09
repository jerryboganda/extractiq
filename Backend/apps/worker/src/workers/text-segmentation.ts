import type { Job } from 'bullmq';
import type { TextSegmentationPayload, McqExtractionPayload } from '@mcq-platform/queue';
import { enqueue, QUEUE_NAMES } from '@mcq-platform/queue';
import { db, ocrArtifacts, segments, providerConfigs, documentPages } from '@mcq-platform/db';
import { createLogger } from '@mcq-platform/logger';
import { eq, and } from 'drizzle-orm';

const logger = createLogger('worker:text-segmentation');

/**
 * Text Segmentation Worker
 *
 * Takes OCR output and splits it into question-level segments.
 * Uses regex patterns to detect question boundaries such as:
 * "1.", "Q1.", "Question 1", "(1)", numbered lists, etc.
 */
export async function processTextSegmentation(job: Job<TextSegmentationPayload>) {
  const { jobId, documentPageId, workspaceId, ocrArtifactId } = job.data;
  logger.info({ jobId, documentPageId, ocrArtifactId }, 'Starting text segmentation');

  // Fetch OCR artifact
  const [artifact] = await db
    .select()
    .from(ocrArtifacts)
    .where(eq(ocrArtifacts.id, ocrArtifactId))
    .limit(1);

  if (!artifact) {
    throw new Error(`OCR artifact ${ocrArtifactId} not found`);
  }

  const text = artifact.markdownText ?? artifact.rawText ?? '';
  if (text.trim().length === 0) {
    logger.warn({ ocrArtifactId }, 'Empty OCR text, skipping segmentation');
    return;
  }

  // Get the page's document ID for segment records
  const [page] = await db
    .select({ documentId: documentPages.documentId })
    .from(documentPages)
    .where(eq(documentPages.id, documentPageId))
    .limit(1);

  if (!page) {
    throw new Error(`Document page ${documentPageId} not found`);
  }

  // Segment the text into question blocks
  const questionSegments = segmentText(text);

  if (questionSegments.length === 0) {
    // Treat the entire text as one segment
    questionSegments.push({
      rawText: text,
      segmentType: 'question_block',
      questionNumber: null,
      startOffset: 0,
      endOffset: text.length,
    });
  }

  // Insert segments into DB
  const insertedSegments = await db
    .insert(segments)
    .values(
      questionSegments.map((seg) => ({
        documentId: page.documentId,
        documentPageId,
        rawText: seg.rawText,
        segmentType: seg.segmentType,
        questionNumberDetected: seg.questionNumber,
        startOffset: seg.startOffset,
        endOffset: seg.endOffset,
      })),
    )
    .returning({ id: segments.id });

  // Find an LLM provider for MCQ extraction
  const [llmProvider] = await db
    .select()
    .from(providerConfigs)
    .where(and(
      eq(providerConfigs.workspaceId, workspaceId),
      eq(providerConfigs.category, 'llm'),
      eq(providerConfigs.isEnabled, true),
    ))
    .limit(1);

  if (llmProvider) {
    // Enqueue MCQ extraction with segment IDs
    await enqueue<McqExtractionPayload>(QUEUE_NAMES.MCQ_EXTRACTION, {
      jobId,
      documentPageId,
      workspaceId,
      providerConfigId: llmProvider.id,
      segmentIds: insertedSegments.map((s) => s.id),
    });
  }

  logger.info(
    { jobId, documentPageId, segmentCount: insertedSegments.length },
    'Text segmentation complete',
  );
}

// ──────────────────────────────────────────────
// Segmentation Logic
// ──────────────────────────────────────────────

interface Segment {
  rawText: string;
  segmentType: string;
  questionNumber: string | null;
  startOffset: number;
  endOffset: number;
}

/**
 * Split OCR text into question-level segments using common patterns.
 */
function segmentText(text: string): Segment[] {
  // Common question boundary patterns
  const patterns = [
    /^(\d{1,3})\s*[.)]\s/gm,                            // "1." "1)" "1 ."
    /^Q(?:uestion)?\s*(\d{1,3})\s*[.:)]\s/gim,          // "Q1:" "Question 1."
    /^\((\d{1,3})\)\s/gm,                                // "(1)"
    /^(?:#{1,3})\s*(?:Q(?:uestion)?\s*)?(\d{1,3})/gim,  // "## Q1" markdown headers
  ];

  // Collect all match positions
  const boundaries: Array<{ index: number; questionNumber: string }> = [];

  for (const pattern of patterns) {
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(text)) !== null) {
      boundaries.push({
        index: match.index,
        questionNumber: match[1],
      });
    }
  }

  if (boundaries.length === 0) {
    return [];
  }

  // Sort by position and de-duplicate (keep earliest for each position)
  boundaries.sort((a, b) => a.index - b.index);
  const unique = boundaries.filter(
    (b, i) => i === 0 || b.index !== boundaries[i - 1].index,
  );

  // Build segments between boundaries
  const result: Segment[] = [];

  for (let i = 0; i < unique.length; i++) {
    const start = unique[i].index;
    const end = i < unique.length - 1 ? unique[i + 1].index : text.length;
    const segmentText = text.slice(start, end).trim();

    if (segmentText.length > 0) {
      result.push({
        rawText: segmentText,
        segmentType: 'question_block',
        questionNumber: unique[i].questionNumber,
        startOffset: start,
        endOffset: end,
      });
    }
  }

  return result;
}
