import { apiGet, apiPutText } from '@/lib/api';
import type { NotificationDTO } from '@/types';

export interface SpringPage<T> {
  content: T[];
  number?: number;
  size?: number;
  totalElements?: number;
  totalPages?: number;
  first?: boolean;
  last?: boolean;
  // Allow extra fields from Spring without breaking the UI.
  [key: string]: unknown;
}

function coerceUnreadCount(payload: unknown): number {
  if (typeof payload === 'number' && Number.isFinite(payload)) return payload;
  if (!payload || typeof payload !== 'object') return 0;
  const anyPayload = payload as Record<string, unknown>;

  const candidates = [
    anyPayload.totalUnread,
    anyPayload.unread,
    anyPayload.count,
    anyPayload.unreadCount,
  ];

  for (const value of candidates) {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string' && value.trim() && Number.isFinite(Number(value))) {
      return Number(value);
    }
  }

  return 0;
}

export const notificationApi = {
  async getUnreadCount(signal?: AbortSignal): Promise<number> {
    const data = await apiGet<unknown>('user', '/api/notifications/unread/count', {
      withUserId: false,
      signal,
    });
    return coerceUnreadCount(data);
  },

  async getUnreadList(signal?: AbortSignal): Promise<NotificationDTO[]> {
    const data = await apiGet<NotificationDTO[]>('user', '/api/notifications/unread', {
      withUserId: false,
      signal,
    });
    return Array.isArray(data) ? data : [];
  },

  async getAll(page = 0, size = 20, signal?: AbortSignal): Promise<SpringPage<NotificationDTO>> {
    const data = await apiGet<SpringPage<NotificationDTO>>(
      'user',
      `/api/notifications?page=${page}&size=${size}`,
      { withUserId: false, signal }
    );
    return data ?? { content: [] };
  },

  async markRead(notificationId: string, signal?: AbortSignal): Promise<string> {
    return apiPutText('user', `/api/notifications/${encodeURIComponent(notificationId)}/read`, undefined, {
      withUserId: false,
      signal,
    });
  },

  async markAllRead(signal?: AbortSignal): Promise<string> {
    return apiPutText('user', '/api/notifications/read-all', undefined, {
      withUserId: false,
      signal,
    });
  },
};
