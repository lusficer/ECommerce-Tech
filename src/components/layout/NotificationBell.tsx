'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell } from 'lucide-react';

import NotificationPanel from './NotificationPanel';
import { useNotifications } from '@/hooks/useNotifications';

function resolveViewerRole(userId: string, storedRole: string): string {
  const candidates = [storedRole, userId]
    .filter(Boolean)
    .map((v) => String(v).trim().toUpperCase());

  for (const c of candidates) {
    if (c.startsWith('SHIPPER')) return 'SHIPPER';
    if (c.startsWith('SHOP_MNG')) return 'SHOP_MNG';
    if (c.startsWith('VEND') || c.startsWith('VENDOR')) return 'VENDOR';
    if (c.startsWith('ADMIN')) return 'ADMIN';
  }

  return String(storedRole || '').trim().toUpperCase();
}

function canAccessSellerPortal(userId: string, role: string): boolean {
  const normalizedRole = resolveViewerRole(userId, role);
  // Some environments store role as an ID (e.g. SHIPPER_001). Treat prefixes as roles.
  if (['VENDOR', 'SHOP_MNG', 'SHIPPER', 'ADMIN'].includes(normalizedRole)) return true;
  return (
    (userId || '').startsWith('VEND') ||
    (userId || '').startsWith('SHOP_MNG') ||
    (userId || '').startsWith('SHIPPER')
  );
}

function getNotificationHref(referenceType: string, referenceId: string): string | null {
  const refType = (referenceType || '').toUpperCase();
  const refId = String(referenceId || '');

  // Determine viewer context (customer vs vendor/manager/shipper) from localStorage.
  const role = (typeof window !== 'undefined' && localStorage.getItem('role')) || '';
  const userId = (typeof window !== 'undefined' && localStorage.getItem('userId')) || '';
  const isSellerPortalUser = canAccessSellerPortal(userId, role);
  const viewerRole = resolveViewerRole(userId, role);

  if (refType === 'ORDER') {
    if (viewerRole === 'SHIPPER') {
      // Shipper page defaults to "Available to Pick" tab.
      return '/shipper/orders';
    }
    if (viewerRole === 'ADMIN') {
      return refId
        ? `/manager/orders?tab=ALL&orderId=${encodeURIComponent(refId)}`
        : '/manager/orders?tab=ALL';
    }
    // Keep SHOP_MNG separate: it should land on seller "All Orders" (all shop orders) view.
    if (viewerRole === 'SHOP_MNG') {
      return refId
        ? `/manager/orders?tab=ALL&orderId=${encodeURIComponent(refId)}`
        : '/manager/orders?tab=ALL';
    }
    if (viewerRole === 'VENDOR' || isSellerPortalUser) {
      return refId ? `/seller/orders?orderId=${encodeURIComponent(refId)}` : '/seller/orders';
    }
    return refId ? `/orders/${encodeURIComponent(refId)}` : '/orders';
  }

  if (refType === 'PRODUCT') {
    // Product notifications are typically vendor-facing (approved/rejected/low stock).
    if (isSellerPortalUser) return '/seller';
    return refId ? `/products/${encodeURIComponent(refId)}` : '/products';
  }

  if (refType === 'DISPUTE') {
    // This app doesn't have /disputes/[id]; route to the closest existing screens.
    if (viewerRole === 'SHOP_MNG' || viewerRole === 'ADMIN') return '/seller?tab=disputes';
    if (isSellerPortalUser) return '/seller?tab=disputes';
    return '/orders';
  }

  return null;
}

export default function NotificationBell() {
  const router = useRouter();
  const {
    unreadCount,
    unread,
    fetchUnreadList,
    markNotificationRead,
    markAllNotificationsRead,
    syncNotificationPollingWithAuth,
    stopPolling,
  } = useNotifications();

  const [open, setOpen] = useState(false);
  const [loadingUnread, setLoadingUnread] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  const badge = useMemo(() => {
    if (unreadCount <= 0) return '';
    if (unreadCount > 99) return '99+';
    return String(unreadCount);
  }, [unreadCount]);

  useEffect(() => {
    syncNotificationPollingWithAuth();

    const onAuthUpdated = () => syncNotificationPollingWithAuth();
    window.addEventListener('authUpdated', onAuthUpdated);
    window.addEventListener('storage', onAuthUpdated);

    return () => {
      window.removeEventListener('authUpdated', onAuthUpdated);
      window.removeEventListener('storage', onAuthUpdated);
      stopPolling();
    };
  }, [syncNotificationPollingWithAuth, stopPolling]);

  useEffect(() => {
    if (!open) return;

    setLoadingUnread(true);
    fetchUnreadList()
      .catch(() => {
        // Errors are already logged inside the store.
      })
      .finally(() => setLoadingUnread(false));
  }, [open, fetchUnreadList]);

  useEffect(() => {
    const onPointerDown = (e: PointerEvent) => {
      if (!open) return;
      const root = rootRef.current;
      if (!root) return;
      if (e.target instanceof Node && !root.contains(e.target)) {
        setOpen(false);
      }
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (!open) return;
      if (e.key === 'Escape') setOpen(false);
    };

    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const onClickBell = () => {
    setOpen((v) => !v);
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={onClickBell}
        className="relative flex text-slate-600 hover:text-cyan-600 transition-colors py-2"
        title="Notifications"
        aria-label="Notifications"
      >
        <Bell className="w-6 h-6" />
        {badge ? (
          <span className="absolute top-0 -right-1.5 min-w-4 h-4 px-1 bg-cyan-600 text-[10px] font-bold text-white flex items-center justify-center rounded-full border-2 border-white shadow-sm">
            {badge}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute top-full right-0 pt-2 z-50">
          <NotificationPanel
            unread={unread}
            loading={loadingUnread}
            onMarkAllRead={() => {
              void markAllNotificationsRead();
            }}
            onNotificationClick={(n) => {
              void markNotificationRead(n.id);
              const href = getNotificationHref(String(n.referenceType || ''), String(n.referenceId || ''));
              if (href) {
                setOpen(false);
                router.push(href);
              }
            }}
          />
        </div>
      ) : null}
    </div>
  );
}
