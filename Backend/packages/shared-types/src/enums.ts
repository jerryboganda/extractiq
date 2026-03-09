// ──────────────────────────────────────────────
// Status & Role Enums
// ──────────────────────────────────────────────

export const UserRole = {
  SUPER_ADMIN: 'super_admin',
  WORKSPACE_ADMIN: 'workspace_admin',
  OPERATOR: 'operator',
  REVIEWER: 'reviewer',
  ANALYST: 'analyst',
  API_USER: 'api_user',
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const UserStatus = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  INVITED: 'invited',
} as const;
export type UserStatus = (typeof UserStatus)[keyof typeof UserStatus];

export const WorkspacePlan = {
  FREE: 'free',
  PRO: 'pro',
  ENTERPRISE: 'enterprise',
} as const;
export type WorkspacePlan = (typeof WorkspacePlan)[keyof typeof WorkspacePlan];

export const ProjectStatus = {
  ACTIVE: 'active',
  PAUSED: 'paused',
  ARCHIVED: 'archived',
} as const;
export type ProjectStatus = (typeof ProjectStatus)[keyof typeof ProjectStatus];

export const DocumentStatus = {
  UPLOADED: 'uploaded',
  PREPROCESSING: 'preprocessing',
  READY: 'ready',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  REVIEW: 'review',
  FAILED: 'failed',
} as const;
export type DocumentStatus = (typeof DocumentStatus)[keyof typeof DocumentStatus];

export const PageType = {
  QUESTION: 'question',
  ANSWER_KEY: 'answer_key',
  EXPLANATION: 'explanation',
  COVER: 'cover',
  INDEX: 'index',
  IRRELEVANT: 'irrelevant',
  UNKNOWN: 'unknown',
} as const;
export type PageType = (typeof PageType)[keyof typeof PageType];

export const RoutingDecision = {
  OCR_LLM: 'ocr_llm',
  VLM_DIRECT: 'vlm_direct',
  SKIP: 'skip',
} as const;
export type RoutingDecision = (typeof RoutingDecision)[keyof typeof RoutingDecision];

export const JobStatus = {
  QUEUED: 'queued',
  PREPROCESSING: 'preprocessing',
  RENDERING_PAGES: 'rendering_pages',
  ROUTING: 'routing',
  OCR_PROCESSING: 'ocr_processing',
  VLM_PROCESSING: 'vlm_processing',
  SEGMENTING: 'segmenting',
  EXTRACTING: 'extracting',
  VALIDATING: 'validating',
  HALLUCINATION_CHECKING: 'hallucination_checking',
  REVIEW_REQUIRED: 'review_required',
  EXPORT_READY: 'export_ready',
  COMPLETED: 'completed',
  FAILED: 'failed',
  PAUSED: 'paused',
  CANCELLED: 'cancelled',
} as const;
export type JobStatus = (typeof JobStatus)[keyof typeof JobStatus];

export const TaskType = {
  PREPROCESSING: 'preprocessing',
  PAGE_RENDER: 'page_render',
  OCR: 'ocr',
  VLM_EXTRACTION: 'vlm_extraction',
  SEGMENTATION: 'segmentation',
  LLM_EXTRACTION: 'llm_extraction',
  VALIDATION: 'validation',
  HALLUCINATION_CHECK: 'hallucination_check',
  EXPORT: 'export',
  NOTIFICATION: 'notification',
  COST_ATTRIBUTION: 'cost_attribution',
  SEMANTIC_INDEXING: 'semantic_indexing',
} as const;
export type TaskType = (typeof TaskType)[keyof typeof TaskType];

export const TaskStatus = {
  QUEUED: 'queued',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
  RETRYING: 'retrying',
} as const;
export type TaskStatus = (typeof TaskStatus)[keyof typeof TaskStatus];

export const QuestionType = {
  SINGLE_CHOICE: 'single_choice',
  MULTIPLE_CHOICE: 'multiple_choice',
  TRUE_FALSE: 'true_false',
} as const;
export type QuestionType = (typeof QuestionType)[keyof typeof QuestionType];

export const ExtractionPathway = {
  OCR_LLM: 'ocr_llm',
  VLM_DIRECT: 'vlm_direct',
  HYBRID: 'hybrid',
} as const;
export type ExtractionPathway = (typeof ExtractionPathway)[keyof typeof ExtractionPathway];

export const HallucinationRiskTier = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
} as const;
export type HallucinationRiskTier =
  (typeof HallucinationRiskTier)[keyof typeof HallucinationRiskTier];

export const ReviewStatus = {
  UNREVIEWED: 'unreviewed',
  PENDING: 'pending',
  IN_REVIEW: 'in_review',
  APPROVED: 'approved',
  EDITED: 'edited',
  REJECTED: 'rejected',
  FLAGGED: 'flagged',
  REPROCESS_REQUESTED: 'reprocess_requested',
} as const;
export type ReviewStatus = (typeof ReviewStatus)[keyof typeof ReviewStatus];

