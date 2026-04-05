// Centralized API client with auth headers injected automatically

export const SERVICE_URLS = {
  user:           'http://localhost:8081',
  shop:           'http://localhost:8082',
  product:        'http://localhost:8083',
  dispute:        'http://localhost:8084',
  order:          'http://localhost:8086',
  stats:          'http://localhost:8087',
  cart:           'http://localhost:8088',
  inventory:      'http://localhost:8089',
  recommendation: 'http://localhost:8090',
} as const;

export type ServiceName = keyof typeof SERVICE_URLS;

interface ApiFetchOptions extends RequestInit {
  // Include Authorization header when a token exists (default: true)
  withAuth?: boolean;
  // Include userId header (default: true when userId exists in localStorage)
  withUserId?: boolean;
  // Custom header key for user ID; some endpoints use 'Vendor_Id'.
  userIdHeader?: string;
}

export type ValidationErrors = Record<string, string>;

export interface BackendErrorResponse {
  timestamp?: string;
  status?: number;
  error?: string;
  message?: string;
  errors?: ValidationErrors;
}

export class ApiError extends Error {
  status: number;
  error: string;
  timestamp?: string;
  errors?: ValidationErrors;
  url?: string;

  constructor(params: {
    status: number;
    message: string;
    error?: string;
    timestamp?: string;
    errors?: ValidationErrors;
    url?: string;
  }) {
    super(params.message);
    this.name = 'ApiError';
    this.status = params.status;
    this.error = params.error ?? '';
    this.timestamp = params.timestamp;
    this.errors = params.errors;
    this.url = params.url;
  }
}

function looksVietnamese(text: string): boolean {
  // Heuristic: Vietnamese diacritics + the special 'đ/Đ'
  return /[\u00C0-\u024F\u1E00-\u1EFFđĐ]/.test(text);
}

