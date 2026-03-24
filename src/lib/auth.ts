// ===== src/lib/auth.ts =====
// Authentication utilities – read/write localStorage safely (SSR-safe)

export interface AuthData {
  token: string;
  userId: string;
}

/**
 * Returns the current auth token and userId from localStorage.
 * Returns null values when called server-side or when not logged in.
 */
export function getAuth(): AuthData {
  if (typeof window === 'undefined') {
    return { token: '', userId: '' };
  }
  const token =
    localStorage.getItem('accessToken') || localStorage.getItem('token') || '';
  const userId = localStorage.getItem('userId') || '';
  return { token, userId };
}

/**
 * Returns true if the user is currently authenticated.
 */
export function isAuthenticated(): boolean {
  const { token, userId } = getAuth();
  return Boolean(token && userId);
}

/**
 * Returns the stored user role from localStorage.
 */
export function getStoredRole(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem('role') || '';
}

/**
 * Fetches the user's role/status from the user service.
 * Used for role-based redirects (VENDOR / MANAGER / SHIPPER / CUSTOMER).
 */
export async function getUserRole(userId: string): Promise<string> {
  const { token } = getAuth();
  if (!token) return '';
  try {
    const res = await fetch(
      `http://localhost:8081/api/account/status/${userId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (!res.ok) return '';
    const data = await res.json();
    return data?.role || data?.profile?.role || '';
  } catch {
    return '';
  }
}

/**
 * Clears all auth data from localStorage.
 */
export function logout(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('accessToken');
  localStorage.removeItem('token');
  localStorage.removeItem('userId');
  localStorage.removeItem('userName');
  localStorage.removeItem('role');
}
