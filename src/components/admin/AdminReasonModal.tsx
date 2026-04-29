'use client';

import { useEffect, useMemo, useState } from 'react';
import { Loader2, X } from 'lucide-react';

interface AdminReasonModalProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  confirmVariant: 'danger' | 'primary';
  onConfirm: (reason: string) => void | Promise<void>;
  onCancel: () => void;
  requireReason: boolean;
  minReasonLength?: number;
}

export default function AdminReasonModal({
  isOpen,
  title,
  description,
  confirmLabel = 'Confirm',
  confirmVariant,
  onConfirm,
  onCancel,
  requireReason,
  minReasonLength = 10,
}: AdminReasonModalProps) {
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const trimmedLength = useMemo(() => reason.trim().length, [reason]);
  const isReasonValid = !requireReason || trimmedLength >= minReasonLength;

  useEffect(() => {
    if (!isOpen) {
      setReason('');
      setSubmitting(false);
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !submitting) {
        onCancel();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onCancel, submitting]);

  if (!isOpen) return null;

  const confirmClassName =
    confirmVariant === 'danger'
      ? 'bg-red-600 hover:bg-red-700 disabled:bg-red-300'
      : 'bg-cyan-600 hover:bg-cyan-700 disabled:bg-cyan-300';

  const handleConfirm = async () => {
    if (submitting || !isReasonValid) return;
    setSubmitting(true);
    try {
      await onConfirm(reason.trim());
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
      onClick={(event) => {
        if (event.target === event.currentTarget && !submitting) {
          onCancel();
        }
      }}
    >
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-black text-slate-900">{title}</h3>
            <p className="mt-1 text-sm text-slate-600">{description}</p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            disabled={submitting}
            className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-60"
            aria-label="Close modal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {requireReason ? (
          <div className="mt-4">
            <label className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">
              Reason
            </label>
            <textarea
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              rows={4}
              placeholder="Enter reason..."
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none transition-colors focus:border-cyan-500"
              disabled={submitting}
            />
            <p
              className={`mt-1 text-xs font-semibold ${
                isReasonValid ? 'text-slate-500' : 'text-red-600'
              }`}
            >
              {trimmedLength}/{minReasonLength} characters minimum
            </p>
          </div>
        ) : null}

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={submitting}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={submitting || !isReasonValid}
            className={`inline-flex min-w-28 items-center justify-center rounded-lg px-4 py-2 text-sm font-bold text-white transition-colors disabled:cursor-not-allowed ${confirmClassName}`}
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

