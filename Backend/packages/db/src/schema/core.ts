import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  integer,
  jsonb,
  uniqueIndex,
  index,
} from 'drizzle-orm/pg-core';

// ──────────────────────────────────────────────
// Workspaces
// ──────────────────────────────────────────────
export const workspaces = pgTable('workspaces', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull(),
  slug: varchar('slug', { length: 120 }).notNull(),
  plan: varchar('plan', { length: 20 }).notNull().default('free'),
  settings: jsonb('settings').notNull().default({}),
  maxFileSizeMb: integer('max_file_size_mb').notNull().default(100),
  autoApproveThreshold: integer('auto_approve_threshold'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  uniqueIndex('workspaces_slug_idx').on(t.slug),
]);

// ──────────────────────────────────────────────
// Users
// ──────────────────────────────────────────────
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  workspaceId: uuid('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
  email: varchar('email', { length: 255 }).notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  passwordHash: text('password_hash').notNull(),
  role: varchar('role', { length: 30 }).notNull().default('reviewer'),
  status: varchar('status', { length: 20 }).notNull().default('active'),
  avatarUrl: text('avatar_url'),
  lastActiveAt: timestamp('last_active_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  uniqueIndex('users_workspace_email_idx').on(t.workspaceId, t.email),
  index('users_workspace_id_idx').on(t.workspaceId),
  index('users_status_idx').on(t.status),
]);

// ──────────────────────────────────────────────
// Refresh Tokens
// ──────────────────────────────────────────────
export const refreshTokens = pgTable('refresh_tokens', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  tokenHash: text('token_hash').notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  revokedAt: timestamp('revoked_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('refresh_tokens_user_id_idx').on(t.userId),
  index('refresh_tokens_token_hash_idx').on(t.tokenHash),
]);

export const invitationTokens = pgTable('invitation_tokens', {
  id: uuid('id').primaryKey().defaultRandom(),
  workspaceId: uuid('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  invitedBy: uuid('invited_by').notNull().references(() => users.id),
  tokenHash: text('token_hash').notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  acceptedAt: timestamp('accepted_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  uniqueIndex('invitation_tokens_token_hash_idx').on(t.tokenHash),
  index('invitation_tokens_workspace_id_idx').on(t.workspaceId),
  index('invitation_tokens_user_id_idx').on(t.userId),
]);

// ──────────────────────────────────────────────
// Projects
// ──────────────────────────────────────────────
export const projects = pgTable('projects', {
  id: uuid('id').primaryKey().defaultRandom(),
  workspaceId: uuid('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 200 }).notNull(),
  description: text('description'),
  status: varchar('status', { length: 20 }).notNull().default('active'),
  extractionProfile: jsonb('extraction_profile'),
  qualityThresholds: jsonb('quality_thresholds'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('projects_workspace_id_idx').on(t.workspaceId),
  index('projects_status_idx').on(t.status),
]);
