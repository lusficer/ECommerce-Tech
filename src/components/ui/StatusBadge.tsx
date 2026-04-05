// Colored pill badge for statuses (order, approval, payment, etc.)

import React from 'react';

// Order and shipping statuses
const ORDER_STATUS_MAP: Record<string, { classes: string; label: string }> = {
  NEW:                  { classes: 'bg-blue-50 text-blue-600 border-blue-200',    label: 'New Order' },
  PENDING_VERIFICATION: { classes: 'bg-orange-50 text-orange-600 border-orange-200', label: 'Awaiting Manager' },
  PROCESSING:           { classes: 'bg-yellow-50 text-yellow-700 border-yellow-200', label: 'Processing' },
  READY_TO_SHIP:        { classes: 'bg-cyan-50 text-cyan-700 border-cyan-200',    label: 'Ready to Ship' },
  SHIPPING:             { classes: 'bg-purple-50 text-purple-600 border-purple-200', label: 'Shipping' },
  DELIVERED:            { classes: 'bg-green-50 text-green-600 border-green-200', label: 'Delivered' },
  COMPLETE:             { classes: 'bg-teal-50 text-teal-600 border-teal-200',    label: 'Complete' },
  COMPLETED:            { classes: 'bg-teal-50 text-teal-600 border-teal-200',    label: 'Complete' },
  DISPUTED:             { classes: 'bg-orange-50 text-orange-700 border-orange-200', label: 'Disputed' },
  CANCELLED:            { classes: 'bg-red-50 text-red-600 border-red-200',       label: 'Cancelled' },
  REJECTED:             { classes: 'bg-red-100 text-red-800 border-red-300',      label: 'Rejected' },
  RETURNED:             { classes: 'bg-gray-100 text-gray-600 border-gray-200',   label: 'Returned' },
  DELIVERY_FAILED:      { classes: 'bg-red-50 text-red-500 border-red-200',       label: 'Delivery Failed' },
};

// Product approval statuses
const APPROVAL_STATUS_MAP: Record<string, { classes: string; label: string }> = {
  APPROVED:  { classes: 'bg-green-50 text-green-600 border-green-200', label: 'Approved' },
  PENDING:   { classes: 'bg-yellow-50 text-yellow-700 border-yellow-200', label: 'Pending Review' },
  REJECTED:  { classes: 'bg-red-50 text-red-600 border-red-200',       label: 'Rejected' },
};

// Payment statuses
const PAYMENT_STATUS_MAP: Record<string, { classes: string; label: string }> = {
  PAID:    { classes: 'bg-green-100 text-green-700 border-green-300', label: 'Paid' },
  PENDING: { classes: 'bg-yellow-50 text-yellow-700 border-yellow-200', label: 'Pending' },
  FAILED:  { classes: 'bg-red-100 text-red-700 border-red-300',       label: 'Failed' },
};

export type StatusType = 'order' | 'approval' | 'payment';

interface StatusBadgeProps {
  status: string;
  type?: StatusType;
  // Override the display label
  label?: string;
  className?: string;
}

function getMapping(type: StatusType, status: string) {
  const map =
    type === 'approval'
      ? APPROVAL_STATUS_MAP
      : type === 'payment'
      ? PAYMENT_STATUS_MAP
      : ORDER_STATUS_MAP;

  return (
    map[status.toUpperCase()] ?? {
      classes: 'bg-slate-100 text-slate-600 border-slate-200',
      label: status,
    }
  );
}

export default function StatusBadge({
  status,
  type = 'order',
  label,
  className = '',
}: StatusBadgeProps) {
  const { classes, label: defaultLabel } = getMapping(type, status);
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-black border uppercase tracking-wide ${classes} ${className}`}
    >
      {label ?? defaultLabel}
    </span>
  );
}
