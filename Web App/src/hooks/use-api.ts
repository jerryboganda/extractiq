import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { toast } from 'sonner';

// ──────────────────────────────────────────
// Dashboard
// ──────────────────────────────────────────

export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: () => api.get<{ data: any }>('/dashboard/stats'),
    select: (res) => res.data,
  });
}

export function useDashboardSparklines() {
  return useQuery({
    queryKey: ['dashboard', 'sparklines'],
    queryFn: () => api.get<{ data: any }>('/dashboard/sparklines'),
    select: (res) => res.data,
  });
}

export function useActiveJobs() {
  return useQuery({
    queryKey: ['dashboard', 'active-jobs'],
    queryFn: () => api.get<{ data: any[] }>('/dashboard/active-jobs'),
    select: (res) => res.data,
    refetchInterval: 5000,
  });
}

export function useRecentActivity() {
  return useQuery({
    queryKey: ['dashboard', 'recent-activity'],
    queryFn: () => api.get<{ data: any[] }>('/dashboard/recent-activity'),
    select: (res) => res.data,
  });
}

export function useProviderHealth() {
  return useQuery({
    queryKey: ['dashboard', 'provider-health'],
    queryFn: () => api.get<{ data: any[] }>('/dashboard/provider-health'),
    select: (res) => res.data,
  });
}

// ──────────────────────────────────────────
// Projects
// ──────────────────────────────────────────

export function useProjects(params?: { page?: number; limit?: number; search?: string }) {
  const p = params || {};
  const query = new URLSearchParams();
  if (p.page) query.set('page', String(p.page));
  if (p.limit) query.set('limit', String(p.limit));
  if (p.search) query.set('search', p.search);

  return useQuery({
    queryKey: ['projects', p],
    queryFn: () => api.get<{ data: { items: any[]; total: number; page: number; limit: number; totalPages: number } }>(`/projects?${query}`),
    select: (res) => res.data,
  });
}

export function useCreateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; description?: string }) => api.post('/projects', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Project created');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useUpdateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; name?: string; description?: string; status?: string }) =>
      api.patch(`/projects/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Project updated');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useDeleteProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/projects/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Project deleted');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

// ──────────────────────────────────────────
// Documents
// ──────────────────────────────────────────

export function useDocuments(params?: { page?: number; limit?: number; status?: string; projectId?: string }) {
  const p = params || {};
  const query = new URLSearchParams();
  if (p.page) query.set('page', String(p.page));
  if (p.limit) query.set('limit', String(p.limit));
  if (p.status) query.set('status', p.status);
  if (p.projectId) query.set('projectId', p.projectId);

  return useQuery({
    queryKey: ['documents', p],
    queryFn: () => api.get<{ data: { items: any[]; total: number; page: number; limit: number; totalPages: number } }>(`/documents?${query}`),
    select: (res) => res.data,
  });
}

export function usePresignUpload() {
  return useMutation({
    mutationFn: (data: { filename: string; contentType: string; fileSize: number; projectId: string }) =>
      api.post<{ data: { uploadUrl: string; documentId: string; s3Key: string; expiresIn: number } }>('/documents/presign', data),
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useCompleteUpload() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { uploadId: string; s3Key: string; checksumSha256?: string }) =>
      api.post('/documents/complete', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['documents'] });
      toast.success('Upload completed');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useDeleteDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/documents/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['documents'] });
      toast.success('Document deleted');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

// ──────────────────────────────────────────
// Jobs
// ──────────────────────────────────────────

export function useJobs(params?: { page?: number; limit?: number; status?: string }) {
  const p = params || {};
  const query = new URLSearchParams();
  if (p.page) query.set('page', String(p.page));
  if (p.limit) query.set('limit', String(p.limit));
  if (p.status) query.set('status', p.status);

  return useQuery({
    queryKey: ['jobs', p],
    queryFn: () => api.get<{ data: { items: any[]; total: number; page: number; limit: number; totalPages: number } }>(`/jobs?${query}`),
    select: (res) => res.data,
  });
}

export function useJob(id: string) {
  return useQuery({
    queryKey: ['jobs', id],
    queryFn: () => api.get<{ data: any }>(`/jobs/${id}`),
    select: (res) => res.data,
    enabled: !!id,
  });
}

export function useCreateJob() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { documentIds: string[]; projectId: string; extractionProfile?: Record<string, unknown> }) =>
      api.post('/jobs', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['jobs'] });
      toast.success('Job created');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useCancelJob() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post(`/jobs/${id}/cancel`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['jobs'] });
      toast.success('Job cancelled');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useRetryJob() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post(`/jobs/${id}/retry`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['jobs'] });
      toast.success('Job retried');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

// ──────────────────────────────────────────
// MCQ Records
// ──────────────────────────────────────────

export function useMcqRecords(params?: { page?: number; limit?: number; status?: string; confidence?: string; projectId?: string }) {
  const p = params || {};
  const query = new URLSearchParams();
  if (p.page) query.set('page', String(p.page));
  if (p.limit) query.set('limit', String(p.limit));
  if (p.status) query.set('status', p.status);
  if (p.confidence) query.set('confidence', p.confidence);
  if (p.projectId) query.set('projectId', p.projectId);

  return useQuery({
    queryKey: ['mcq-records', p],
    queryFn: () => api.get<{ data: { items: any[]; total: number; page: number; limit: number; totalPages: number } }>(`/mcq?${query}`),
    select: (res) => res.data,
  });
}

export function useUpdateMcqRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; [key: string]: any }) =>
      api.patch(`/mcq/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['mcq-records'] });
      toast.success('MCQ record updated');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

