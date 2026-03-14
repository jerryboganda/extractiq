export interface ApiEnvelope<T> {
  data: T;
}

export interface PaginatedData<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
  workspaceId: string;
  status?: string;
  avatarUrl?: string | null;
  lastActiveAt?: string | null;
  createdAt?: string;
}

export interface InvitationDetail {
  email: string;
  role: string;
  workspaceId: string;
  workspaceName: string;
  invitedName: string;
  expiresAt: string;
  accepted: boolean;
  expired: boolean;
  status: "pending" | "accepted" | "expired";
}

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

export interface DashboardSparkline {
  documentsProcessed: number[];
  mcqsExtracted: number[];
  approvalRate: number[];
  activeJobs: number[];
}

export interface ActiveJobItem {
  id: string;
  document: string;
  status: string;
  progress: number;
  provider: string;
  stage: string;
  startedAt: string;
}

export interface ActivityItem {
  id: string;
  action: string;
  target: string;
  user: string;
  time: string;
  type: "upload" | "approve" | "extract" | "flag" | "export" | "settings";
}

export interface ProviderHealthItem {
  name: string;
  status: "healthy" | "degraded" | "offline";
  accuracy: number;
  latency: string;
  lastHealthCheck?: string | null;
}

export interface ProjectListItem {
  id: string;
  name: string;
  description: string | null;
  status: string;
  documentsCount: number;
  mcqCount: number;
  createdAt?: string;
  lastActivity?: string;
  progress?: number;
  members?: number;
}

export interface DocumentListItem {
  id: string;
  filename: string;
  status: string;
  pages: number;
  uploadDate: string;
  mcqCount: number;
  confidence: number;
  size: string;
  project: string;
  projectId: string;
}

export interface PresignedUploadData {
  uploadUrl: string;
  documentId: string;
  s3Key: string;
  expiresIn: number;
}

export interface JobListItem {
  id: string;
  projectId: string;
  status: string;
  progressPercent?: number;
  startedAt?: string | null;
  completedAt?: string | null;
  createdAt?: string;
  totalTasks?: number;
  completedTasks?: number;
  failedTasks?: number;
  documentName: string;
  provider: string;
  duration: string;
  progress: number;
  currentStage: number;
}

export interface McqOption {
  label: string;
  text: string;
}

export interface McqRecordItem {
  id: string;
  question: string;
  options: string[];
  correct: number;
  explanation?: string | null;
  confidence: number;
  difficulty: string;
  tags: string[];
  document: string;
  page: number;
  version?: number;
}

export interface ReviewQueueItem {
  id: string;
  question: string;
  confidence: number;
  status: string;
  document: string;
  reviewer: string | null;
  flags: number;
}

export interface ReviewActionItem {
  id?: string;
  actionType?: string;
  reviewerNotes?: string | null;
  createdAt?: string;
}

export interface ReviewDetail {
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
  difficulty: "easy" | "medium" | "hard";
  tags: string[];
  reviewer: string | null;
  actions?: ReviewActionItem[];
}

export interface ReviewNavigation {
  ids?: string[];
  previousId: string | null;
  nextId: string | null;
  hasPrevious: boolean;
  hasNext: boolean;
  currentIndex: number;
  totalCount: number;
}

export interface AnalyticsTimeSeriesPoint {
  date: string;
  mcqCount: number;
  cost: number;
  confidence: number;
}

export interface ConfidenceDistributionBucket {
  range: string;
  count: number;
  fill: string;
}

export interface ProviderComparisonPoint {
  provider: string;
  accuracy: number;
  speed: number;
  costEfficiency: number;
}

export interface ProcessingTimePoint {
  date: string;
  avgDuration: number;
  p95Duration: number;
}

export interface CostBreakdownPoint {
  week: string;
  [provider: string]: number | string;
}

export interface AnalyticsSummary {
  totalExtractions: number;
  avgConfidence: number;
  totalCost: number;
  rejectionRate: number;
  extractionsChange: string;
  confidenceChange: string;
  costChange: string;
  rejectionChange: string;
}

export interface ExportJobItem {
  id: string;
  format: string;
  projectId: string;
  scope?: Record<string, unknown>;
  status: string;
  createdAt: string;
  completedAt?: string | null;
  totalRecords?: number | null;
  fileSize?: number | null;
}

export interface ExportDownloadData {
  downloadUrl: string;
  filename: string;
  expiresIn: number;
}

export interface ProviderItem {
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
  category?: string;
  isEnabled?: boolean;
  isDefault?: boolean;
}

export interface ProviderTestResult {
  status: string;
  latencyMs: number;
  message: string;
}

export interface UserItem {
  id: string;
  name: string;
  email: string;
  role: string;
  roleLabel: string;
  status: string;
  lastActive: string;
  lastActiveAt?: string | null;
  initials: string;
}

export interface WorkspaceData {
  id: string;
  name: string;
  slug: string;
  plan: string;
  settings: {
    emailNotifications?: boolean;
    webhookUrl?: string | null;
    [key: string]: unknown;
  };
  maxFileSizeMb: number;
  autoApproveThreshold?: number | null;
  description: string;
  apiKey: string;
}

export interface WorkspaceUsage {
  documentsUsed: number;
  documentsLimit: number;
  apiCallsUsed: number;
  apiCallsLimit: number;
}

export interface AuditLogItem {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  resource: string;
  details: string;
  category: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  createdAt: string;
}

export interface SearchResultItem {
  id: string;
  type: "document" | "job" | "project" | "mcq" | "review" | "user";
  name: string;
  status: string;
  metadata: string;
  url: string;
}
