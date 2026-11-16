/**
 * Canonical Typed API Client for Fastify Backend & AI Engine
 */

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  timestamp: string;
  error?: {
    code: string;
    statusCode: number;
    details?: unknown;
  };
}

export class ApiError extends Error {
  readonly status: number
  readonly code?: string
  readonly details?: unknown
  constructor(status: number, message: string, code?: string, details?: unknown) { super(message); this.name = 'ApiError'; this.status = status; this.code = code; this.details = details }
}

export interface ListQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  order?: string;
  direction?: 'asc' | 'desc';
  [filter: string]: unknown;
}

export interface PaginatedResult<T> {
  items: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export class ApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor() {
    // `import.meta` exists in Node ESM test execution, but Vite only injects
    // `env` for browser builds. Optional access keeps this transport boundary
    // importable by the in-process API test harness.
    this.baseUrl = import.meta.env?.VITE_API_URL || 'http://localhost:3000';
    this.token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
  }

  setToken(token: string | null): void {
    this.token = token;
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem('auth_token', token);
      } else {
        localStorage.removeItem('auth_token');
      }
    }
  }

  getToken(): string | null {
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('auth_token');
    }
    return this.token;
  }

  isAuthenticated(): boolean {
    return Boolean(this.getToken());
  }

  auth = {
    requestPasswordReset: async (email: string): Promise<{ accepted: true; expiresAt: string; resetToken?: string }> =>
      this.request('/api/v1/auth/password-reset/request', { method: 'POST', body: JSON.stringify({ email }) }),
    consumePasswordReset: async (token: string, newPassword: string): Promise<{ changed: true }> =>
      this.request('/api/v1/auth/password-reset/consume', { method: 'POST', body: JSON.stringify({ token, newPassword }) }),
    changePassword: async (currentPassword: string, newPassword: string): Promise<{ changed: true }> =>
      this.request('/api/v1/auth/password/change', { method: 'POST', body: JSON.stringify({ currentPassword, newPassword }) }),
    listSessions: async (): Promise<Array<{ id: string; ipAddress: string | null; userAgent: string | null; expiresAt: string; createdAt: string; isCurrent: boolean }>> =>
      this.request('/api/v1/auth/sessions'),
    revokeSession: async (id: string): Promise<{ id: string; revoked: true }> =>
      this.request(`/api/v1/auth/sessions/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  };

  private getHeaders(includeJsonContentType = false): HeadersInit {
    const headers: Record<string, string> = {
      ...(includeJsonContentType ? { 'Content-Type': 'application/json' } : {}),
    };
    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }

  async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
    const res = await fetch(url, {
      ...options,
      headers: {
        ...this.getHeaders(options.body !== undefined),
        ...options.headers,
      },
    });

    if (res.status === 401) {
      this.setToken(null);
      if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('rocksoul:session-expired'));
    }
    let json: Partial<ApiResponse<T>> = {};
    try {
      const body = await res.text();
      if (body) json = JSON.parse(body) as ApiResponse<T>;
    } catch {
      throw new ApiError(res.status, `HTTP Error ${res.status}`);
    }
    if (!res.ok || json.success !== true) {
      throw new ApiError(res.status, json.message || json.error?.code || `HTTP Error ${res.status}`, json.error?.code, json.error?.details);
    }

    return json.data as T;
  }

  // ==========================================
  // Canonical Models CRUD (Odoo-like reflection)
  // ==========================================
  models = {
    list: async <T = Record<string, unknown>>(model: string, params?: ListQueryParams): Promise<PaginatedResult<T>> => {
      const searchParams = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([k, v]) => {
          if (v !== undefined && v !== null && v !== '') {
            searchParams.append(k, String(v));
          }
        });
      }
      const qs = searchParams.toString();
      return this.request<PaginatedResult<T>>(`/api/v1/models/${model}${qs ? `?${qs}` : ''}`);
    },

    get: async <T = Record<string, unknown>>(model: string, id: string): Promise<T> => {
      return this.request<T>(`/api/v1/models/${model}/${id}`);
    },

    create: async <T = Record<string, unknown>>(model: string, data: Record<string, unknown>): Promise<T> => {
      return this.request<T>(`/api/v1/models/${model}`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    update: async <T = Record<string, unknown>>(model: string, id: string, data: Record<string, unknown>): Promise<T> => {
      return this.request<T>(`/api/v1/models/${model}/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
    },

    delete: async (model: string, id: string): Promise<{ id: string; deleted: boolean }> => {
      return this.request<{ id: string; deleted: boolean }>(`/api/v1/models/${model}/${id}`, {
        method: 'DELETE',
      });
    },

    getMetadata: async (model: string): Promise<Record<string, unknown>> => {
      return this.request<Record<string, unknown>>(`/api/v1/models/${model}/metadata`);
    },

    getMenu: async (): Promise<unknown[]> => {
      return this.request<unknown[]>('/api/v1/models/menu');
    },
  };

  // ==========================================
  // AI Engine Endpoints
  // ==========================================
  ai = {
    getAgents: async <T = unknown[]>(): Promise<T> => {
      return this.request<T>('/api/v1/ai/agents');
    },

    chat: async <T = unknown>(payload: {
      prompt: string;
      threadId?: string;
      agentId?: string;
      projectId?: string;
      workspaceId?: string;
      metadata?: Record<string, unknown>;
    }): Promise<T> => {
      return this.request<T>('/api/v1/ai/chat', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },

    startRun: async <T = unknown>(payload: {
      prompt: string;
      threadId?: string;
      agentId?: string;
      projectId?: string;
      workspaceId?: string;
      metadata?: Record<string, unknown>;
    }): Promise<T> => {
      return this.request<T>('/api/v1/ai/runs', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },

    getRun: async <T = unknown>(runId: string): Promise<T> => {
      return this.request<T>(`/api/v1/ai/runs/${runId}`);
    },

    cancelRun: async <T = unknown>(runId: string): Promise<T> => {
      return this.request<T>(`/api/v1/ai/runs/${runId}/cancel`, {
        method: 'POST',
      });
    },
    listWorkspaceFiles: async <T = Array<{ name: string; path: string; kind: string }>>(directory = '.'): Promise<T> => this.request<T>(`/api/v1/ai/coding/files?path=${encodeURIComponent(directory)}`),
    readWorkspaceFile: async <T = { path: string; content: string; size: number }>(filePath: string): Promise<T> => this.request<T>(`/api/v1/ai/coding/file?path=${encodeURIComponent(filePath)}`),
    fetchBrowserPage: async <T = { url: string; status: number; contentType: string | null; body: string }>(url: string): Promise<T> => this.request<T>('/api/v1/ai/browser/fetch', { method: 'POST', body: JSON.stringify({ url }) }),
    listThreads: async <T = unknown[]>(): Promise<T> => this.request<T>('/api/v1/ai/threads'),
    getThreadMessages: async <T = unknown>(threadId: string): Promise<T> => this.request<T>(`/api/v1/ai/threads/${encodeURIComponent(threadId)}/messages`),
  };

  notifications = {
    list: async (limit = 50): Promise<{ items: Array<{ id: string; kind: string; title: string; message: string; href: string | null; readAt: string | null; createdAt: string }>; unread: number }> =>
      this.request(`/api/v1/notifications?limit=${limit}`),
    markRead: async (id: string, read = true): Promise<{ id: string; readAt: string | null }> =>
      this.request(`/api/v1/notifications/${id}`, { method: 'PATCH', body: JSON.stringify({ read }) }),
    markAllRead: async (): Promise<{ readAt: string }> =>
      this.request('/api/v1/notifications/read-all', { method: 'POST', body: JSON.stringify({}) }),
  };

  mail = {
    send: async (payload: { to: string; subject: string; text: string; draft?: boolean }): Promise<{ id: string; folder: string; date: string }> =>
      this.request('/api/v1/mail/send', { method: 'POST', body: JSON.stringify(payload) }),
  };

  organizations = {
    contexts: async (): Promise<Array<{ id: string; name: string; code: string; role: string; current: number }>> =>
      this.request('/api/v1/organizations'),
    switchContext: async (id: string): Promise<{ organizationId: string }> =>
      this.request(`/api/v1/organizations/${id}/switch`, { method: 'POST', body: JSON.stringify({}) }),
  };
}

export const api = new ApiClient();
