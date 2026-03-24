// ===== src/hooks/useAuth.ts =====
// SSR-safe hook that exposes auth data after the component mounts on the client

'use client';

import { useState, useEffect } from 'react';
import { getAuth, isAuthenticated, logout as doLogout } from '@/lib/auth';

export interface UseAuthReturn {
  token: string;
  userId: string;
  isLoggedIn: boolean;
  isMounted: boolean;
  logout: () => void;
}

/**
 * SSR-safe hook to read auth data from localStorage.
 * Always returns empty/false values during SSR and on the first render.
 * Values are populated after hydration (isMounted === true).
 */
export function useAuth(): UseAuthReturn {
  const [isMounted, setIsMounted] = useState(false);
  const [token, setToken] = useState('');
  const [userId, setUserId] = useState('');

  useEffect(() => {
    const { token: t, userId: u } = getAuth();
    setToken(t);
    setUserId(u);
    setIsMounted(true);
  }, []);

  const logout = () => {
    doLogout();
    setToken('');
    setUserId('');
  };

  return {
    token,
    userId,
    isLoggedIn: Boolean(token && userId),
    isMounted,
    logout,
  };
}
