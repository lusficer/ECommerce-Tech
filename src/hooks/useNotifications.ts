'use client';

import { useSyncExternalStore } from 'react';
import { isApiError } from '@/lib/api';
import { notificationApi } from '@/lib/notificationApi';
import type { NotificationDTO, NotificationReferenceType, NotificationType } from '@/types';

export interface NormalizedNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  createdAt: string | null;
  referenceType: NotificationReferenceType;
  referenceId: string;
  raw: NotificationDTO;
}

interface NotificationStoreState {
  unreadCount: number;
  unread: NormalizedNotification[];
  isPolling: boolean;
  lastUnreadFetchedAt: number;
}

const UNREAD_CACHE_TTL_MS = 8000;
const POLL_INTERVAL_MS = 15000;

const initialState: NotificationStoreState = {
  unreadCount: 0,
  unread: [],
  isPolling: false,
  lastUnreadFetchedAt: 0,
};

let state: NotificationStoreState = initialState;
const listeners = new Set<() => void>();

let pollTimer: ReturnType<typeof setInterval> | null = null;
let unreadCountInFlight = false;

let unreadListPromise: Promise<NormalizedNotification[]> | null = null;
let unreadListAbort: AbortController | null = null;

function emit() {
  for (const l of listeners) l();
}

function setState(partial: Partial<NotificationStoreState>) {
  state = { ...state, ...partial };
  emit();
}

function resetState() {
  state = { ...initialState };
  emit();
}

function normalize(dto: NotificationDTO): NormalizedNotification | null {
  const coerceId = (v: unknown): string => {
    if (typeof v === 'string') return v;
    if (typeof v === 'number' && Number.isFinite(v)) return String(v);
    return '';
  };

  const id = coerceId(dto.notificationId) || coerceId(dto.id);
  if (!id) return null;

  const type = (dto.type || 'ORDER_STATUS_CHANGED') as NotificationType;

  const title =
    (typeof dto.title === 'string' && dto.title.trim()) ||
    (typeof dto.type === 'string' && dto.type.replaceAll('_', ' ')) ||
    'Notification';

  const message = (typeof dto.message === 'string' && dto.message.trim()) || '';

  const createdAt = typeof dto.createdAt === 'string' && dto.createdAt ? dto.createdAt : null;
  const referenceType = (dto.referenceType || '') as NotificationReferenceType;
  const referenceId =
    typeof dto.referenceId === 'string'
      ? dto.referenceId
      : typeof dto.referenceId === 'number' && Number.isFinite(dto.referenceId)
      ? String(dto.referenceId)
      : '';

  return {
    id,
    type,
    title,
    message,
    createdAt,
    referenceType,
    referenceId,
    raw: dto,
  };
}

function handleAuthFailure() {
  stopPolling({ clearState: true });
}

async function pollUnreadCount() {
  if (unreadCountInFlight) return;
  unreadCountInFlight = true;

  try {
    const count = await notificationApi.getUnreadCount();
    setState({ unreadCount: Math.max(0, count) });
  } catch (err) {
    if (isApiError(err) && err.status === 401) {
      handleAuthFailure();
      return;
    }
    console.error('[notifications] Failed to poll unread count', err);
    // Keep last known badge count.
  } finally {
    unreadCountInFlight = false;
  }
}

export function startPolling() {
  if (pollTimer) return;
  setState({ isPolling: true });
  pollUnreadCount();
  pollTimer = setInterval(pollUnreadCount, POLL_INTERVAL_MS);
}

export function stopPolling(options?: { clearState?: boolean }) {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }

  unreadListAbort?.abort();
  unreadListAbort = null;
  unreadListPromise = null;

  unreadCountInFlight = false;

  if (options?.clearState) {
    resetState();
  } else {
    setState({ isPolling: false });
  }
}

export function syncNotificationPollingWithAuth() {
  if (typeof window === 'undefined') return;
  const token = localStorage.getItem('accessToken') || localStorage.getItem('token') || '';
  const userId = localStorage.getItem('userId') || '';

  if (!token || !userId) {
    stopPolling({ clearState: true });
    return;
  }

  startPolling();
}

export async function fetchUnreadList(options?: { force?: boolean }) {
  const force = Boolean(options?.force);
  const now = Date.now();

  if (!force && state.unread.length > 0 && now - state.lastUnreadFetchedAt < UNREAD_CACHE_TTL_MS) {
    return state.unread;
  }

  if (unreadListPromise) return unreadListPromise;

  unreadListAbort = new AbortController();
  unreadListPromise = (async () => {
    try {
      const list = await notificationApi.getUnreadList(unreadListAbort?.signal);
      const normalized = (list ?? []).map(normalize).filter(Boolean) as NormalizedNotification[];
      setState({ unread: normalized, lastUnreadFetchedAt: Date.now() });
      return normalized;
    } catch (err) {
      if (isApiError(err) && err.status === 401) {
        handleAuthFailure();
        return [];
      }
      if ((err as any)?.name !== 'AbortError') {
        console.error('[notifications] Failed to fetch unread list', err);
      }
      // Keep last known list.
      return state.unread;
    } finally {
      unreadListPromise = null;
      unreadListAbort = null;
    }
  })();

  return unreadListPromise;
}

export async function markNotificationRead(notificationId: string) {
  const prevUnread = state.unread;
  const prevCount = state.unreadCount;

  const nextUnread = prevUnread.filter((n) => n.id !== notificationId);
  const removed = prevUnread.length !== nextUnread.length;

  if (removed) {
    setState({ unread: nextUnread, unreadCount: Math.max(0, prevCount - 1) });
  }

  try {
    await notificationApi.markRead(notificationId);
  } catch (err) {
    if (isApiError(err) && err.status === 401) {
      handleAuthFailure();
      return;
    }
    console.error('[notifications] Failed to mark notification as read', err);
    // Roll back optimistic update.
    if (removed) setState({ unread: prevUnread, unreadCount: prevCount });
  }
}

export async function markAllNotificationsRead() {
  const prevUnread = state.unread;
  const prevCount = state.unreadCount;

  setState({ unread: [], unreadCount: 0 });

  try {
    await notificationApi.markAllRead();
  } catch (err) {
    if (isApiError(err) && err.status === 401) {
      handleAuthFailure();
      return;
    }
    console.error('[notifications] Failed to mark all notifications as read', err);
    // Roll back optimistic update.
    setState({ unread: prevUnread, unreadCount: prevCount });
  }
}

function subscribe(onStoreChange: () => void) {
  listeners.add(onStoreChange);
  return () => listeners.delete(onStoreChange);
}

function getSnapshot() {
  return state;
}

function getServerSnapshot() {
  return initialState;
}

export function useNotifications() {
  const s = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  return {
    unreadCount: s.unreadCount,
    unread: s.unread,
    isPolling: s.isPolling,
    fetchUnreadList,
    markNotificationRead,
    markAllNotificationsRead,
    startPolling,
    stopPolling,
    syncNotificationPollingWithAuth,
  };
}
