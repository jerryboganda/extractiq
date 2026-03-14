import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/lib/api-client";
import type {
  ActiveJobItem,
  ActivityItem,
  AnalyticsSummary,
  AnalyticsTimeSeriesPoint,
  ApiEnvelope,
  AuditLogItem,
  AuthUser,
  ConfidenceDistributionBucket,
  CostBreakdownPoint,
  DashboardSparkline,
  DashboardStats,
  DocumentListItem,
  ExportDownloadData,
  ExportJobItem,
  InvitationDetail,
  JobListItem,
  McqOption,
  McqRecordItem,
  NotificationItem,
  PaginatedData,
  ProcessingTimePoint,
  ProjectListItem,
  ProviderComparisonPoint,
  ProviderHealthItem,
  ProviderItem,
  ProviderTestResult,
  ReviewDetail,
  ReviewNavigation,
  ReviewQueueItem,
  SearchResultItem,
  UserItem,
  WorkspaceData,
  WorkspaceUsage,
  PresignedUploadData,
} from "@/lib/api-types";

type IdentifierPayload = { id: string } & Record<string, unknown>;

interface RawMcqRecord {
  id: string;
  questionText: string;
  options: McqOption[] | null;
  correctAnswer?: string | null;
  explanation?: string | null;
  confidence?: number | null;
  difficulty?: string | null;
  flags?: string[] | null;
  sourcePage?: number | null;
  version?: number;
}

interface RawProvider {
  id: string;
  displayName: string;
  providerType: string;
  healthStatus: string;
  models?: string[] | null;
  accuracy?: number | null;
  avgLatency?: string | null;
  costPerRecord?: number | null;
  errorRate?: number | null;
  totalCost?: number | null;
  category?: string;
  isEnabled?: boolean;
  isDefault?: boolean;
}

interface RawAnalyticsSummary {
  totalMcqRecords?: number;
  averageConfidence?: number;
  totalCostUsd?: number;
  rejectionRate?: number;
  extractionsChange?: string;
  confidenceChange?: string;
  costChange?: string;
  rejectionChange?: string;
}

interface RawWorkspace {
  id: string;
  name: string;
  slug: string;
  plan: string;
  settings?: Record<string, unknown>;
  maxFileSizeMb: number;
  autoApproveThreshold?: number | null;
}

interface RawAuditLog {
  id: string;
  createdAt: string;
  actor?: string;
  action: string;
  resourceType?: string;
  resourceId?: string | null;
  details?: Record<string, unknown> | string | null;
}

function mapRoleLabel(role: string) {
  const labels: Record<string, string> = {
    workspace_admin: "Admin",
    reviewer: "Reviewer",
    analyst: "Analyst",
    operator: "Operator",
    api_user: "API User",
    super_admin: "Super Admin",
  };

  return labels[role] ?? role;
}

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")
    .slice(0, 2);
}

