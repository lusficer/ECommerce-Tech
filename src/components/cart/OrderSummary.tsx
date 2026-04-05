'use client';

import React from 'react';
import { ArrowRight, ShieldCheck } from 'lucide-react';
import { formatCurrency } from '@/lib/format';

interface OrderSummaryProps {
  selectedCount: number;
  selectedTotal: number;
  onCheckout: () => void;
}

export default function OrderSummary({
  selectedCount,
  selectedTotal,
  onCheckout,
}: OrderSummaryProps) {
  const hasSelection = selectedCount > 0;

  return (
    <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-sm sticky top-28">
      <h2 className="text-xl font-black text-slate-900 mb-6">Order Summary</h2>

      <div className="space-y-4 text-sm font-medium text-slate-600 border-b border-slate-100 pb-6 mb-6">
        <div className="flex justify-between items-center">
          <span>Selected ({selectedCount} items)</span>
          <span className="font-bold text-slate-900">{formatCurrency(selectedTotal)}</span>
        </div>
        <div className="flex justify-between items-center">
          <span>Shipping</span>
          <span className="font-bold text-green-600">Calculated at checkout</span>
        </div>
      </div>

      <div className="flex justify-between items-end mb-8">
        <span className="text-lg font-bold text-slate-900">Total</span>
        <span className="text-4xl font-black text-cyan-600 tracking-tight">
          {formatCurrency(selectedTotal)}
        </span>
      </div>

      <button
        onClick={onCheckout}
        disabled={!hasSelection}
        className={`w-full py-4 font-black text-lg rounded-xl transition-all flex items-center justify-center gap-2 mb-4 group
          ${hasSelection
            ? 'bg-slate-900 text-white hover:bg-cyan-600 hover:-translate-y-0.5 shadow-md'
            : 'bg-slate-200 text-slate-400 cursor-not-allowed'
          }`}
      >
        Proceed to Checkout
        <ArrowRight className={`w-5 h-5 ${hasSelection ? 'group-hover:translate-x-1 transition-transform' : ''}`} />
      </button>

      <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100">
        <ShieldCheck className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
        <p className="text-xs text-slate-600 font-medium leading-relaxed">
          Secure checkout. We use state-of-the-art encryption to protect your financial information.
        </p>
      </div>
    </div>
  );
}