function safeJsonParse(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function shouldParseJsonResponse(contentType: string | null, text: string): boolean {
  const ct = (contentType || '').toLowerCase();
  if (ct.includes('application/json') || ct.includes('+json')) return true;
  const trimmed = (text || '').trim();
  return trimmed.startsWith('{') || trimmed.startsWith('[');
}

function coerceBackendError(payload: unknown): BackendErrorResponse | null {
  if (!payload || typeof payload !== 'object') return null;
  const anyPayload = payload as Record<string, unknown>;
  const status = typeof anyPayload.status === 'number' ? anyPayload.status : undefined;
  const error = typeof anyPayload.error === 'string' ? anyPayload.error : undefined;
  const message = typeof anyPayload.message === 'string' ? anyPayload.message : undefined;
  const timestamp = typeof anyPayload.timestamp === 'string' ? anyPayload.timestamp : undefined;
  const errors =
    anyPayload.errors && typeof anyPayload.errors === 'object'
      ? (anyPayload.errors as ValidationErrors)
      : undefined;

  if (status !== undefined || error !== undefined || message !== undefined || errors !== undefined) {
    return { status, error, message, timestamp, errors };
  }
  return null;
}

export function isApiError(value: unknown): value is ApiError {
  return value instanceof ApiError;
}

export function getValidationErrors(error: unknown): ValidationErrors | null {
  if (!isApiError(error)) return null;
  return error.errors && Object.keys(error.errors).length > 0 ? error.errors : null;
}

const DEFAULT_EN_MESSAGES: Record<number, string> = {
  400: 'Bad request.',
  401: 'Authentication required. Please sign in again.',
  403: 'You do not have permission to perform this action.',
  404: 'Resource not found.',
  429: 'Too many requests. Please try again later.',
  500: 'Server error. Please try again later.',
};

export function getUserFacingErrorMessage(
  error: unknown,
  options: {
    defaultMessage?: string;
    context?: 'login' | 'register' | 'generic';
    preferBackendMessage?: boolean;
  } = {}
): string {
  const { defaultMessage = 'Something went wrong.', context = 'generic', preferBackendMessage = true } = options;

  if (isApiError(error)) {
    // Special-case: backend login failure message is Vietnamese; keep UI English.
    if (context === 'login' && error.status === 400) {
      return 'Invalid email or password.';
    }

    const validationErrors = getValidationErrors(error);
    if (validationErrors) {
      const [firstField, firstMessage] = Object.entries(validationErrors)[0] ?? [];
      if (firstField && firstMessage) {
        return `Validation failed: ${firstField} ${firstMessage}`;
      }
      return 'Validation failed.';
    }

    const backendMessage = error.message?.trim();
    const statusFallback =
      DEFAULT_EN_MESSAGES[error.status] ??
      (error.status >= 500 ? DEFAULT_EN_MESSAGES[500] : defaultMessage);

    if (preferBackendMessage && backendMessage && !looksVietnamese(backendMessage)) {
      return backendMessage;
    }
    return statusFallback;
  }

  if (error instanceof Error) {
    const msg = error.message?.trim();
    if (msg && !looksVietnamese(msg)) return msg;
  }

  return defaultMessage;
}

// Adds auth and userId headers so callers stay consistent.
export async function apiFetch<T = unknown>(
  service: ServiceName,
  path: string,
  options: ApiFetchOptions = {}
): Promise<T> {
  const {
    withAuth = true,
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
    ...(extraHeaders as Record<string, string>),
  };

  // Only attach JSON content-type when sending a body.
  // This prevents unnecessary CORS preflight for simple GET requests.
  const method = (restOptions.method || 'GET').toUpperCase();
  const hasBody = restOptions.body !== undefined && restOptions.body !== null;
  if (hasBody && !('Content-Type' in headers)) {
    headers['Content-Type'] = 'application/json';
  }

  if (withAuth && token) headers['Authorization'] = `Bearer ${token}`;
  if (withUserId && userId) headers[userIdHeader] = userId;

  const url = `${SERVICE_URLS[service]}${path}`;
  const methodForRetry = (restOptions.method || 'GET').toUpperCase();
  const didSendAuthHeader = Boolean(headers['Authorization']);

  const send = async (overrideHeaders?: Record<string, string>) => {
    const finalHeaders = overrideHeaders ?? headers;
    return fetch(url, { ...restOptions, headers: finalHeaders });
  };

  let response = await send();

  // If the token is stale, some backends may reject even public endpoints when an invalid
  // Authorization header is present. For idempotent methods, retry once without auth.
  if (
    response.status === 401 &&
    didSendAuthHeader &&
    (methodForRetry === 'GET' || methodForRetry === 'HEAD')
  ) {
    const retryHeaders = { ...headers };
    delete retryHeaders['Authorization'];
    response = await send(retryHeaders);
  }

  if (!response.ok) {
    const status = response.status;
    const statusText = response.statusText || '';
    const rawText = await response.text().catch(() => '');
    const parsed = rawText ? safeJsonParse(rawText) : null;
    const backendError = coerceBackendError(parsed);

    const messageFromBackend = backendError?.message || backendError?.error;
    const message =
      (typeof messageFromBackend === 'string' && messageFromBackend.trim()) ||
      statusText ||
      `Request failed with status ${status}`;

    throw new ApiError({
      status,
      message,
      error: backendError?.error,
      timestamp: backendError?.timestamp,
      errors: backendError?.errors,
      url,
    });
  }

  // Successful responses may be:
  // - JSON payloads
  // - empty bodies (204)
  // - plain text acknowledgements (common for action endpoints)
  const text = await response.text().catch(() => '');
  const trimmed = text.trim();
  if (!trimmed) return undefined as unknown as T;

  const contentType = response.headers.get('content-type');
  if (shouldParseJsonResponse(contentType, trimmed)) {
    const parsed = safeJsonParse(trimmed);
    if (parsed !== null) return parsed as T;
    // Fall back to raw text if the server returns non-JSON with a 2xx status.
    return trimmed as unknown as T;
  }

  return trimmed as unknown as T;
}

// Same as apiFetch, but returns raw text (useful for endpoints that don't return JSON).
export async function apiFetchText(
  service: ServiceName,
  path: string,
  options: ApiFetchOptions = {}
): Promise<string> {
  const {
    withAuth = true,
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
    ...(extraHeaders as Record<string, string>),
  };

  const method = (restOptions.method || 'GET').toUpperCase();
  const hasBody = restOptions.body !== undefined && restOptions.body !== null;
  if (hasBody && !('Content-Type' in headers)) {
    headers['Content-Type'] = 'application/json';
  }

  if (withAuth && token) headers['Authorization'] = `Bearer ${token}`;
  if (withUserId && userId) headers[userIdHeader] = userId;

  const url = `${SERVICE_URLS[service]}${path}`;
  const methodForRetry = (restOptions.method || 'GET').toUpperCase();
  const didSendAuthHeader = Boolean(headers['Authorization']);

  const send = async (overrideHeaders?: Record<string, string>) => {
    const finalHeaders = overrideHeaders ?? headers;
    return fetch(url, { ...restOptions, headers: finalHeaders });
  };

  let response = await send();

  if (
    response.status === 401 &&
    didSendAuthHeader &&
    (methodForRetry === 'GET' || methodForRetry === 'HEAD')
  ) {
    const retryHeaders = { ...headers };
    delete retryHeaders['Authorization'];
    response = await send(retryHeaders);
  }

  if (!response.ok) {
    const status = response.status;
    const statusText = response.statusText || '';
    const rawText = await response.text().catch(() => '');
    const parsed = rawText ? safeJsonParse(rawText) : null;
    const backendError = coerceBackendError(parsed);

    const messageFromBackend = backendError?.message || backendError?.error;
    const message =
      (typeof messageFromBackend === 'string' && messageFromBackend.trim()) ||
      statusText ||
      `Request failed with status ${status}`;

    throw new ApiError({
      status,
      message,
      error: backendError?.error,
      timestamp: backendError?.timestamp,
      errors: backendError?.errors,
      url,
    });
  }

  return await response.text().catch(() => '');
}

export function apiGet<T = unknown>(
  service: ServiceName,
  path: string,
  options?: ApiFetchOptions
) {
  return apiFetch<T>(service, path, { method: 'GET', ...options });
}

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

export function apiPutText(
  service: ServiceName,
  path: string,
  body?: unknown,
  options?: ApiFetchOptions
) {
  return apiFetchText(service, path, {
    method: 'PUT',
    body: body !== undefined ? JSON.stringify(body) : undefined,
    ...options,
  });
}

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

