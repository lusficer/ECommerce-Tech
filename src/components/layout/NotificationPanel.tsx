'use client';

import React from 'react';
import {
  AlertTriangle,
  BadgeCheck,
  BadgeX,
  Bell,
  CheckCircle2,
  Clock,
  Package,
  RefreshCcw,
  Scale,
  Truck,
  XCircle,
} from 'lucide-react';

import type { NormalizedNotification } from '@/hooks/useNotifications';
import { formatRelativeTime } from '@/lib/relativeTime';

function getTypeIcon(type: string) {
  switch (type) {
    case 'ORDER_STATUS_CHANGED':
      return RefreshCcw;
    case 'ORDER_VERIFIED':
      return CheckCircle2;
    case 'ORDER_REJECTED':
      return XCircle;
    case 'ORDER_PENDING_VERIFICATION':
      return Clock;
    case 'NEW_ORDER_RECEIVED':
      return Package;
    case 'ORDER_AVAILABLE_FOR_PICKUP':
      return Truck;

    case 'DISPUTE_RESOLVED':
      return Scale;
    case 'DISPUTE_NEEDS_INFO':
      return AlertTriangle;
    case 'NEW_DISPUTE_CREATED':
      return Scale;

    case 'PRODUCT_APPROVED':
      return BadgeCheck;
    case 'PRODUCT_REJECTED':
      return BadgeX;
    case 'LOW_STOCK_WARNING':
      return AlertTriangle;

    default:
      return Bell;
  }
}

export default function NotificationPanel(props: {
  unread: NormalizedNotification[];
  loading?: boolean;
  onMarkAllRead: () => void;
  onNotificationClick: (n: NormalizedNotification) => void;
}) {
  const { unread, loading = false, onMarkAllRead, onNotificationClick } = props;

  return (
    <div className="bg-white rounded-2xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.15)] border border-slate-100 overflow-hidden flex flex-col w-80 md:w-96">
      <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
        <h4 className="font-black text-slate-900 text-sm">Notifications</h4>
        <button
          onClick={onMarkAllRead}
          className="text-xs font-bold text-cyan-600 hover:underline disabled:text-slate-400 disabled:no-underline"
          disabled={unread.length === 0}
          type="button"
        >
          Mark all as read
        </button>
      </div>

      <div className="max-h-[360px] overflow-y-auto">
        {loading ? (
          <div className="p-6 text-center text-slate-500 text-sm font-medium">Loading notifications...</div>
        ) : unread.length === 0 ? (
          <div className="p-8 text-center flex flex-col items-center justify-center">
            <Bell className="w-12 h-12 text-slate-200 mb-3" />
            <p className="text-sm font-bold text-slate-500">You’re all caught up</p>
          </div>
        ) : (
          <div className="p-2">
            {unread.map((n) => {
              const Icon = getTypeIcon(n.type);
              return (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => onNotificationClick(n)}
                  className="w-full text-left flex gap-3 p-3 hover:bg-slate-50 rounded-xl transition-colors"
                >
                  <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5 text-cyan-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm font-black text-slate-900 truncate">{n.title}</p>
                      <span className="text-[11px] font-bold text-slate-400 shrink-0">
                        {formatRelativeTime(n.createdAt)}
                      </span>
                    </div>
                    {n.message ? (
                      <p className="text-xs font-medium text-slate-600 mt-1 line-clamp-2">{n.message}</p>
                    ) : null}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
