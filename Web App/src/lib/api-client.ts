const API_BASE = import.meta.env.VITE_API_URL || '/api/v1';

interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const { body, headers: customHeaders, ...rest } = options;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...customHeaders as Record<string, string>,
    };

    const res = await fetch(`${this.baseUrl}${path}`, {
      credentials: 'include',
      ...rest,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({ error: { message: res.statusText } }));
      throw new ApiError(res.status, error.error?.code || 'UNKNOWN', error.error?.message || res.statusText);
    }

    return res.json();
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
