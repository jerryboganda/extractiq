import { z } from 'zod';

// ──────────────────────────────────────────────
// API Response Types
// ──────────────────────────────────────────────

/** Standard paginated response */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/** Standard error response */
export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    details?: Array<{ field: string; message: string }>;
    correlationId: string;
  };
}

/** Standard success response wrapper */
export interface ApiResponse<T> {
  data: T;
}

// ──────────────────────────────────────────────
// Frontend-compatible response shapes
// (These match the mock data in the Web App)
// ──────────────────────────────────────────────

/** Dashboard stats — matches mockStats */
export interface DashboardStats {
  documentsProcessed: number;
  mcqsExtracted: number;
  approvalRate: number;
  activeJobs: number;
  documentsProcessedTrend: number;
  mcqsExtractedTrend: number;
  approvalRateTrend: number;
  activeJobsTrend: number;
}

/** Dashboard sparkline data — matches mockSparklineData */
export interface DashboardSparkline {
  documentsProcessed: number[];
  mcqsExtracted: number[];
  approvalRate: number[];
  activeJobs: number[];
}

/** Active job — matches mockActiveJobs item */
export interface ActiveJobResponse {
  id: string;
  document: string;
  status: string;
  progress: number;
  provider: string;
  stage: string;
  startedAt: string;
}

/** Recent activity — matches mockRecentActivity item */
export interface ActivityResponse {
  id: string;
  action: string;
  target: string;
  user: string;
  time: string;
  type: 'upload' | 'approve' | 'extract' | 'flag' | 'export' | 'settings';
}

/** Provider health — matches mockProviderHealth item */
export interface ProviderHealthResponse {
  name: string;
  status: 'healthy' | 'degraded' | 'offline';
  accuracy: number;
  latency: string;
}

/** Project list item — matches mockProjects item */
export interface ProjectResponse {
  id: string;
  name: string;
  description: string;
  documentsCount: number;
  mcqCount: number;
  status: string;
  progress: number;
  lastActivity: string;
  members: number;
}

/** Document list item — matches mockDocuments item */
export interface DocumentResponse {
  id: string;
  filename: string;
  status: string;
  pages: number;
  uploadDate: string;
  mcqCount: number;
  confidence: number;
  size: string;
  project: string;
}

/** Job list item — matches mockJobs item */
export interface JobResponse {
  id: string;
  documentName: string;
  status: string;
  provider: string;
  duration: string;
  progress: number;
  startedAt: string;
  stages: readonly string[];
  currentStage: number;
}

/** Provider list item — matches mockProviders item */
export interface ProviderResponse {
  id: string;
  name: string;
  provider: string;
  status: string;
  model: string;
  accuracy: number;
  avgLatency: string;
  costPerRecord: number;
  totalCost: number;
  errorRate: number;
}

/** Review queue item — matches mockReviewQueue item */
export interface ReviewQueueItemResponse {
  id: string;
  question: string;
  confidence: number;
  status: string;
  document: string;
  reviewer: string | null;
  flags: number;
}

/** Review detail — matches mockReviewDetails item */
export interface ReviewDetailResponse {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  confidence: number;
  confidenceBreakdown: number[];
  status: string;
  document: string;
  page: number;
  sourceExcerpt: string;
  pageContent: string;
  difficulty: 'easy' | 'medium' | 'hard';
  tags: string[];
  reviewer: string | null;
}

/** MCQ record card — matches mockMcqs item in McqRecords.tsx */
export interface MCQCardResponse {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  confidence: number;
  difficulty: 'easy' | 'medium' | 'hard';
  tags: string[];
  document: string;
  page: number;
}

/** User list item — matches mockUsers item */
export interface UserResponse {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  lastActive: string;
  initials: string;
}

/** Audit log entry — matches mockLogs item */
export interface AuditLogResponse {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  resource: string;
  details: string;
  category: string;
}

/** Analytics time series data point — matches mockAnalyticsTimeSeries */
export interface AnalyticsTimeSeriesPoint {
  date: string;
  mcqCount: number;
  cost: number;
  confidence: number;
}

/** Confidence distribution bucket — matches mockConfidenceDistribution */
export interface ConfidenceDistributionBucket {
  range: string;
  count: number;
  fill: string;
}

/** Provider comparison — matches mockProviderComparison */
export interface ProviderComparisonData {
  provider: string;
  accuracy: number;
  speed: number;
  costEfficiency: number;
}

/** Processing time trend — matches mockProcessingTimeTrend */
export interface ProcessingTimeTrendPoint {
  date: string;
  avgDuration: number;
  p95Duration: number;
}

/** Cost breakdown by provider — matches mockCostBreakdown */
export interface CostBreakdownData {
  week: string;
  [providerName: string]: string | number;
}

/** Export history item — matches initialExports in ExportCenter */
export interface ExportHistoryItem {
  id: string;
  name: string;
  format: string;
  records: number;
  size: string;
  date: string;
  status: string;
}

/** Notification item — matches NotificationDropdown data */
export interface NotificationResponse {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  createdAt: string;
}

/** Search result item — for CommandPalette */
export interface SearchResultItem {
  id: string;
  type: 'document' | 'job' | 'project' | 'mcq' | 'review' | 'user';
  name: string;
  status: string;
  metadata: string;
  url: string;
}