// ──────────────────────────────────────────
// Review
// ──────────────────────────────────────────

export function useReviewQueue(params?: { page?: number; limit?: number; status?: string }) {
  const p = params || {};
  const query = new URLSearchParams();
  if (p.page) query.set('page', String(p.page));
  if (p.limit) query.set('limit', String(p.limit));
  if (p.status) query.set('status', p.status);

  return useQuery({
    queryKey: ['review', 'queue', p],
    queryFn: () => api.get<{ data: any }>(`/review/queue?${query}`),
    select: (res) => res.data,
  });
}

export function useReviewDetail(id: string) {
  return useQuery({
    queryKey: ['review', id],
    queryFn: () => api.get<{ data: any }>(`/review/${id}`),
    select: (res) => res.data,
    enabled: !!id,
  });
}

export function useReviewNavigation(id: string) {
  return useQuery({
    queryKey: ['review', id, 'navigation'],
    queryFn: () => api.get<{ data: any }>(`/review/${id}/navigation`),
    select: (res) => res.data,
    enabled: !!id,
  });
}

export function useApproveReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; notes?: string }) =>
      api.post(`/review/${id}/approve`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['review'] });
      toast.success('Review approved');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useRejectReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; reason?: string }) =>
      api.post(`/review/${id}/reject`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['review'] });
      toast.success('Review rejected');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useFlagReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; reason?: string }) =>
      api.post(`/review/${id}/flag`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['review'] });
      toast.success('Review flagged');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useEditReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; [key: string]: any }) =>
      api.patch(`/review/${id}/edit`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['review'] });
      toast.success('Review updated');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useBulkReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { ids: string[]; action: 'approve' | 'reject' | 'flag'; reason?: string }) =>
      api.post('/review/bulk', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['review'] });
      toast.success('Bulk review completed');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

// ──────────────────────────────────────────
// Analytics
// ──────────────────────────────────────────

export function useAnalyticsTimeSeries(params?: { days?: number }) {
  const query = new URLSearchParams();
  if (params?.days) query.set('days', String(params.days));

  return useQuery({
    queryKey: ['analytics', 'time-series', params],
    queryFn: () => api.get<{ data: any[] }>(`/analytics/time-series?${query}`),
    select: (res) => res.data,
  });
}

export function useConfidenceDistribution() {
  return useQuery({
    queryKey: ['analytics', 'confidence-distribution'],
    queryFn: () => api.get<{ data: any[] }>('/analytics/confidence-distribution'),
    select: (res) => res.data,
  });
}

export function useProviderComparison() {
  return useQuery({
    queryKey: ['analytics', 'provider-comparison'],
    queryFn: () => api.get<{ data: any[] }>('/analytics/provider-comparison'),
    select: (res) => res.data,
  });
}

export function useProcessingTimeTrend() {
  return useQuery({
    queryKey: ['analytics', 'processing-time'],
    queryFn: () => api.get<{ data: any[] }>('/analytics/processing-time'),
    select: (res) => res.data,
  });
}

export function useCostBreakdown() {
  return useQuery({
    queryKey: ['analytics', 'cost-breakdown'],
    queryFn: () => api.get<{ data: any[] }>('/analytics/cost-breakdown'),
    select: (res) => res.data,
  });
}

