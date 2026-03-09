import type {
  UserRole,
  UserStatus,
  WorkspacePlan,
  ProjectStatus,
  DocumentStatus,
  JobStatus,
  TaskType,
  TaskStatus,
  QuestionType,
  ExtractionPathway,
  HallucinationRiskTier,
  ReviewStatus,
  ReviewSeverity,
  ReviewActionType,
  ProviderCategory,
  ProviderType,
  ProviderHealthStatus,
  ExportFormat,
  ExportStatus,
  NotificationType,
  HallucinationDetectionTier,
  AuditAction,
  PageType,
  RoutingDecision,
  IntegrationType,
} from './enums.js';

// ──────────────────────────────────────────────
// Core Entity Types
// ──────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  status: UserStatus;
  workspaceId: string;
  avatarUrl: string | null;
  lastActiveAt: string | null;
  createdAt: string;
}

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  plan: WorkspacePlan;
  settings: WorkspaceSettings;
  maxFileSizeMb: number;
  autoApproveThreshold: number | null;
  createdAt: string;
}

export interface WorkspaceSettings {
  emailNotifications: boolean;
  webhookUrl: string | null;
  defaultExtractionProfile: Record<string, unknown> | null;
}

export interface Project {
  id: string;
  workspaceId: string;
  name: string;
  description: string | null;
  status: ProjectStatus;
  extractionProfile: Record<string, unknown> | null;
  qualityThresholds: Record<string, unknown> | null;
  createdAt: string;
}

export interface Document {
  id: string;
  workspaceId: string;
  projectId: string;
  filename: string;
  s3Key: string;
  fileSize: number;
  mimeType: string;
  pageCount: number | null;
  status: DocumentStatus;
  checksumSha256: string | null;
  tags: string[];
  notes: string | null;
  mcqCount: number;
  confidenceAvg: number | null;
  uploadedBy: string;
  createdAt: string;
}

export interface DocumentPage {
  id: string;
  documentId: string;
  pageNumber: number;
  pageType: PageType;
  textLayerPresent: boolean;
  visualComplexityScore: number | null;
  routingDecision: RoutingDecision;
  rawText: string | null;
  classification: string | null;
}

export interface PageImage {
  id: string;
  documentPageId: string;
  s3Key: string;
  dpi: number;
  width: number;
  height: number;
  format: string;
}

export interface Job {
  id: string;
  workspaceId: string;
  projectId: string;
  status: JobStatus;
  totalDocuments: number;
  totalPages: number | null;
  totalTasks: number;
  completedTasks: number;
  failedTasks: number;
  progressPercent: number;
  extractionProfile: Record<string, unknown> | null;
  errorSummary: Record<string, unknown> | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
}

export interface JobTask {
  id: string;
  jobId: string;
  documentId: string | null;
  documentPageId: string | null;
  taskType: TaskType;
  status: TaskStatus;
  providerConfigId: string | null;
  inputData: Record<string, unknown> | null;
  outputData: Record<string, unknown> | null;
  errorMessage: string | null;
  latencyMs: number | null;
  costUsd: number | null;
  retryCount: number;
  createdAt: string;
  completedAt: string | null;
}

export interface MCQOption {
  label: string;
  text: string;
}

export interface ConfidenceBreakdown {
  ocr: number | null;
  segmentation: number | null;
  extraction: number | null;
  validation: number | null;
}

export interface CostAttribution {
  ocrCostUsd: number;
  llmCostUsd: number;
  vlmCostUsd: number;
  totalCostUsd: number;
}

export interface MCQRecord {
  id: string;
  workspaceId: string;
  projectId: string;
  documentId: string;
  jobId: string;
  sourcePage: number;
  sourcePageEnd: number | null;
  sourcePageImageRef: string | null;
  sourceExcerpt: string | null;
  questionNumber: string | null;
  questionText: string;
  options: MCQOption[];
  correctAnswer: string | null;
  explanation: string | null;
  questionType: QuestionType;
  subject: string | null;
  topic: string | null;
  difficulty: string | null;
  language: string;
  extractionPathway: ExtractionPathway;
  providerUsed: string;
  modelUsed: string;
  confidence: number;
  confidenceBreakdown: ConfidenceBreakdown;
  flags: string[];
  hallucinationRiskTier: HallucinationRiskTier;
  reviewStatus: ReviewStatus;
  costAttribution: CostAttribution;
  version: number;
  schemaVersion: string;
  createdAt: string;
  updatedAt: string;
}

export interface MCQRecordHistory {
  id: string;
  mcqRecordId: string;
  version: number;
  previousValues: Record<string, unknown>;
  changedBy: string;
  changeType: string;
  createdAt: string;
}

