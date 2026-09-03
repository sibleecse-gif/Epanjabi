import { Tokens } from './types';

const ACCESS_KEY = 'aagdoom_access_token';
const REFRESH_KEY = 'aagdoom_refresh_token';

export function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

export function getStoredTokens(): Tokens | null {
  if (!isBrowser()) return null;
  const accessToken = localStorage.getItem(ACCESS_KEY);
  const refreshToken = localStorage.getItem(REFRESH_KEY);
  if (!accessToken || !refreshToken) return null;
  return { accessToken, refreshToken };
}

export function storeTokens(tokens: Tokens | null) {
  if (!isBrowser()) return;
  if (tokens) {
    localStorage.setItem(ACCESS_KEY, tokens.accessToken);
    localStorage.setItem(REFRESH_KEY, tokens.refreshToken);
  } else {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
  }
}

export function getAccessToken(): string | null {
  return isBrowser() ? localStorage.getItem(ACCESS_KEY) : null;
}