/** Review navigation */
export interface ReviewNavigationResponse {
  previousId: string | null;
  nextId: string | null;
  hasPrevious: boolean;
  hasNext: boolean;
  currentIndex: number;
  totalCount: number;
}

/** Workspace usage */
export interface WorkspaceUsageResponse {
  documentsUsed: number;
  documentsLimit: number;
  apiCallsUsed: number;
  apiCallsLimit: number;
}

// ──────────────────────────────────────────────
// Zod Request Schemas
// ──────────────────────────────────────────────

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(12),
  name: z.string().min(1).max(100),
  workspaceName: z.string().min(1).max(100),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(12),
});

export const createProjectSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
});

export const updateProjectSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional(),
  status: z.enum(['active', 'paused', 'archived']).optional(),
});

export const inviteUserSchema = z.object({
  email: z.string().email(),
  role: z.enum(['workspace_admin', 'operator', 'reviewer', 'analyst', 'api_user']),
});

export const updateUserSchema = z.object({
  role: z.enum(['workspace_admin', 'operator', 'reviewer', 'analyst', 'api_user']).optional(),
  status: z.enum(['active', 'inactive']).optional(),
  name: z.string().min(1).max(100).optional(),
});

/** Allowed MIME types for document upload */
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/tiff',
  'image/webp',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
] as const;

/** Max file size: 50 MB */
const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024;

/** Sanitize filename: strip path traversal, null bytes, and control characters */
function sanitizeFilename(name: string): string {
  return name
    .replace(/[\x00-\x1f]/g, '')         // strip control characters
    .replace(/\.\./g, '')                 // strip path traversal
    .replace(/[\/\\]/g, '')              // strip path separators
    .trim();
}

export const presignUploadSchema = z.object({
  filename: z.string().min(1).max(255).transform(sanitizeFilename).pipe(z.string().min(1, 'Invalid filename')),
  contentType: z.enum(ALLOWED_MIME_TYPES, {
    errorMap: () => ({ message: `File type not supported. Allowed: ${ALLOWED_MIME_TYPES.join(', ')}` }),
  }),
  fileSize: z.number().positive().max(MAX_FILE_SIZE_BYTES, `File size must not exceed ${MAX_FILE_SIZE_BYTES / 1024 / 1024} MB`),
  projectId: z.string().uuid(),
});

export const completeUploadSchema = z.object({
  uploadId: z.string().uuid(),
  s3Key: z.string().min(1),
  checksumSha256: z.string().optional(),
});

export const createJobSchema = z.object({
  documentIds: z.array(z.string().uuid()).min(1),
  projectId: z.string().uuid(),
  extractionProfile: z.record(z.unknown()).optional(),
});

export const createProviderSchema = z.object({
  displayName: z.string().min(1).max(100),
  category: z.enum(['ocr', 'llm', 'vlm', 'embedding', 'parser']),
  providerType: z.enum([
    'openai',
    'anthropic',
    'google',
    'mistral',
    'qwen_vl',
    'glm_ocr',
    'deepseek',
    'tesseract',
  ]),
  apiKey: z.string().min(1),
  models: z.array(z.string()).min(1),
  config: z.record(z.unknown()).optional(),
});

export const updateProviderSchema = z.object({
  displayName: z.string().min(1).max(100).optional(),
  apiKey: z.string().min(1).optional(),
  models: z.array(z.string()).min(1).optional(),
  config: z.record(z.unknown()).optional(),
  isEnabled: z.boolean().optional(),
});

export const createExportSchema = z.object({
  format: z.enum(['json', 'jsonl', 'csv', 'qti_2_1', 'scorm_2004', 'xapi']),
  projectId: z.string().uuid(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  minConfidence: z.number().min(0).max(100).optional(),
  status: z.enum(['approved', 'all_clean']).optional(),
});

export const updateMcqRecordSchema = z.object({
  questionText: z.string().min(1).optional(),
  options: z
    .array(
      z.object({
        label: z.string(),
        text: z.string(),
      }),
    )
    .optional(),
  correctAnswer: z.string().optional(),
  explanation: z.string().optional(),
  difficulty: z.string().optional(),
  tags: z.array(z.string()).optional(),
  version: z.number().int().positive(),
});

export const reviewEditSchema = z.object({
  question: z.string().optional(),
  options: z.array(z.string()).optional(),
  correctIndex: z.number().int().min(0).optional(),
  explanation: z.string().optional(),
  difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
  tags: z.array(z.string()).optional(),
  reviewerNotes: z.string().optional(),
});

export const reviewFlagSchema = z.object({
  reason: z.string().min(1),
  notes: z.string().optional(),
});

export const reviewBulkSchema = z.object({
  ids: z.array(z.string().uuid()).min(1),
  action: z.enum(['approve', 'reject', 'flag']),
  reason: z.string().optional(),
});

export const updateWorkspaceSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  maxFileSizeMb: z.number().min(1).max(500).optional(),
  autoApproveThreshold: z.number().min(0).max(100).nullable().optional(),
  emailNotifications: z.boolean().optional(),
  webhookUrl: z.string().url().nullable().optional(),
});

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(25),
});

export const searchQuerySchema = z.object({
  q: z.string().min(1).max(200),
});

export const dateRangeSchema = z.object({
  range: z.enum(['7d', '30d', '90d', 'custom']).default('30d'),
  from: z.string().optional(),
  to: z.string().optional(),
});
