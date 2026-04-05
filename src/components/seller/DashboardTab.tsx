'use client';

import React from 'react';
import Link from 'next/link';
import { ShoppingBag, ClipboardList, Truck, BarChart3 } from 'lucide-react';

type Role = 'VENDOR' | 'MANAGER' | 'SHIPPER';

interface DashboardTabProps {
  role: Role;
  userId: string;
}

export default function DashboardTab({ role, userId }: DashboardTabProps) {
  return (
    <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm min-h-[400px]">
      <h3 className="text-xl font-black text-slate-900 mb-6">Welcome back, {userId}!</h3>
      <p className="text-slate-500 mb-8">
        {role === 'SHIPPER'
          ? 'Get ready for your delivery routes today.'
          : 'Manage your operations effectively from this portal.'}
      </p>

      <div className="flex flex-wrap gap-3">
        {role === 'VENDOR' && (
          <Link
            href="/seller/orders"
            className="inline-flex items-center gap-2 px-6 py-3 bg-cyan-600 text-white font-bold rounded-xl hover:bg-cyan-700 transition-colors"
          >
            <ShoppingBag className="w-5 h-5" /> Go to Order Management
          </Link>
        )}
        {role === 'MANAGER' && (
          <Link
            href="/manager/orders"
            className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors"
          >
            <ClipboardList className="w-5 h-5" /> Review Pending Orders
          </Link>
        )}
        {role !== 'SHIPPER' && (
          <Link
            href="/seller/analytics"
            className="inline-flex items-center gap-2 px-6 py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-colors"
          >
            <BarChart3 className="w-5 h-5" /> View Sales Analytics
          </Link>
        )}
        {role === 'SHIPPER' && (
          <Link
            href="/shipper/orders"
            className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-700 transition-colors shadow-md"
          >
            <Truck className="w-5 h-5" /> Open Delivery Dashboard
          </Link>
        )}
      </div>
    </div>
  );
}