export function useAnalyticsSummary() {
  return useQuery({
    queryKey: ['analytics', 'summary'],
    queryFn: () => api.get<{ data: any }>('/analytics/summary'),
    select: (res) => res.data,
  });
}

// ──────────────────────────────────────────
// Export
// ──────────────────────────────────────────

export function useExports(params?: { page?: number; limit?: number }) {
  const p = params || {};
  const query = new URLSearchParams();
  if (p.page) query.set('page', String(p.page));
  if (p.limit) query.set('limit', String(p.limit));

  return useQuery({
    queryKey: ['exports', p],
    queryFn: () => api.get<{ data: any }>(`/export?${query}`),
    select: (res) => res.data,
  });
}

export function useCreateExport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { format: string; projectId: string; dateFrom?: string; dateTo?: string; minConfidence?: number; status?: string }) =>
      api.post('/export', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['exports'] });
      toast.success('Export started');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useDownloadExport() {
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.get<{ data: { downloadUrl: string } }>(`/export/${id}/download`);
      window.open(res.data.downloadUrl, '_blank');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

// ──────────────────────────────────────────
// Providers
// ──────────────────────────────────────────

export function useProviders() {
  return useQuery({
    queryKey: ['providers'],
    queryFn: () => api.get<{ data: any[] }>('/providers'),
    select: (res) => res.data,
  });
}

export function useCreateProvider() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { displayName: string; category: string; providerType: string; apiKey: string; models: string[]; config?: Record<string, unknown> }) =>
      api.post('/providers', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['providers'] });
      toast.success('Provider created');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useUpdateProvider() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; [key: string]: any }) =>
      api.patch(`/providers/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['providers'] });
      toast.success('Provider updated');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useDeleteProvider() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/providers/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['providers'] });
      toast.success('Provider deleted');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useTestProvider() {
  return useMutation({
    mutationFn: (id: string) => api.post<{ data: any }>(`/providers/${id}/test`),
    onSuccess: () => toast.success('Provider test passed'),
    onError: (err: Error) => toast.error(err.message),
  });
}

// ──────────────────────────────────────────
// Users
// ──────────────────────────────────────────

export function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: () => api.get<{ data: any[] }>('/users'),
    select: (res) => res.data,
  });
}

export function useInviteUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { email: string; role: string }) => api.post('/users/invite', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
      toast.success('User invited');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useUpdateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; role?: string; status?: string; name?: string }) =>
      api.patch(`/users/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
      toast.success('User updated');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useDeleteUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/users/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
      toast.success('User removed');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

// ──────────────────────────────────────────
// Workspace
// ──────────────────────────────────────────

export function useWorkspace() {
  return useQuery({
    queryKey: ['workspace'],
    queryFn: () => api.get<{ data: any }>('/workspace'),
    select: (res) => res.data,
  });
}

export function useUpdateWorkspace() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => api.patch('/workspace', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['workspace'] });
      toast.success('Settings updated');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useWorkspaceUsage() {
  return useQuery({
    queryKey: ['workspace', 'usage'],
    queryFn: () => api.get<{ data: any }>('/workspace/usage'),
    select: (res) => res.data,
  });
}

// ──────────────────────────────────────────
// Audit Logs
// ──────────────────────────────────────────

export function useAuditLogs(params?: { page?: number; limit?: number; action?: string; actorId?: string }) {
  const p = params || {};
  const query = new URLSearchParams();
  if (p.page) query.set('page', String(p.page));
  if (p.limit) query.set('limit', String(p.limit));
  if (p.action) query.set('action', p.action);
  if (p.actorId) query.set('actorId', p.actorId);

  return useQuery({
    queryKey: ['audit-logs', p],
    queryFn: () => api.get<{ data: any }>(`/audit?${query}`),
    select: (res) => res.data,
  });
}

// ──────────────────────────────────────────
// Notifications
// ──────────────────────────────────────────

export function useNotifications() {
  return useQuery({
    queryKey: ['notifications'],
    queryFn: () => api.get<{ data: any[] }>('/notifications'),
    select: (res) => res.data,
    refetchInterval: 30_000,
  });
}

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.patch(`/notifications/${id}/read`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });
}

export function useMarkAllNotificationsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.post('/notifications/read-all'),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });
}

// ──────────────────────────────────────────
// Search
// ──────────────────────────────────────────

export function useSearch(query: string) {
  return useQuery({
    queryKey: ['search', query],
    queryFn: () => api.get<{ data: any[] }>(`/search?q=${encodeURIComponent(query)}`),
    select: (res) => res.data,
    enabled: query.length >= 2,
  });
}
