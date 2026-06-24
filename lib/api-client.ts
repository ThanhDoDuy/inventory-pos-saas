import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { API_BASE_URL } from './app-config';

export { API_BASE_URL };

export interface ApiErrorBody {
  errorCode?: number;
  message?: string;
  details?: unknown;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error: ApiErrorBody | null;
  meta: Record<string, unknown>;
}

// Access token only — refresh token lives in an HttpOnly cookie managed by the browser.
const ACCESS_KEY = 'access_token';

export function getStoredAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem(ACCESS_KEY);
}

export function setStoredAccessToken(token: string): void {
  sessionStorage.setItem(ACCESS_KEY, token);
  // Remove the legacy access_token from localStorage — it lives in sessionStorage now.
  // Do NOT remove refresh_token here: it may still be the only way to refresh until
  // the backend deploys HttpOnly-cookie support and the user logs in fresh.
  localStorage.removeItem('access_token');
}

export function clearStoredTokens(): void {
  sessionStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
}

/** @deprecated Use getStoredAccessToken + setStoredAccessToken directly. */
export function getStoredTokens() {
  return {
    accessToken: getStoredAccessToken(),
    // Always null — refresh token is now HttpOnly cookie only.
    refreshToken: null as null,
  };
}

/** @deprecated Auth-store sets access token via setStoredAccessToken. */
export function setStoredTokens(accessToken: string, _refreshToken: string): void {
  setStoredAccessToken(accessToken);
}

export function extractErrorMessage(error: unknown, fallback = 'Request failed'): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as ApiResponse<unknown> | undefined;
    return data?.error?.message || error.message || fallback;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return fallback;
}

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getStoredAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  // Prefer the HttpOnly cookie (set by the backend on login/register/refresh).
  // Fall back to the legacy localStorage refresh_token for sessions that existed
  // before the backend deployed cookie support — this bridges the migration gap.
  const legacyToken =
    typeof window !== 'undefined' ? localStorage.getItem('refresh_token') : null;

  const response = await axios.post<ApiResponse<{ access_token: string }>>(
    `${API_BASE_URL}/auth/refresh-token`,
    legacyToken ? { refresh_token: legacyToken } : {},
    { withCredentials: true },
  );

  const accessToken = response.data.data?.access_token;
  if (accessToken) {
    setStoredAccessToken(accessToken);
    apiClient.defaults.headers.common.Authorization = `Bearer ${accessToken}`;
    return accessToken;
  }
  return null;
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status !== 401 || !original || original._retry) {
      return Promise.reject(error);
    }

    original._retry = true;

    if (!refreshPromise) {
      refreshPromise = refreshAccessToken().finally(() => {
        refreshPromise = null;
      });
    }

    const newToken = await refreshPromise;
    if (!newToken) {
      clearStoredTokens();
      if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
        window.location.href = '/login';
      }
      return Promise.reject(error);
    }

    original.headers.Authorization = `Bearer ${newToken}`;
    return apiClient(original);
  },
);

export async function apiGet<T>(url: string, params?: Record<string, unknown>): Promise<T> {
  const response = await apiClient.get<ApiResponse<T>>(url, { params });
  return response.data.data;
}

export const swrFetcher = <T>(url: string): Promise<T> =>
  apiGet<T>(url.replace(API_BASE_URL, ''));

export async function apiPost<T>(url: string, body?: unknown): Promise<T> {
  const response = await apiClient.post<ApiResponse<T>>(url, body);
  return response.data.data;
}

export async function apiPostForm<T>(
  url: string,
  formData: FormData,
  params?: Record<string, string>,
): Promise<T> {
  const response = await apiClient.post<ApiResponse<T>>(url, formData, {
    params,
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data.data;
}

export async function apiPatch<T>(url: string, body?: unknown): Promise<T> {
  const response = await apiClient.patch<ApiResponse<T>>(url, body);
  return response.data.data;
}

export async function apiDelete<T>(url: string): Promise<T> {
  const response = await apiClient.delete<ApiResponse<T>>(url);
  return response.data.data;
}

export async function downloadFile(
  url: string,
  filename: string,
  params?: Record<string, string>,
) {
  const response = await apiClient.get(url, {
    params,
    responseType: 'blob',
  });

  const blobUrl = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = blobUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(blobUrl);
}
