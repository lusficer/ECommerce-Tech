// ===== src/lib/api.ts =====
// Centralized API client with auth headers injected automatically

export const SERVICE_URLS = {
  user:           'http://localhost:8081',
  shop:           'http://localhost:8082',
  product:        'http://localhost:8083',
  order:          'http://localhost:8086',
  cart:           'http://localhost:8088',
  inventory:      'http://localhost:8089',
  recommendation: 'http://localhost:8090',
} as const;

export type ServiceName = keyof typeof SERVICE_URLS;

interface ApiFetchOptions extends RequestInit {
  /** Include userId header (default: true when userId exists in localStorage) */
  withUserId?: boolean;
  /** Custom header key for user ID – some endpoints use 'Vendor_Id' etc. */
  userIdHeader?: string;
}

/**
 * Centralised fetch wrapper.
 * Automatically adds Bearer token and userId headers from localStorage.
 * Throws an Error if the response is not ok (pass `skipThrow: true` to suppress).
 */
export async function apiFetch<T = unknown>(
  service: ServiceName,
  path: string,
  options: ApiFetchOptions = {}
): Promise<T> {
  const {
    withUserId = true,
    userIdHeader = 'userId',
    headers: extraHeaders,
    ...restOptions
  } = options;

  const token =
    (typeof window !== 'undefined' &&
      (localStorage.getItem('accessToken') || localStorage.getItem('token'))) ||
    '';
  const userId =
    (typeof window !== 'undefined' && localStorage.getItem('userId')) || '';

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(extraHeaders as Record<string, string>),
  };

  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (withUserId && userId) headers[userIdHeader] = userId;

  const url = `${SERVICE_URLS[service]}${path}`;
  const response = await fetch(url, { ...restOptions, headers });

  if (!response.ok) {
    let message = `API error ${response.status}`;
    try {
      const body = await response.json();
      message = body.message || body.error || message;
    } catch {}
    throw new Error(message);
  }

  // Return parsed JSON; caller handles empty bodies
  const text = await response.text();
  return text ? (JSON.parse(text) as T) : (undefined as unknown as T);
}

/**
 * Convenience GET helper
 */
export function apiGet<T = unknown>(
  service: ServiceName,
  path: string,
  options?: ApiFetchOptions
) {
  return apiFetch<T>(service, path, { method: 'GET', ...options });
}

/**
 * Convenience POST helper
 */
export function apiPost<T = unknown>(
  service: ServiceName,
  path: string,
  body?: unknown,
  options?: ApiFetchOptions
) {
  return apiFetch<T>(service, path, {
    method: 'POST',
    body: body !== undefined ? JSON.stringify(body) : undefined,
    ...options,
  });
}

/**
 * Convenience PUT helper
 */
export function apiPut<T = unknown>(
  service: ServiceName,
  path: string,
  body?: unknown,
  options?: ApiFetchOptions
) {
  return apiFetch<T>(service, path, {
    method: 'PUT',
    body: body !== undefined ? JSON.stringify(body) : undefined,
    ...options,
  });
}

/**
 * Convenience DELETE helper
 */
export function apiDelete<T = unknown>(
  service: ServiceName,
  path: string,
  body?: unknown,
  options?: ApiFetchOptions
) {
  return apiFetch<T>(service, path, {
    method: 'DELETE',
    body: body !== undefined ? JSON.stringify(body) : undefined,
    ...options,
  });
}
