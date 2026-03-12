const API_BASE = import.meta.env.VITE_API_URL || '/api/v1';

const REQUEST_TIMEOUT_MS = 30_000;
const MAX_RETRIES = 2;
const RETRY_BASE_MS = 1000;

interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
  /** Skip automatic 401 refresh retry */
  skipAuthRefresh?: boolean;
}

let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

async function attemptRefresh(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    });
    return res.ok;
  } catch {
    return false;
  }
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const { body, headers: customHeaders, skipAuthRefresh, ...rest } = options;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...customHeaders as Record<string, string>,
    };

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        const res = await fetch(`${this.baseUrl}${path}`, {
          credentials: 'include',
          signal: controller.signal,
          ...rest,
          headers,
          body: body ? JSON.stringify(body) : undefined,
        });

        clearTimeout(timeout);

        // Handle 401 — try token refresh once
        if (res.status === 401 && !skipAuthRefresh) {
          if (!isRefreshing) {
            isRefreshing = true;
            refreshPromise = attemptRefresh().finally(() => {
              isRefreshing = false;
              refreshPromise = null;
            });
          }
          const refreshed = await refreshPromise;
          if (refreshed) {
            // Retry the original request once after refresh
            return this.request<T>(path, { ...options, skipAuthRefresh: true });
          }
          // Refresh failed — redirect to login
          window.location.href = `${import.meta.env.BASE_URL || '/'}login`;
          throw new ApiError(401, 'SESSION_EXPIRED', 'Session expired. Please log in again.');
        }

        if (!res.ok) {
          const error = await res.json().catch(() => ({ error: { message: res.statusText } }));
          throw new ApiError(res.status, error.error?.code || 'UNKNOWN', error.error?.message || res.statusText);
        }

        // Handle 204 No Content
        if (res.status === 204) return {} as T;

        return res.json();
      } catch (err) {
        clearTimeout(timeout);
        lastError = err instanceof Error ? err : new Error(String(err));

        // Don't retry on client errors (4xx) or abort
        if (err instanceof ApiError && err.status >= 400 && err.status < 500) throw err;
        if (err instanceof DOMException && err.name === 'AbortError') {
          throw new ApiError(408, 'TIMEOUT', 'Request timed out');
        }

        // Retry on network/server errors with exponential backoff
        if (attempt < MAX_RETRIES) {
          await new Promise(r => setTimeout(r, RETRY_BASE_MS * Math.pow(2, attempt)));
          continue;
        }
      }
    }

    throw lastError || new ApiError(0, 'NETWORK_ERROR', 'Network error');
  }

  get<T>(path: string, options?: RequestOptions) {
    return this.request<T>(path, { ...options, method: 'GET' });
  }

  post<T>(path: string, body?: unknown, options?: RequestOptions) {
    return this.request<T>(path, { ...options, method: 'POST', body });
  }

  put<T>(path: string, body?: unknown, options?: RequestOptions) {
    return this.request<T>(path, { ...options, method: 'PUT', body });
  }

  patch<T>(path: string, body?: unknown, options?: RequestOptions) {
    return this.request<T>(path, { ...options, method: 'PATCH', body });
  }

  delete<T>(path: string, options?: RequestOptions) {
    return this.request<T>(path, { ...options, method: 'DELETE' });
  }
}

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export const api = new ApiClient(API_BASE);
