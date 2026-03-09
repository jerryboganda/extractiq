import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  integer,
  real,
  jsonb,
  boolean,
  index,
} from 'drizzle-orm/pg-core';
import { workspaces } from './core.js';
import { documentPages } from './documents.js';

// ──────────────────────────────────────────────
// Provider Configs
// ──────────────────────────────────────────────
export const providerConfigs = pgTable('provider_configs', {
  id: uuid('id').primaryKey().defaultRandom(),
  workspaceId: uuid('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
  category: varchar('category', { length: 30 }).notNull(),
  providerType: varchar('provider_type', { length: 30 }).notNull(),
  displayName: varchar('display_name', { length: 100 }).notNull(),
  apiKeyEncrypted: text('api_key_encrypted').notNull(),
  models: jsonb('models').notNull().default([]),
  config: jsonb('config').notNull().default({}),
  healthStatus: varchar('health_status', { length: 20 }).notNull().default('unknown'),
  isDefault: boolean('is_default').notNull().default(false),
  isEnabled: boolean('is_enabled').notNull().default(true),
  lastHealthCheck: timestamp('last_health_check', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('provider_configs_workspace_id_idx').on(t.workspaceId),
  index('provider_configs_category_idx').on(t.category),
  index('provider_configs_provider_type_idx').on(t.providerType),
]);

// ──────────────────────────────────────────────
// Provider Benchmarks
// ──────────────────────────────────────────────
export const providerBenchmarks = pgTable('provider_benchmarks', {
  id: uuid('id').primaryKey().defaultRandom(),
  providerConfigId: uuid('provider_config_id').notNull().references(() => providerConfigs.id, { onDelete: 'cascade' }),
  accuracy: real('accuracy'),
  avgLatencyMs: real('avg_latency_ms'),
  costPerRecord: real('cost_per_record'),
  errorRate: real('error_rate'),
  totalRecords: integer('total_records').notNull().default(0),
  totalCost: real('total_cost').notNull().default(0),
  measuredAt: timestamp('measured_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('provider_benchmarks_provider_config_id_idx').on(t.providerConfigId),
]);

// ──────────────────────────────────────────────
// OCR Artifacts
// ──────────────────────────────────────────────
export const ocrArtifacts = pgTable('ocr_artifacts', {
  id: uuid('id').primaryKey().defaultRandom(),
  documentPageId: uuid('document_page_id').notNull().references(() => documentPages.id, { onDelete: 'cascade' }),
  providerConfigId: uuid('provider_config_id').notNull().references(() => providerConfigs.id),
  rawText: text('raw_text'),
  markdownText: text('markdown_text'),
  confidence: real('confidence'),
  boundingBoxes: jsonb('bounding_boxes'),
  latencyMs: integer('latency_ms'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('ocr_artifacts_document_page_id_idx').on(t.documentPageId),
]);

// ──────────────────────────────────────────────
// VLM Outputs
// ──────────────────────────────────────────────
export const vlmOutputs = pgTable('vlm_outputs', {
  id: uuid('id').primaryKey().defaultRandom(),
  documentPageId: uuid('document_page_id').notNull().references(() => documentPages.id, { onDelete: 'cascade' }),
  providerConfigId: uuid('provider_config_id').notNull().references(() => providerConfigs.id),
  rawOutput: jsonb('raw_output'),
  extractedMcqs: jsonb('extracted_mcqs'),
  confidence: real('confidence'),
  costUsd: real('cost_usd'),
  latencyMs: integer('latency_ms'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('vlm_outputs_document_page_id_idx').on(t.documentPageId),
]);

// ──────────────────────────────────────────────
// Segments
// ──────────────────────────────────────────────
export const segments = pgTable('segments', {
  id: uuid('id').primaryKey().defaultRandom(),
  documentId: uuid('document_id').notNull(),
  documentPageId: uuid('document_page_id').references(() => documentPages.id),
  rawText: text('raw_text').notNull(),
  segmentType: varchar('segment_type', { length: 30 }).notNull(),
  questionNumberDetected: varchar('question_number_detected', { length: 30 }),
  startOffset: integer('start_offset'),
  endOffset: integer('end_offset'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('segments_document_id_idx').on(t.documentId),
  index('segments_document_page_id_idx').on(t.documentPageId),
]);