export interface ReviewItem {
  id: string;
  mcqRecordId: string;
  workspaceId: string;
  severity: ReviewSeverity;
  flagTypes: string[];
  reasonSummary: string | null;
  assignedTo: string | null;
  status: ReviewStatus;
  createdAt: string;
  resolvedAt: string | null;
}

export interface ReviewAction {
  id: string;
  reviewItemId: string;
  actionType: ReviewActionType;
  performedBy: string;
  changes: Record<string, unknown> | null;
  reviewerNotes: string | null;
  createdAt: string;
}

export interface OCRArtifact {
  id: string;
  documentPageId: string;
  providerConfigId: string;
  rawText: string | null;
  markdownText: string | null;
  confidence: number | null;
  boundingBoxes: Record<string, unknown> | null;
  latencyMs: number | null;
  createdAt: string;
}

export interface VLMOutput {
  id: string;
  documentPageId: string;
  providerConfigId: string;
  rawOutput: Record<string, unknown> | null;
  extractedMcqs: Record<string, unknown> | null;
  confidence: number | null;
  costUsd: number | null;
  latencyMs: number | null;
  createdAt: string;
}

export interface Segment {
  id: string;
  documentId: string;
  documentPageId: string | null;
  rawText: string;
  segmentType: string;
  questionNumberDetected: string | null;
  startOffset: number | null;
  endOffset: number | null;
  createdAt: string;
}

export interface ProviderConfig {
  id: string;
  workspaceId: string;
  category: ProviderCategory;
  providerType: ProviderType;
  displayName: string;
  models: string[];
  config: Record<string, unknown>;
  healthStatus: ProviderHealthStatus;
  isDefault: boolean;
  isEnabled: boolean;
  lastHealthCheck: string | null;
  createdAt: string;
}

export interface ProviderBenchmark {
  id: string;
  providerConfigId: string;
  accuracy: number | null;
  avgLatencyMs: number | null;
  costPerRecord: number | null;
  errorRate: number | null;
  totalRecords: number;
  totalCost: number;
  measuredAt: string;
}

export interface ExportJob {
  id: string;
  workspaceId: string;
  projectId: string;
  format: ExportFormat;
  scope: Record<string, unknown>;
  status: ExportStatus;
  totalRecords: number | null;
  fileSize: number | null;
  progressPercent: number;
  createdBy: string;
  createdAt: string;
  completedAt: string | null;
}

export interface ExportArtifact {
  id: string;
  exportJobId: string;
  s3Key: string;
  filename: string;
  fileSize: number;
  contentType: string;
  downloadUrlExpiry: string | null;
  createdAt: string;
}

export interface CostRecord {
  id: string;
  workspaceId: string;
  jobId: string | null;
  jobTaskId: string | null;
  providerConfigId: string | null;
  operationType: string;
  costUsd: number;
  tokenCount: number | null;
  inputTokens: number | null;
  outputTokens: number | null;
  createdAt: string;
}

export interface HallucinationEvent {
  id: string;
  mcqRecordId: string;
  detectionTier: HallucinationDetectionTier;
  detectionRule: string;
  severity: ReviewSeverity;
  details: Record<string, unknown>;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  workspaceId: string;
  userId: string | null;
  resourceType: string;
  resourceId: string | null;
  action: AuditAction;
  details: Record<string, unknown> | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
}

export interface Notification {
  id: string;
  workspaceId: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data: Record<string, unknown> | null;
  read: boolean;
  createdAt: string;
}

export interface PromptVersion {
  id: string;
  promptId: string;
  version: number;
  taskType: string;
  template: string;
  variables: Record<string, unknown> | null;
  schemaRef: string | null;
  performanceMetrics: Record<string, unknown> | null;
  isActive: boolean;
  createdAt: string;
}

export interface ValidationReport {
  id: string;
  jobId: string;
  totalRecords: number;
  passedCount: number;
  flaggedCount: Record<string, number>;
  failedCount: number;
  duplicateCount: number;
  weakOcrCount: number;
  exportReadyCount: number;
  ruleBreakdown: Record<string, unknown>;
  estimatedTotalCost: number | null;
  createdAt: string;
}

export interface ApiKey {
  id: string;
  workspaceId: string;
  userId: string;
  keyPrefix: string;
  name: string;
  lastUsedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
}

export interface WorkspaceIntegration {
  id: string;
  workspaceId: string;
  integrationType: IntegrationType;
  config: Record<string, unknown>;
  enabled: boolean;
  createdAt: string;
}