export const ReviewSeverity = {
  CRITICAL: 'critical',
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low',
} as const;
export type ReviewSeverity = (typeof ReviewSeverity)[keyof typeof ReviewSeverity];

export const ReviewActionType = {
  APPROVE: 'approve',
  REJECT: 'reject',
  EDIT: 'edit',
  FLAG: 'flag',
  REPROCESS: 'reprocess',
  SKIP: 'skip',
} as const;
export type ReviewActionType = (typeof ReviewActionType)[keyof typeof ReviewActionType];

export const ProviderCategory = {
  OCR: 'ocr',
  LLM: 'llm',
  VLM: 'vlm',
  EMBEDDING: 'embedding',
  PARSER: 'parser',
} as const;
export type ProviderCategory = (typeof ProviderCategory)[keyof typeof ProviderCategory];

export const ProviderType = {
  OPENAI: 'openai',
  ANTHROPIC: 'anthropic',
  GOOGLE: 'google',
  MISTRAL: 'mistral',
  QWEN_VL: 'qwen_vl',
  GLM_OCR: 'glm_ocr',
  DEEPSEEK: 'deepseek',
  TESSERACT: 'tesseract',
} as const;
export type ProviderType = (typeof ProviderType)[keyof typeof ProviderType];

export const ProviderHealthStatus = {
  HEALTHY: 'healthy',
  DEGRADED: 'degraded',
  OFFLINE: 'offline',
  UNKNOWN: 'unknown',
} as const;
export type ProviderHealthStatus =
  (typeof ProviderHealthStatus)[keyof typeof ProviderHealthStatus];

export const ExportFormat = {
  JSON: 'json',
  JSONL: 'jsonl',
  CSV: 'csv',
  QTI_2_1: 'qti_2_1',
  SCORM_2004: 'scorm_2004',
  XAPI: 'xapi',
} as const;
export type ExportFormat = (typeof ExportFormat)[keyof typeof ExportFormat];

export const ExportStatus = {
  QUEUED: 'queued',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
} as const;
export type ExportStatus = (typeof ExportStatus)[keyof typeof ExportStatus];

export const NotificationType = {
  JOB_COMPLETED: 'job_completed',
  JOB_FAILED: 'job_failed',
  REVIEW_REQUIRED: 'review_required',
  EXPORT_READY: 'export_ready',
  PROVIDER_ERROR: 'provider_error',
  UPLOAD_COMPLETE: 'upload_complete',
  BUDGET_WARNING: 'budget_warning',
  HALLUCINATION_SPIKE: 'hallucination_spike',
} as const;
export type NotificationType = (typeof NotificationType)[keyof typeof NotificationType];

export const HallucinationDetectionTier = {
  MODEL: 'model',
  CONTEXT: 'context',
  DATA: 'data',
} as const;
export type HallucinationDetectionTier =
  (typeof HallucinationDetectionTier)[keyof typeof HallucinationDetectionTier];

export const AuditAction = {
  // Auth
  AUTH_LOGIN: 'auth.login',
  AUTH_LOGOUT: 'auth.logout',
  AUTH_FAILED: 'auth.failed',
  // Documents
  DOCUMENT_UPLOAD: 'document.upload',
  DOCUMENT_DELETE: 'document.delete',
  DOCUMENT_REPROCESS: 'document.reprocess',
  // Jobs
  JOB_STARTED: 'job.started',
  JOB_COMPLETED: 'job.completed',
  JOB_FAILED: 'job.failed',
  JOB_CANCELLED: 'job.cancelled',
  JOB_PAUSED: 'job.paused',
  JOB_RESUMED: 'job.resumed',
  // MCQ
  MCQ_APPROVED: 'mcq.approved',
  MCQ_REJECTED: 'mcq.rejected',
  MCQ_EDITED: 'mcq.edited',
  MCQ_FLAGGED: 'mcq.flagged',
  // Export
  EXPORT_CREATED: 'export.created',
  EXPORT_DOWNLOADED: 'export.downloaded',
  // Provider
  PROVIDER_CREATED: 'provider.created',
  PROVIDER_UPDATED: 'provider.updated',
  PROVIDER_DELETED: 'provider.deleted',
  PROVIDER_TESTED: 'provider.tested',
  // User
  USER_INVITED: 'user.invited',
  USER_UPDATED: 'user.updated',
  USER_DELETED: 'user.deleted',
  // Workspace
  WORKSPACE_UPDATED: 'workspace.updated',
  WORKSPACE_DELETED: 'workspace.deleted',
  // Settings
  SETTINGS_CHANGED: 'settings.changed',
} as const;
export type AuditAction = (typeof AuditAction)[keyof typeof AuditAction];

export const IntegrationType = {
  SLACK: 'slack',
  TEAMS: 'teams',
  ZAPIER: 'zapier',
  GOOGLE_DRIVE: 'google_drive',
} as const;
export type IntegrationType = (typeof IntegrationType)[keyof typeof IntegrationType];
