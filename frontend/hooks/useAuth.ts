'use client';

import { useCallback, useEffect } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { useCartStore } from '@/stores/cart-store';
import { api, apiErrorMessage } from '@/lib/api';
import { getStoredTokens, storeTokens } from '@/lib/client-tokens';
import { AuthResponse, User } from '@/lib/types';

async function mergeGuestCartToServer() {
  const items = useCartStore.getState().items;
  if (!items.length) return;
  for (const item of items) {
    try {
      await api.post('/cart', { productId: item.productId, size: item.size, qty: item.qty });
    } catch {
      /* skip conflicting items */
    }
  }
  useCartStore.getState().clear();
}

export function useAuth() {
  const { user, hydrated, setUser, setHydrated } = useAuthStore();

  const hydrate = useCallback(async () => {
    const tokens = getStoredTokens();
    if (!tokens) {
      setHydrated(true);
      return;
    }
    try {
      const res = await api.get<{ data: { user: User } }>('/auth/me');
      setUser(res.data.data.user);
    } catch {
      storeTokens(null);
      setUser(null);
    } finally {
      setHydrated(true);
    }
  }, [setUser, setHydrated]);

  useEffect(() => {
    if (!hydrated) hydrate();
  }, [hydrated, hydrate]);

  const login = useCallback(
    async (email: string, password: string) => {
      const res = await api.post<{ data: AuthResponse }>('/auth/login', { email, password });
      storeTokens(res.data.data.tokens);
      setUser(res.data.data.user);
      await mergeGuestCartToServer();
      return res.data.data.user;
    },
    [setUser]
  );

  const register = useCallback(
    async (payload: { name: string; email: string; phone: string; password: string }) => {
      const res = await api.post<{ data: AuthResponse }>('/auth/register', payload);
      storeTokens(res.data.data.tokens);
      setUser(res.data.data.user);
      await mergeGuestCartToServer();
      return res.data.data.user;
    },
    [setUser]
  );

  const logout = useCallback(async () => {
    const tokens = getStoredTokens();
    try {
      if (tokens) await api.post('/auth/logout', { refreshToken: tokens.refreshToken });
    } catch {
      /* ignore */
    }
    storeTokens(null);
    setUser(null);
  }, [setUser]);

  return {
    user,
    hydrated,
    isAuthed: !!user,
    login,
    register,
    logout,
    errorMessage: apiErrorMessage,
  };
}