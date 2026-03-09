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
import { workspaces, projects } from './core.js';
import { documents, documentPages } from './documents.js';

// ──────────────────────────────────────────────
// Jobs
// ──────────────────────────────────────────────
export const jobs = pgTable('jobs', {
  id: uuid('id').primaryKey().defaultRandom(),
  workspaceId: uuid('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
  projectId: uuid('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  status: varchar('status', { length: 30 }).notNull().default('pending'),
  totalDocuments: integer('total_documents').notNull().default(0),
  totalPages: integer('total_pages'),
  totalTasks: integer('total_tasks').notNull().default(0),
  completedTasks: integer('completed_tasks').notNull().default(0),
  failedTasks: integer('failed_tasks').notNull().default(0),
  progressPercent: real('progress_percent').notNull().default(0),
  extractionProfile: jsonb('extraction_profile'),
  errorSummary: jsonb('error_summary'),
  startedAt: timestamp('started_at', { withTimezone: true }),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('jobs_workspace_id_idx').on(t.workspaceId),
  index('jobs_project_id_idx').on(t.projectId),
  index('jobs_status_idx').on(t.status),
]);

// ──────────────────────────────────────────────
// Job–Document join table
// ──────────────────────────────────────────────
export const jobDocuments = pgTable('job_documents', {
  id: uuid('id').primaryKey().defaultRandom(),
  jobId: uuid('job_id').notNull().references(() => jobs.id, { onDelete: 'cascade' }),
  documentId: uuid('document_id').notNull().references(() => documents.id, { onDelete: 'cascade' }),
}, (t) => [
  index('job_documents_job_id_idx').on(t.jobId),
  index('job_documents_document_id_idx').on(t.documentId),
]);

// ──────────────────────────────────────────────
// Job Tasks
// ──────────────────────────────────────────────
export const jobTasks = pgTable('job_tasks', {
  id: uuid('id').primaryKey().defaultRandom(),
  jobId: uuid('job_id').notNull().references(() => jobs.id, { onDelete: 'cascade' }),
  documentId: uuid('document_id').references(() => documents.id),
  documentPageId: uuid('document_page_id').references(() => documentPages.id),
  taskType: varchar('task_type', { length: 30 }).notNull(),
  status: varchar('status', { length: 30 }).notNull().default('pending'),
  providerConfigId: uuid('provider_config_id'),
  inputData: jsonb('input_data'),
  outputData: jsonb('output_data'),
  errorMessage: text('error_message'),
  latencyMs: integer('latency_ms'),
  costUsd: real('cost_usd'),
  retryCount: integer('retry_count').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  completedAt: timestamp('completed_at', { withTimezone: true }),
}, (t) => [
  index('job_tasks_job_id_idx').on(t.jobId),
  index('job_tasks_status_idx').on(t.status),
  index('job_tasks_task_type_idx').on(t.taskType),
  index('job_tasks_document_id_idx').on(t.documentId),
]);
