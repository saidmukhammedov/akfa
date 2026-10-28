import {
  Worker,
  AttendanceRecord,
  PaymentRecord,
  OwnerProfile,
  WorkerCreateInput,
  WorkerUpdateInput,
  AttendanceStatus,
  PaymentMethod,
  WorkerFinanceSummary,
  WorkshopFinanceOverview,
} from '@akfa/shared';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export class ApiError extends Error {
  statusCode: number;
  code?: string;
  issues?: Array<{ field: string; message: string }>;

  constructor(message: string, statusCode: number, code?: string, issues?: any[]) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code;
    this.issues = issues;
  }
}

// Token management in storage
export const tokenStorage = {
  getAccessToken: () => localStorage.getItem('akfa_access_token'),
  getRefreshToken: () => localStorage.getItem('akfa_refresh_token'),
  setTokens: (accessToken: string, refreshToken: string) => {
    localStorage.setItem('akfa_access_token', accessToken);
    localStorage.setItem('akfa_refresh_token', refreshToken);
  },
  clearTokens: () => {
    localStorage.removeItem('akfa_access_token');
    localStorage.removeItem('akfa_refresh_token');
  },
};

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: unknown) => void;
  reject: (reason?: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

async function request<T>(
  endpoint: string,
  options: RequestInit = {},
  isRetry = false
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers = new Headers(options.headers || {});

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const token = tokenStorage.getAccessToken();
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  // Handle Token Expiration and Refresh
  if (response.status === 401 && !isRetry && !endpoint.startsWith('/auth/login') && !endpoint.startsWith('/auth/refresh')) {
    const refreshToken = tokenStorage.getRefreshToken();
    if (refreshToken) {
      if (!isRefreshing) {
        isRefreshing = true;
        try {
          const refreshRes = await fetch(`${API_BASE_URL}/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken }),
          });

          if (!refreshRes.ok) {
            throw new Error('Refresh failed');
          }

          const refreshData = await refreshRes.json();
          tokenStorage.setTokens(refreshData.data.accessToken, refreshData.data.refreshToken);
          processQueue(null, refreshData.data.accessToken);

          return request<T>(endpoint, options, true);
        } catch (refreshErr) {
          processQueue(refreshErr, null);
          tokenStorage.clearTokens();
          window.dispatchEvent(new CustomEvent('akfa:unauthorized'));
          throw new ApiError('Sessiya tugagan. Qayta kiring.', 401);
        } finally {
          isRefreshing = false;
        }
      } else {
        // Wait for current refresh to complete
        return new Promise<T>((resolve, reject) => {
          failedQueue.push({
            resolve: () => resolve(request<T>(endpoint, options, true)),
            reject,
          });
        });
      }
    } else {
      tokenStorage.clearTokens();
      window.dispatchEvent(new CustomEvent('akfa:unauthorized'));
    }
  }

  const contentType = response.headers.get('content-type');
  const data = contentType?.includes('application/json') ? await response.json() : null;

  if (!response.ok) {
    const issueMessages =
      data?.issues && Array.isArray(data.issues) && data.issues.length > 0
        ? data.issues.map((i: any) => i.message).filter(Boolean).join('. ')
        : null;

    const errorMessage =
      issueMessages ||
      data?.error ||
      `So'rov muvaffaqiyatsiz tugadi (${response.status})`;

    throw new ApiError(
      errorMessage,
      response.status,
      data?.code,
      data?.issues
    );
  }

  return data;
}

export const api = {
  auth: {
    status: async () => request<{ success: boolean; isInitialized: boolean }>('/auth/status'),
    setup: async (payload: { username: string; password: string; fullName: string; workshopName?: string; language?: string }) =>
      request<{ success: boolean; data: { accessToken: string; refreshToken: string; owner: OwnerProfile } }>('/auth/setup', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    login: async (username: string, password: string) =>
      request<{ success: boolean; data: { accessToken: string; refreshToken: string; user: OwnerProfile } }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      }),
    refresh: async (refreshToken: string) =>
      request<{ success: boolean; data: { accessToken: string; refreshToken: string; owner: OwnerProfile } }>('/auth/refresh', {
        method: 'POST',
        body: JSON.stringify({ refreshToken }),
      }),
    logout: async () => {
      const refreshToken = tokenStorage.getRefreshToken();
      try {
        await request('/auth/logout', {
          method: 'POST',
          body: JSON.stringify({ refreshToken }),
        });
      } finally {
        tokenStorage.clearTokens();
      }
    },
    getProfile: async () => request<{ success: boolean; data: OwnerProfile }>('/auth/profile'),
    updateProfile: async (payload: {
      fullName?: string;
      workshopName?: string;
      language?: 'uz' | 'ru';
      currentPassword?: string;
      newPassword?: string;
    }) =>
      request<{ success: boolean; data: OwnerProfile; message: string }>('/auth/profile', {
        method: 'PUT',
        body: JSON.stringify(payload),
      }),
  },

  workers: {
    list: async (status?: 'ACTIVE' | 'ARCHIVED') =>
      request<{ success: boolean; data: Worker[] }>(`/workers${status ? `?status=${status}` : ''}`),
    get: async (id: string) => request<{ success: boolean; data: Worker }>(`/workers/${id}`),
    create: async (payload: WorkerCreateInput) =>
      request<{ success: boolean; data: Worker; message: string }>('/workers', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    update: async (id: string, payload: WorkerUpdateInput) =>
      request<{ success: boolean; data: Worker; message: string }>(`/workers/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      }),
    archive: async (id: string) =>
      request<{ success: boolean; data: Worker; message: string }>(`/workers/${id}/archive`, {
        method: 'POST',
      }),
    unarchive: async (id: string) =>
      request<{ success: boolean; data: Worker; message: string }>(`/workers/${id}/unarchive`, {
        method: 'POST',
      }),
    delete: async (id: string) =>
      request<{ success: boolean; message: string }>(`/workers/${id}`, {
        method: 'DELETE',
      }),
    purgeAll: async () =>
      request<{
        success: boolean;
        message: string;
        data: { attendances: number; payments: number; workers: number };
      }>('/workers/all', {
        method: 'DELETE',
      }),
  },

  attendance: {
    getByDate: async (date: string) =>
      request<{
        success: boolean;
        data: {
          date: string;
          totalActiveWorkers: number;
          presentCount: number;
          absentCount: number;
          records: Array<{
            workerId: string;
            workerName: string;
            workerRole: string;
            dailyRate: number;
            status: AttendanceStatus;
            rateSnapshot: number;
            notes: string | null;
            isMarked: boolean;
          }>;
        };
      }>(`/attendance?date=${date}`),
    mark: async (payload: { workerId: string; date: string; status: AttendanceStatus; notes?: string | null }) =>
      request<{ success: boolean; data: AttendanceRecord; message: string }>('/attendance/mark', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    bulkMark: async (payload: {
      date: string;
      records: Array<{ workerId: string; status: AttendanceStatus; notes?: string | null }>;
    }) =>
      request<{ success: boolean; message: string }>('/attendance/bulk', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
  },

  finance: {
    getOverview: async () => request<{ success: boolean; data: WorkshopFinanceOverview }>('/finance/overview'),
    getSummaries: async () => request<{ success: boolean; data: WorkerFinanceSummary[] }>('/finance/summaries'),
    getWorkerDetails: async (workerId: string) =>
      request<{
        success: boolean;
        data: {
          worker: Worker;
          daysWorked: number;
          totalAccruedSalary: number;
          totalPaid: number;
          balanceOwed: number;
          attendances: AttendanceRecord[];
          payments: PaymentRecord[];
        };
      }>(`/finance/workers/${workerId}`),
    recordPayment: async (payload: {
      workerId: string;
      amount: number;
      paymentDate: string;
      paymentMethod: PaymentMethod;
      notes?: string | null;
    }) =>
      request<{ success: boolean; data: PaymentRecord; message: string }>('/finance/payments', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    getPayments: async (limit?: number) =>
      request<{ success: boolean; data: PaymentRecord[] }>(`/finance/payments${limit ? `?limit=${limit}` : ''}`),
  },
};
