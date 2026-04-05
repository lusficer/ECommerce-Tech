'use client';

import React from 'react';
import type { DisputeStatus as DisputeStatusType } from '@/types';
import { getDisputeLabel, normalizeDisputeStatus } from '@/lib/disputeHelpers';

interface DisputeStatusProps {
  status?: DisputeStatusType;
}

export default function DisputeStatus({ status }: DisputeStatusProps) {
  if (!status) return null;

  const raw = String(status);
  const normalized = normalizeDisputeStatus(raw);
  if (!normalized) return null;
  const rawStatus = raw.toUpperCase();

  const classes =
    rawStatus === 'UNDER_REVIEW'
      ? 'bg-blue-50 text-blue-700 border-blue-200'
      : rawStatus === 'WAITING_FOR_INFO'
      ? 'bg-orange-50 text-orange-700 border-orange-200'
      : normalized === 'APPROVED'
      ? 'bg-green-50 text-green-700 border-green-200'
      : normalized === 'REJECTED'
      ? 'bg-red-50 text-red-700 border-red-200'
      : 'bg-yellow-50 text-yellow-700 border-yellow-200';

  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-black border uppercase tracking-wide ${classes}`}
    >
      {getDisputeLabel(raw)}
    </span>
  );
}
