// Auth helpers with SSR-safe localStorage access

import { apiGet } from '@/lib/api';

export interface AuthData {
  token: string;
  userId: string;
}

// SSR-safe: returns empty auth data when called server-side.
export function getAuth(): AuthData {
  if (typeof window === 'undefined') {
    return { token: '', userId: '' };
  }
  const token =
    localStorage.getItem('accessToken') || localStorage.getItem('token') || '';
  const userId = localStorage.getItem('userId') || '';
  return { token, userId };
}

export function isAuthenticated(): boolean {
  const { token, userId } = getAuth();
  return Boolean(token && userId);
}

export function getStoredRole(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem('role') || '';
}

// Used for role-based routing; returns an empty role on errors.
export async function getUserRole(userId: string): Promise<string> {
  const { token } = getAuth();
  if (!token) return '';
  try {
    const data = await apiGet<any>('user', `/api/account/status/${userId}`, { withUserId: false });
    return data?.role || data?.profile?.role || '';
  } catch {
    return '';
  }
}

export function logout(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('accessToken');
  localStorage.removeItem('token');
  localStorage.removeItem('userId');
  localStorage.removeItem('userName');
  localStorage.removeItem('role');

  // Notify any listeners (e.g., Header/UserMenu) to refresh.
  window.dispatchEvent(new Event('authUpdated'));
  // Also clear cross-page wishlist state.
  window.dispatchEvent(new Event('wishlistUpdated'));
}

