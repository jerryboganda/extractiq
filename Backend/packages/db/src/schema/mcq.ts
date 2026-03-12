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
import { documents } from './documents.js';
import { jobs } from './jobs.js';

// ──────────────────────────────────────────────
// MCQ Records
// ──────────────────────────────────────────────
export const mcqRecords = pgTable('mcq_records', {
  id: uuid('id').primaryKey().defaultRandom(),
  workspaceId: uuid('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
  projectId: uuid('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  documentId: uuid('document_id').notNull().references(() => documents.id, { onDelete: 'cascade' }),
  jobId: uuid('job_id').notNull().references(() => jobs.id),
  sourcePage: integer('source_page').notNull(),
  sourcePageEnd: integer('source_page_end'),
  sourcePageImageRef: text('source_page_image_ref'),
  sourceExcerpt: text('source_excerpt'),
  questionNumber: varchar('question_number', { length: 30 }),
  questionText: text('question_text').notNull(),
  options: jsonb('options').notNull().default([]),
  correctAnswer: text('correct_answer'),
  explanation: text('explanation'),
  questionType: varchar('question_type', { length: 30 }).notNull().default('single_choice'),
  subject: varchar('subject', { length: 200 }),
  topic: varchar('topic', { length: 200 }),
  difficulty: varchar('difficulty', { length: 30 }),
  language: varchar('language', { length: 10 }).notNull().default('en'),
  extractionPathway: varchar('extraction_pathway', { length: 30 }).notNull(),
  providerUsed: varchar('provider_used', { length: 50 }).notNull(),
  modelUsed: varchar('model_used', { length: 100 }).notNull(),
  confidence: real('confidence').notNull(),
  confidenceBreakdown: jsonb('confidence_breakdown').notNull().default({}),
  flags: jsonb('flags').notNull().default([]),
  hallucinationRiskTier: varchar('hallucination_risk_tier', { length: 30 }).notNull().default('low'),
  reviewStatus: varchar('review_status', { length: 30 }).notNull().default('pending'),
  costAttribution: jsonb('cost_attribution').notNull().default({}),
  version: integer('version').notNull().default(1),
  schemaVersion: varchar('schema_version', { length: 20 }).notNull().default('1.0'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('mcq_records_workspace_id_idx').on(t.workspaceId),
  index('mcq_records_project_id_idx').on(t.projectId),
  index('mcq_records_document_id_idx').on(t.documentId),
  index('mcq_records_job_id_idx').on(t.jobId),
  index('mcq_records_review_status_idx').on(t.reviewStatus),
  index('mcq_records_confidence_idx').on(t.confidence),
  index('mcq_records_hallucination_tier_idx').on(t.hallucinationRiskTier),
  // Composite indexes for common query patterns
  index('mcq_records_ws_project_status_idx').on(t.workspaceId, t.projectId, t.reviewStatus),
  index('mcq_records_ws_confidence_idx').on(t.workspaceId, t.confidence),
]);

// ──────────────────────────────────────────────
// MCQ Record History (audit trail for edits)
// ──────────────────────────────────────────────
export const mcqRecordHistory = pgTable('mcq_record_history', {
  id: uuid('id').primaryKey().defaultRandom(),
  mcqRecordId: uuid('mcq_record_id').notNull().references(() => mcqRecords.id, { onDelete: 'cascade' }),
  version: integer('version').notNull(),
  previousValues: jsonb('previous_values').notNull(),
  changedBy: uuid('changed_by').notNull(),
  changeType: varchar('change_type', { length: 30 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('mcq_record_history_mcq_record_id_idx').on(t.mcqRecordId),
]);

// ──────────────────────────────────────────────
// Review Items
// ──────────────────────────────────────────────
export const reviewItems = pgTable('review_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  mcqRecordId: uuid('mcq_record_id').notNull().references(() => mcqRecords.id, { onDelete: 'cascade' }),
  workspaceId: uuid('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
  severity: varchar('severity', { length: 30 }).notNull(),
  flagTypes: jsonb('flag_types').notNull().default([]),
  reasonSummary: text('reason_summary'),
  assignedTo: uuid('assigned_to').references(() => users.id),
  status: varchar('status', { length: 30 }).notNull().default('pending'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  resolvedAt: timestamp('resolved_at', { withTimezone: true }),
}, (t) => [
  index('review_items_mcq_record_id_idx').on(t.mcqRecordId),
  index('review_items_workspace_id_idx').on(t.workspaceId),
  index('review_items_status_idx').on(t.status),
  index('review_items_assigned_to_idx').on(t.assignedTo),
  // Composite: queue listing by workspace + status
  index('review_items_ws_status_idx').on(t.workspaceId, t.status),
  index('review_items_ws_assigned_status_idx').on(t.workspaceId, t.assignedTo, t.status),
]);

// ──────────────────────────────────────────────
// Review Actions
// ──────────────────────────────────────────────
export const reviewActions = pgTable('review_actions', {
  id: uuid('id').primaryKey().defaultRandom(),
  reviewItemId: uuid('review_item_id').notNull().references(() => reviewItems.id, { onDelete: 'cascade' }),
  actionType: varchar('action_type', { length: 30 }).notNull(),
  performedBy: uuid('performed_by').notNull(),
  changes: jsonb('changes'),
  reviewerNotes: text('reviewer_notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('review_actions_review_item_id_idx').on(t.reviewItemId),
]);