function formatRelativeTime(value?: string | null) {
  if (!value) return "Never";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

function mapMcqRecord(record: RawMcqRecord): McqRecordItem {
  const options = Array.isArray(record.options) ? record.options : [];
  const correct = options.findIndex((option) => option.label === record.correctAnswer);

  return {
    id: record.id,
    question: record.questionText,
    options: options.map((option) => option.text),
    correct,
    explanation: record.explanation ?? null,
    confidence: Math.round((record.confidence ?? 0) * 100),
    difficulty: (record.difficulty ?? "medium").replace(/^./, (value) => value.toUpperCase()),
    tags: Array.isArray(record.flags) ? record.flags : [],
    document: r.documentId ?? "",
    page: record.sourcePage ?? 0,
    version: record.version,
  };
}

function mapProvider(provider: RawProvider): ProviderItem {
  return {
    id: provider.id,
    name: provider.displayName,
    provider: provider.providerType,
    status: provider.healthStatus,
    model: provider.models?.[0] ?? "n/a",
    accuracy: Math.round((provider.accuracy ?? 0) * 100),
    avgLatency: provider.avgLatency ?? "n/a",
    costPerRecord: provider.costPerRecord ?? 0,
    totalCost: provider.totalCost ?? 0,
    errorRate: Math.round((provider.errorRate ?? 0) * 100),
    category: provider.category,
    isEnabled: provider.isEnabled,
    isDefault: provider.isDefault,
  };
}

function mapWorkspace(workspace: RawWorkspace): WorkspaceData {
  const settings = workspace.settings ?? {};

  return {
    ...workspace,
    settings,
    description: typeof settings.description === "string" ? settings.description : "",
    apiKey: typeof settings.apiKey === "string" ? settings.apiKey : "",
  };
}

function mapAuditLog(log: RawAuditLog): AuditLogItem {
  return {
    id: log.id,
    timestamp: log.createdAt,
    actor: log.actor ?? "System",
    action: log.action,
    resource: [log.resourceType, log.resourceId].filter(Boolean).join(" "),
    details: typeof log.details === "string" ? log.details : JSON.stringify(log.details ?? {}),
    category: log.action.split(".")[0] ?? "system",
  };
}

// Dashboard
export function useDashboardStats() {
  return useQuery({
    queryKey: ["dashboard", "stats"],
    queryFn: () => api.get<ApiEnvelope<DashboardStats>>("/dashboard/stats"),
    select: (response) => response.data,
  });
}

export function useDashboardSparklines() {
  return useQuery({
    queryKey: ["dashboard", "sparklines"],
    queryFn: () => api.get<ApiEnvelope<DashboardSparkline>>("/dashboard/sparklines"),
    select: (response) => response.data,
  });
}

export function useActiveJobs() {
  return useQuery({
    queryKey: ["dashboard", "active-jobs"],
    queryFn: () => api.get<ApiEnvelope<ActiveJobItem[]>>("/dashboard/active-jobs"),
    select: (response) => response.data,
    refetchInterval: 5000,
  });
}

export function useRecentActivity() {
  return useQuery({
    queryKey: ["dashboard", "recent-activity"],
    queryFn: () => api.get<ApiEnvelope<ActivityItem[]>>("/dashboard/recent-activity"),
    select: (response) => response.data,
  });
}

export function useProviderHealth() {
  return useQuery({
    queryKey: ["dashboard", "provider-health"],
    queryFn: () => api.get<ApiEnvelope<ProviderHealthItem[]>>("/dashboard/provider-health"),
    select: (response) => response.data,
  });
}

export function useInvitation(token: string) {
  return useQuery({
    queryKey: ["auth", "invitation", token],
    queryFn: () => api.get<ApiEnvelope<InvitationDetail>>(`/auth/invitations/${token}`),
    select: (response) => response.data,
    enabled: Boolean(token),
    retry: false,
  });
}

export function useAcceptInvitation() {
  return useMutation({
    mutationFn: (data: { token: string; name: string; password: string }) =>
      api.post<ApiEnvelope<{ user: AuthUser; token: string }>>("/auth/accept-invitation", data),
    onError: (error: Error) => toast.error(error.message),
  });
}

// Projects
export function useProjects(params?: { page?: number; limit?: number; search?: string }) {
  const query = new URLSearchParams();
  if (params?.page) query.set("page", String(params.page));
  if (params?.limit) query.set("limit", String(params.limit));
  if (params?.search) query.set("search", params.search);

  return useQuery({
    queryKey: ["projects", params ?? {}],
    queryFn: () => api.get<ApiEnvelope<PaginatedData<ProjectListItem>>>(`/projects?${query}`),
    select: (response) => ({
      ...response.data,
      items: response.data.items.map((project) => ({
        ...project,
        lastActivity: project.createdAt ? new Date(project.createdAt).toLocaleDateString() : "Recently updated",
      })),
    }),
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; description?: string }) => api.post("/projects", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast.success("Project created");
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useUpdateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: IdentifierPayload) => api.patch(`/projects/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast.success("Project updated");
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/projects/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast.success("Project deleted");
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

// Documents
export function useDocuments(params?: { page?: number; limit?: number; status?: string; projectId?: string }) {
  const query = new URLSearchParams();
  if (params?.page) query.set("page", String(params.page));
  if (params?.limit) query.set("limit", String(params.limit));
  if (params?.status) query.set("status", params.status);
  if (params?.projectId) query.set("projectId", params.projectId);

  return useQuery({
    queryKey: ["documents", params ?? {}],
    queryFn: () => api.get<ApiEnvelope<PaginatedData<DocumentListItem>>>(`/documents?${query}`),
    select: (response) => response.data,
  });
}

export function usePresignUpload() {
  return useMutation({
    mutationFn: (data: { filename: string; contentType: string; fileSize: number; projectId: string }) =>
      api.post<ApiEnvelope<PresignedUploadData>>("/documents/presign", data),
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useCompleteUpload() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { uploadId: string; s3Key: string; checksumSha256?: string }) =>
      api.post("/documents/complete", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      toast.success("Upload completed");
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useDeleteDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/documents/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      toast.success("Document deleted");
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

// Jobs
export function useJobs(params?: { page?: number; limit?: number; status?: string }) {
  const query = new URLSearchParams();
  if (params?.page) query.set("page", String(params.page));
  if (params?.limit) query.set("limit", String(params.limit));
  if (params?.status) query.set("status", params.status);

  return useQuery({
    queryKey: ["jobs", params ?? {}],
    queryFn: () => api.get<ApiEnvelope<PaginatedData<JobListItem>>>(`/jobs?${query}`),
    select: (response) => response.data,
  });
}

export function useJob(id: string) {
  return useQuery({
    queryKey: ["jobs", id],
    queryFn: () => api.get<ApiEnvelope<JobListItem & { tasks?: unknown[] }>>(`/jobs/${id}`),
    select: (response) => response.data,
    enabled: Boolean(id),
  });
}

export function useCreateJob() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { documentIds: string[]; projectId: string; extractionProfile?: Record<string, unknown> }) =>
      api.post("/jobs", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      toast.success("Job created");
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useCancelJob() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post(`/jobs/${id}/cancel`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      toast.success("Job cancelled");
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useRetryJob() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post(`/jobs/${id}/retry`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      toast.success("Job retried");
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

// MCQ Records
export function useMcqRecords(params?: { page?: number; limit?: number; status?: string; confidence?: string; projectId?: string }) {
  const query = new URLSearchParams();
  if (params?.page) query.set("page", String(params.page));
  if (params?.limit) query.set("limit", String(params.limit));
  if (params?.status) query.set("status", params.status);
  if (params?.confidence) query.set("confidence", params.confidence);
  if (params?.projectId) query.set("projectId", params.projectId);

  return useQuery({
    queryKey: ["mcq-records", params ?? {}],
    queryFn: () => api.get<ApiEnvelope<PaginatedData<RawMcqRecord>>>(`/mcq?${query}`),
    select: (response) => ({
      ...response.data,
      items: response.data.items.map(mapMcqRecord),
    }),
  });
}

export function useUpdateMcqRecord() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: IdentifierPayload) => api.patch(`/mcq/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mcq-records"] });
      toast.success("MCQ record updated");
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

// Review
export function useReviewQueue(params?: { page?: number; limit?: number; status?: string }) {
  const query = new URLSearchParams();
  if (params?.page) query.set("page", String(params.page));
  if (params?.limit) query.set("limit", String(params.limit));
  if (params?.status) query.set("status", params.status);

  return useQuery({
    queryKey: ["review", "queue", params ?? {}],
    queryFn: () => api.get<ApiEnvelope<PaginatedData<ReviewQueueItem> | ReviewQueueItem[]>>(`/review/queue?${query}`),
    select: (response) => response.data,
  });
}

export function useReviewDetail(id: string) {
  return useQuery({
    queryKey: ["review", id],
    queryFn: () => api.get<ApiEnvelope<ReviewDetail>>(`/review/${id}`),
    select: (response) => ({
      ...response.data,
      confidenceBreakdown: Array.isArray(response.data.confidenceBreakdown)
        ? response.data.confidenceBreakdown.map((value) => (value > 1 ? value / 100 : value))
        : [],
    }),
    enabled: Boolean(id),
  });
}

export function useReviewNavigation(id: string) {
  return useQuery({
    queryKey: ["review", id, "navigation"],
    queryFn: () => api.get<ApiEnvelope<ReviewNavigation>>(`/review/${id}/navigation`),
    select: (response) => response.data,
    enabled: Boolean(id),
  });
}

export function useApproveReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: IdentifierPayload) => api.post(`/review/${id}/approve`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["review"] });
      toast.success("Review approved");
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useRejectReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: IdentifierPayload) => api.post(`/review/${id}/reject`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["review"] });
      toast.success("Review rejected");
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useFlagReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: IdentifierPayload) => api.post(`/review/${id}/flag`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["review"] });
      toast.success("Review flagged");
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useEditReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: IdentifierPayload) => api.patch(`/review/${id}/edit`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["review"] });
      toast.success("Review updated");
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useBulkReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { ids: string[]; action: "approve" | "reject" | "flag"; reason?: string }) =>
      api.post("/review/bulk", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["review"] });
      toast.success("Bulk review completed");
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

