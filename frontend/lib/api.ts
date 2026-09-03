import axios, { AxiosError, AxiosInstance } from 'axios';
import { storeTokens, getStoredTokens, getAccessToken } from './client-tokens';
import { Tokens } from './types';

export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

export const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let refreshing: Promise<Tokens> | null = null;

async function doRefresh(): Promise<Tokens> {
  const stored = getStoredTokens();
  if (!stored) throw new Error('No refresh token');
  const res = await axios.post(`${API_URL}/auth/refresh`, { refreshToken: stored.refreshToken });
  const tokens = res.data.data.tokens as Tokens;
  storeTokens(tokens);
  return tokens;
}

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as (typeof error.config & { _retry?: boolean; retried?: boolean }) | undefined;
    if (!original) return Promise.reject(error);

    const isAuthEndpoint =
      original.url?.includes('/auth/refresh') ||
      original.url?.includes('/auth/login') ||
      original.url?.includes('/auth/register');

    if (error.response?.status === 401 && !original._retry && !isAuthEndpoint) {
      original._retry = true;
      try {
        refreshing ??= doRefresh();
        const tokens = await refreshing;
        refreshing = null;
        original.headers = original.headers ?? {};
        original.headers.Authorization = `Bearer ${tokens.accessToken}`;
        return api(original);
      } catch {
        refreshing = null;
        storeTokens(null);
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    }
    return Promise.reject(error);
  }
);

export function apiErrorMessage(err: unknown, fallback = 'Something went wrong'): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as { message?: string; details?: { field?: string; message?: string }[] } | undefined;
    if (data?.details?.length) {
      return data.details.map((d) => d.message).join('. ');
    }
    if (data?.message) return data.message;
    if (err.code === 'ECONNABORTED') return 'Request timed out';
    if (!err.response) return 'Cannot reach the server. Is the backend running?';
  }
  return fallback;
}