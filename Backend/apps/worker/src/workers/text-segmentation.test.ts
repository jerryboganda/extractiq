import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@mcq-platform/db', () => ({
  db: { select: vi.fn(), insert: vi.fn() },
  ocrArtifacts: 'ocr_artifacts_table',
  segments: 'segments_table',
  providerConfigs: 'provider_configs_table',
  documentPages: 'document_pages_table',
}));

vi.mock('@mcq-platform/queue', () => ({
  enqueue: vi.fn(),
  QUEUE_NAMES: { MCQ_EXTRACTION: 'mcq-extraction' },
}));

vi.mock('@mcq-platform/logger', () => ({
  createLogger: () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }),
}));

import { processTextSegmentation } from './text-segmentation.js';
import { db } from '@mcq-platform/db';
import { enqueue } from '@mcq-platform/queue';

const mockedDb = vi.mocked(db);
const mockedEnqueue = vi.mocked(enqueue);

function mockChain(result: unknown) {
  const chain: Record<string, unknown> = {};
  chain.from = vi.fn().mockReturnValue(chain);
  chain.where = vi.fn().mockReturnValue(chain);
  chain.orderBy = vi.fn().mockReturnValue(chain);
  chain.limit = vi.fn().mockReturnValue(chain);
  chain.values = vi.fn().mockReturnValue(chain);
  chain.returning = vi.fn().mockReturnValue(chain);
  chain.set = vi.fn().mockReturnValue(chain);
  chain.then = vi.fn().mockImplementation((resolve: any) => resolve(result));
  return chain;
}

function createJob(data: any) {
  return { data, id: 'job-id-1', name: 'text-segmentation' } as any;
}

describe('text-segmentation worker', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('throws if OCR artifact not found', async () => {
    mockedDb.select.mockReturnValue(mockChain([]) as any);

    await expect(processTextSegmentation(createJob({
      jobId: 'j1', documentPageId: 'dp1', workspaceId: 'ws-1', ocrArtifactId: 'gone',
    }))).rejects.toThrow('OCR artifact gone not found');
  });

  it('skips segmentation on empty text', async () => {
    const artifact = { id: 'ocr-1', markdownText: '', rawText: '' };
    mockedDb.select.mockReturnValue(mockChain([artifact]) as any);

    await processTextSegmentation(createJob({
      jobId: 'j1', documentPageId: 'dp1', workspaceId: 'ws-1', ocrArtifactId: 'ocr-1',
    }));

    // No inserts or enqueue when text is empty
    expect(mockedDb.insert).not.toHaveBeenCalled();
    expect(mockedEnqueue).not.toHaveBeenCalled();
  });

  it('segments numbered questions and enqueues MCQ extraction', async () => {
    const text = '1. What is DNA?\nA) A protein\nB) A nucleic acid\n\n2. What is RNA?\nA) A lipid\nB) A nucleic acid';
    const artifact = { id: 'ocr-1', markdownText: text, rawText: text };
    const page = { documentId: 'doc-1' };
    const insertedSegments = [{ id: 'seg-1' }, { id: 'seg-2' }];
    const llmProvider = { id: 'prov-1', category: 'llm', isEnabled: true };

    mockedDb.select
      .mockReturnValueOnce(mockChain([artifact]) as any)        // OCR artifact
      .mockReturnValueOnce(mockChain([page]) as any)             // document page
      .mockReturnValueOnce(mockChain([llmProvider]) as any);     // LLM provider

    const insertChain = mockChain(insertedSegments);
    mockedDb.insert.mockReturnValue(insertChain as any);
    mockedEnqueue.mockResolvedValue({} as any);

    await processTextSegmentation(createJob({
      jobId: 'j1', documentPageId: 'dp1', workspaceId: 'ws-1', ocrArtifactId: 'ocr-1',
    }));

    expect(mockedDb.insert).toHaveBeenCalled();
    expect(mockedEnqueue).toHaveBeenCalledWith(
      'mcq-extraction',
      expect.objectContaining({
        segmentIds: ['seg-1', 'seg-2'],
        providerConfigId: 'prov-1',
      }),
    );
  });

  it('treats whole text as single segment when no patterns match', async () => {
    const text = 'This is just a paragraph with no question numbers or patterns.';
    const artifact = { id: 'ocr-1', markdownText: text, rawText: null };
    const page = { documentId: 'doc-1' };
    const insertedSegments = [{ id: 'seg-1' }]; // one segment
    const llmProvider = { id: 'prov-1', category: 'llm', isEnabled: true };

    mockedDb.select
      .mockReturnValueOnce(mockChain([artifact]) as any)
      .mockReturnValueOnce(mockChain([page]) as any)
      .mockReturnValueOnce(mockChain([llmProvider]) as any);
    mockedDb.insert.mockReturnValue(mockChain(insertedSegments) as any);
    mockedEnqueue.mockResolvedValue({} as any);

    await processTextSegmentation(createJob({
      jobId: 'j1', documentPageId: 'dp1', workspaceId: 'ws-1', ocrArtifactId: 'ocr-1',
    }));

    // Should still insert a segment and enqueue
    expect(mockedDb.insert).toHaveBeenCalled();
    expect(mockedEnqueue).toHaveBeenCalled();
  });

  it('does not enqueue MCQ extraction when no LLM provider found', async () => {
    const text = '1. What is DNA?\nA) Protein\nB) Nucleic acid';
    const artifact = { id: 'ocr-1', markdownText: text, rawText: text };
    const page = { documentId: 'doc-1' };

    mockedDb.select
      .mockReturnValueOnce(mockChain([artifact]) as any)
      .mockReturnValueOnce(mockChain([page]) as any)
      .mockReturnValueOnce(mockChain([]) as any); // no provider
    mockedDb.insert.mockReturnValue(mockChain([{ id: 'seg-1' }]) as any);

    await processTextSegmentation(createJob({
      jobId: 'j1', documentPageId: 'dp1', workspaceId: 'ws-1', ocrArtifactId: 'ocr-1',
    }));

    // Segments should be inserted
    expect(mockedDb.insert).toHaveBeenCalled();
    // But no enqueue since no provider
    expect(mockedEnqueue).not.toHaveBeenCalled();
  });
});