// Analytics
export function useAnalyticsTimeSeries(params?: { days?: number }) {
  const query = new URLSearchParams();
  if (params?.days) {
    const range = params.days === 7 ? "7d" : params.days === 90 ? "90d" : "30d";
    query.set("range", range);
  }

  return useQuery({
    queryKey: ["analytics", "time-series", params ?? {}],
    queryFn: () => api.get<ApiEnvelope<AnalyticsTimeSeriesPoint[]>>(`/analytics/time-series?${query}`),
    select: (response) => response.data,
  });
}

export function useConfidenceDistribution() {
  return useQuery({
    queryKey: ["analytics", "confidence-distribution"],
    queryFn: () => api.get<ApiEnvelope<ConfidenceDistributionBucket[]>>("/analytics/confidence-distribution"),
    select: (response) => response.data,
  });
}

export function useProviderComparison() {
  return useQuery({
    queryKey: ["analytics", "provider-comparison"],
    queryFn: () => api.get<ApiEnvelope<ProviderComparisonPoint[]>>("/analytics/provider-comparison"),
    select: (response) => response.data,
  });
}

export function useProcessingTimeTrend() {
  return useQuery({
    queryKey: ["analytics", "processing-time"],
    queryFn: () => api.get<ApiEnvelope<ProcessingTimePoint[]>>("/analytics/processing-time"),
    select: (response) => response.data,
  });
}

