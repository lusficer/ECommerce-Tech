'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import React, { Suspense } from 'react';
import { CheckCircle2, Package, ShoppingBag, XCircle } from 'lucide-react';

function CheckoutSuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');
  const shops = Number(searchParams.get('shops') || '1');
  const payment = searchParams.get('payment');
  const isFailed = payment === 'failed';

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl">
        <div className="rounded-2xl border border-slate-100 bg-white p-8 text-center shadow-sm sm:p-10">
          <div className={`mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full ${isFailed ? 'bg-red-50 text-red-600' : 'bg-cyan-50 text-cyan-600'}`}>
            {isFailed ? <XCircle className="h-10 w-10" /> : <CheckCircle2 className="h-10 w-10" />}
          </div>

          <h1 className="text-2xl font-black text-slate-900 sm:text-3xl">
            {isFailed ? 'Payment failed!' : 'Order placed successfully!'}
          </h1>
          <p className="mt-3 text-slate-600">
            {isFailed
              ? 'Your online payment was not completed or has been canceled. Please try again.'
              : shops > 1
              ? `Your orders from ${shops} shops have been created successfully.`
              : 'Your order has been created and is being processed.'}
          </p>

          {orderId && (
            <div className={`mt-6 rounded-xl px-4 py-3 text-sm ${isFailed ? 'border border-red-200 bg-red-50 text-red-700' : 'border border-slate-200 bg-slate-50 text-slate-700'}`}>
              Order ID: <span className="font-bold text-slate-900">#{orderId}</span>
            </div>
          )}

          <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Link
              href={orderId ? `/orders/${orderId}` : '/orders'}
              className={`inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 font-bold text-white transition-colors ${isFailed ? 'bg-red-600 hover:bg-red-700' : 'bg-slate-900 hover:bg-cyan-600'}`}
            >
              <Package className="h-5 w-5" />
              View order details
            </Link>

            <Link
              href={isFailed ? '/checkout' : '/products'}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 font-bold text-slate-800 transition-colors hover:border-cyan-300 hover:text-cyan-700"
            >
              <ShoppingBag className="h-5 w-5" />
              {isFailed ? 'Back to checkout' : 'Continue shopping'}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl">
            <div className="rounded-2xl border border-slate-100 bg-white p-8 text-center shadow-sm sm:p-10">
              <div className="mx-auto mb-6 h-20 w-20 rounded-full bg-slate-100" />
              <div className="h-6 w-2/3 bg-slate-100 rounded mx-auto" />
              <div className="mt-3 h-4 w-3/4 bg-slate-100 rounded mx-auto" />
            </div>
          </div>
        </div>
      }
    >
      <CheckoutSuccessContent />
    </Suspense>
  );
}
