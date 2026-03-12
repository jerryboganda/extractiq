import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  integer,
  real,
  jsonb,
  index,
} from 'drizzle-orm/pg-core';
import { workspaces, projects, users } from './core.js';

// ──────────────────────────────────────────────
// Documents
// ──────────────────────────────────────────────
export const documents = pgTable('documents', {
  id: uuid('id').primaryKey().defaultRandom(),
  workspaceId: uuid('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
  projectId: uuid('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  filename: varchar('filename', { length: 500 }).notNull(),
  s3Key: text('s3_key').notNull(),
  fileSize: integer('file_size').notNull(),
  mimeType: varchar('mime_type', { length: 100 }).notNull(),
  pageCount: integer('page_count'),
  status: varchar('status', { length: 30 }).notNull().default('uploaded'),
  checksumSha256: varchar('checksum_sha256', { length: 64 }),
  tags: jsonb('tags').notNull().default([]),
  notes: text('notes'),
  mcqCount: integer('mcq_count').notNull().default(0),
  confidenceAvg: real('confidence_avg'),
  uploadedBy: uuid('uploaded_by').notNull().references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('documents_workspace_id_idx').on(t.workspaceId),
  index('documents_project_id_idx').on(t.projectId),
  index('documents_status_idx').on(t.status),
  index('documents_uploaded_by_idx').on(t.uploadedBy),
  // Composite: project listing with status filter
  index('documents_project_status_idx').on(t.projectId, t.status),
]);

// ──────────────────────────────────────────────
// Document Pages
// ──────────────────────────────────────────────
export const documentPages = pgTable('document_pages', {
  id: uuid('id').primaryKey().defaultRandom(),
  documentId: uuid('document_id').notNull().references(() => documents.id, { onDelete: 'cascade' }),
  pageNumber: integer('page_number').notNull(),
  pageType: varchar('page_type', { length: 30 }).notNull().default('question'),
  textLayerPresent: varchar('text_layer_present', { length: 10 }).notNull().default('false'),
  visualComplexityScore: real('visual_complexity_score'),
  routingDecision: varchar('routing_decision', { length: 30 }).notNull().default('ocr_then_llm'),
  rawText: text('raw_text'),
  classification: text('classification'),
}, (t) => [
  index('document_pages_document_id_idx').on(t.documentId),
  index('document_pages_page_number_idx').on(t.documentId, t.pageNumber),
]);

// ──────────────────────────────────────────────
// Page Images
// ──────────────────────────────────────────────
export const pageImages = pgTable('page_images', {
  id: uuid('id').primaryKey().defaultRandom(),
  documentPageId: uuid('document_page_id').notNull().references(() => documentPages.id, { onDelete: 'cascade' }),
  s3Key: text('s3_key').notNull(),
  dpi: integer('dpi').notNull(),
  width: integer('width').notNull(),
  height: integer('height').notNull(),
  format: varchar('format', { length: 20 }).notNull(),
}, (t) => [
  index('page_images_document_page_id_idx').on(t.documentPageId),
]);