export function useCostBreakdown() {
  return useQuery({
    queryKey: ["analytics", "cost-breakdown"],
    queryFn: () => api.get<ApiEnvelope<CostBreakdownPoint[]>>("/analytics/cost-breakdown"),
    select: (response) => response.data,
  });
}

export function useAnalyticsSummary() {
  return useQuery({
    queryKey: ["analytics", "summary"],
    queryFn: () => api.get<ApiEnvelope<RawAnalyticsSummary>>("/analytics/summary"),
    select: (response): AnalyticsSummary => ({
      totalExtractions: response.data.totalMcqRecords ?? 0,
      avgConfidence: response.data.averageConfidence ?? 0,
      totalCost: response.data.totalCostUsd ?? 0,
      rejectionRate: response.data.rejectionRate ?? 0,
      extractionsChange: response.data.extractionsChange ?? "0%",
      confidenceChange: response.data.confidenceChange ?? "0%",
      costChange: response.data.costChange ?? "0%",
      rejectionChange: response.data.rejectionChange ?? "0%",
    }),
  });
}

// Export
export function useExports(params?: { page?: number; limit?: number }) {
  const query = new URLSearchParams();
  if (params?.page) query.set("page", String(params.page));
  if (params?.limit) query.set("limit", String(params.limit));

  return useQuery({
    queryKey: ["exports", params ?? {}],
    queryFn: () => api.get<ApiEnvelope<PaginatedData<ExportJobItem>>>(`/export?${query}`),
    select: (response) => response.data,
  });
}

