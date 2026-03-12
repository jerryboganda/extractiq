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
import { workspaces, projects, users } from './core.js';
import { jobs, jobTasks } from './jobs.js';
import { mcqRecords } from './mcq.js';
import { providerConfigs } from './providers.js';

// ──────────────────────────────────────────────
// Export Jobs
// ──────────────────────────────────────────────
export const exportJobs = pgTable('export_jobs', {
  id: uuid('id').primaryKey().defaultRandom(),
  workspaceId: uuid('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
  projectId: uuid('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  format: varchar('format', { length: 20 }).notNull(),
  scope: jsonb('scope').notNull().default({}),
  status: varchar('status', { length: 20 }).notNull().default('pending'),
  totalRecords: integer('total_records'),
  fileSize: integer('file_size'),
  progressPercent: real('progress_percent').notNull().default(0),
  createdBy: uuid('created_by').notNull().references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  completedAt: timestamp('completed_at', { withTimezone: true }),
}, (t) => [
  index('export_jobs_workspace_id_idx').on(t.workspaceId),
  index('export_jobs_status_idx').on(t.status),
]);

// ──────────────────────────────────────────────
// Export Artifacts
// ──────────────────────────────────────────────
export const exportArtifacts = pgTable('export_artifacts', {
  id: uuid('id').primaryKey().defaultRandom(),
  exportJobId: uuid('export_job_id').notNull().references(() => exportJobs.id, { onDelete: 'cascade' }),
  s3Key: text('s3_key').notNull(),
  filename: varchar('filename', { length: 500 }).notNull(),
  fileSize: integer('file_size').notNull(),
  contentType: varchar('content_type', { length: 100 }).notNull(),
  downloadUrlExpiry: timestamp('download_url_expiry', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('export_artifacts_export_job_id_idx').on(t.exportJobId),
]);

// ──────────────────────────────────────────────
// Cost Records
// ──────────────────────────────────────────────
export const costRecords = pgTable('cost_records', {
  id: uuid('id').primaryKey().defaultRandom(),
  workspaceId: uuid('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
  jobId: uuid('job_id').references(() => jobs.id),
  jobTaskId: uuid('job_task_id').references(() => jobTasks.id),
  providerConfigId: uuid('provider_config_id').references(() => providerConfigs.id),
  operationType: varchar('operation_type', { length: 50 }).notNull(),
  costUsd: real('cost_usd').notNull(),
  tokenCount: integer('token_count'),
  inputTokens: integer('input_tokens'),
  outputTokens: integer('output_tokens'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('cost_records_workspace_id_idx').on(t.workspaceId),
  index('cost_records_job_id_idx').on(t.jobId),
  index('cost_records_provider_config_id_idx').on(t.providerConfigId),
]);

// ──────────────────────────────────────────────
// Hallucination Events
// ──────────────────────────────────────────────
export const hallucinationEvents = pgTable('hallucination_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  mcqRecordId: uuid('mcq_record_id').notNull().references(() => mcqRecords.id, { onDelete: 'cascade' }),
  detectionTier: varchar('detection_tier', { length: 30 }).notNull(),
  detectionRule: varchar('detection_rule', { length: 100 }).notNull(),
  severity: varchar('severity', { length: 30 }).notNull(),
  details: jsonb('details').notNull().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('hallucination_events_mcq_record_id_idx').on(t.mcqRecordId),
]);

// ──────────────────────────────────────────────
// Audit Logs
// ──────────────────────────────────────────────
export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  workspaceId: uuid('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
  userId: uuid('user_id'),
  resourceType: varchar('resource_type', { length: 50 }).notNull(),
  resourceId: uuid('resource_id'),
  action: varchar('action', { length: 50 }).notNull(),
  details: jsonb('details'),
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('audit_logs_workspace_id_idx').on(t.workspaceId),
  index('audit_logs_user_id_idx').on(t.userId),
  index('audit_logs_action_idx').on(t.action),
  index('audit_logs_created_at_idx').on(t.createdAt),
  // Composite: paginated audit log queries
  index('audit_logs_ws_created_at_idx').on(t.workspaceId, t.createdAt),
]);

// ──────────────────────────────────────────────
// Notifications
// ──────────────────────────────────────────────
export const notifications = pgTable('notifications', {
  id: uuid('id').primaryKey().defaultRandom(),
  workspaceId: uuid('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: varchar('type', { length: 30 }).notNull(),
  title: varchar('title', { length: 200 }).notNull(),
  message: text('message').notNull(),
  data: jsonb('data'),
  read: boolean('read').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('notifications_user_id_idx').on(t.userId),
  index('notifications_workspace_id_idx').on(t.workspaceId),
  index('notifications_read_idx').on(t.read),
  // Composite: unread notifications per user
  index('notifications_user_read_idx').on(t.userId, t.read),
]);

// ──────────────────────────────────────────────
// Prompt Versions
// ──────────────────────────────────────────────
export const promptVersions = pgTable('prompt_versions', {
  id: uuid('id').primaryKey().defaultRandom(),
  promptId: varchar('prompt_id', { length: 100 }).notNull(),
  version: integer('version').notNull(),
  taskType: varchar('task_type', { length: 50 }).notNull(),
  template: text('template').notNull(),
  variables: jsonb('variables'),
  schemaRef: text('schema_ref'),
  performanceMetrics: jsonb('performance_metrics'),
  isActive: boolean('is_active').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('prompt_versions_prompt_id_idx').on(t.promptId),
  index('prompt_versions_task_type_idx').on(t.taskType),
  index('prompt_versions_is_active_idx').on(t.isActive),
]);

// ──────────────────────────────────────────────
// Validation Reports
// ──────────────────────────────────────────────
export const validationReports = pgTable('validation_reports', {
  id: uuid('id').primaryKey().defaultRandom(),
  jobId: uuid('job_id').notNull().references(() => jobs.id, { onDelete: 'cascade' }),
  totalRecords: integer('total_records').notNull(),
  passedCount: integer('passed_count').notNull(),
  flaggedCount: jsonb('flagged_count').notNull().default({}),
  failedCount: integer('failed_count').notNull(),
  duplicateCount: integer('duplicate_count').notNull().default(0),
  weakOcrCount: integer('weak_ocr_count').notNull().default(0),
  exportReadyCount: integer('export_ready_count').notNull().default(0),
  ruleBreakdown: jsonb('rule_breakdown').notNull().default({}),
  estimatedTotalCost: real('estimated_total_cost'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('validation_reports_job_id_idx').on(t.jobId),
]);

// ──────────────────────────────────────────────
// API Keys
// ──────────────────────────────────────────────
export const apiKeys = pgTable('api_keys', {
  id: uuid('id').primaryKey().defaultRandom(),
  workspaceId: uuid('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  keyHash: text('key_hash').notNull(),
  keyPrefix: varchar('key_prefix', { length: 12 }).notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  lastUsedAt: timestamp('last_used_at', { withTimezone: true }),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('api_keys_workspace_id_idx').on(t.workspaceId),
  index('api_keys_key_hash_idx').on(t.keyHash),
]);

// ──────────────────────────────────────────────
// Workspace Integrations
// ──────────────────────────────────────────────
export const workspaceIntegrations = pgTable('workspace_integrations', {
  id: uuid('id').primaryKey().defaultRandom(),
  workspaceId: uuid('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
  integrationType: varchar('integration_type', { length: 30 }).notNull(),
  config: jsonb('config').notNull().default({}),
  enabled: boolean('enabled').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('workspace_integrations_workspace_id_idx').on(t.workspaceId),
]);