export function useCreateExport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { format: string; projectId: string; dateFrom?: string; dateTo?: string; minConfidence?: number; status?: string }) =>
      api.post("/export", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exports"] });
      toast.success("Export started");
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useDownloadExport() {
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.get<ApiEnvelope<ExportDownloadData>>(`/export/${id}/download`);
      window.open(response.data.downloadUrl, "_blank", "noopener,noreferrer");
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

// Providers
export function useProviders() {
  return useQuery({
    queryKey: ["providers"],
    queryFn: () => api.get<ApiEnvelope<RawProvider[]>>("/providers"),
    select: (response) => response.data.map(mapProvider),
    refetchInterval: 30_000,
  });
}

export function useCreateProvider() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { displayName: string; category: string; providerType: string; apiKey: string; models: string[]; config?: Record<string, unknown> }) =>
      api.post("/providers", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["providers"] });
      toast.success("Provider created");
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useUpdateProvider() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: IdentifierPayload) => api.patch(`/providers/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["providers"] });
      toast.success("Provider updated");
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useDeleteProvider() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/providers/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["providers"] });
      toast.success("Provider deleted");
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useTestProvider() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post<ApiEnvelope<ProviderTestResult>>(`/providers/${id}/test`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["providers"] });
      toast.success("Provider test passed");
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

// Users
export function useUsers() {
  return useQuery({
    queryKey: ["users"],
    queryFn: () => api.get<ApiEnvelope<UserItem[] | PaginatedData<Omit<UserItem, "roleLabel" | "lastActive">>>>("/users"),
    select: (response) => {
      const items = Array.isArray(response.data) ? response.data : response.data.items;
      return items.map((user) => ({
        ...user,
        roleLabel: mapRoleLabel(user.role),
        lastActive: formatRelativeTime(user.lastActiveAt),
        initials: getInitials(user.name),
      }));
    },
  });
}

export function useInviteUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { email: string; role: string }) => api.post("/users/invite", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("User invited");
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: IdentifierPayload) => api.patch(`/users/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("User updated");
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/users/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("User removed");
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

// Workspace
export function useWorkspace() {
  return useQuery({
    queryKey: ["workspace"],
    queryFn: () => api.get<ApiEnvelope<RawWorkspace>>("/workspace"),
    select: (response) => mapWorkspace(response.data),
  });
}

export function useUpdateWorkspace() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => api.patch("/workspace", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspace"] });
      toast.success("Settings updated");
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useWorkspaceUsage() {
  return useQuery({
    queryKey: ["workspace", "usage"],
    queryFn: () => api.get<ApiEnvelope<WorkspaceUsage>>("/workspace/usage"),
    select: (response) => response.data,
  });
}

// Audit logs
export function useAuditLogs(params?: { page?: number; limit?: number; action?: string; actorId?: string }) {
  const query = new URLSearchParams();
  if (params?.page) query.set("page", String(params.page));
  if (params?.limit) query.set("limit", String(params.limit));
  if (params?.action) query.set("action", params.action);
  if (params?.actorId) query.set("actorId", params.actorId);

  return useQuery({
    queryKey: ["audit-logs", params ?? {}],
    queryFn: () => api.get<ApiEnvelope<PaginatedData<RawAuditLog>>>(`/audit?${query}`),
    select: (response) => ({
      ...response.data,
      items: response.data.items.map(mapAuditLog),
    }),
  });
}

// Notifications
export function useNotifications() {
  return useQuery({
    queryKey: ["notifications"],
    queryFn: () => api.get<ApiEnvelope<NotificationItem[]>>("/notifications"),
    select: (response) => response.data,
    refetchInterval: 30_000,
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.patch(`/notifications/${id}/read`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.post("/notifications/read-all"),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });
}

// Search
export function useSearch(query: string) {
  return useQuery({
    queryKey: ["search", query],
    queryFn: () => api.get<ApiEnvelope<SearchResultItem[]>>(`/search?q=${encodeURIComponent(query)}`),
    select: (response) => response.data,
    enabled: query.length >= 2,
  });
}
