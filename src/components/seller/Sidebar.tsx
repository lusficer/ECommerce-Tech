'use client';

import React from 'react';
import Link from 'next/link';
import {
  Store, Truck, TrendingUp, Package, ShieldCheck,
  Settings, ShoppingBag, ClipboardList, BarChart3, Brain, Scale,
} from 'lucide-react';

type Role = 'VENDOR' | 'MANAGER' | 'SHIPPER';

interface SidebarProps {
  role: Role;
  userId: string;
  activeTab: string;
  productCount: number;
  approvalCount: number;
  onTabChange: (tab: string) => void;
}

export default function Sidebar({
  role, userId, activeTab, productCount, approvalCount, onTabChange,
}: SidebarProps) {
  const nav = (tab: string, icon: React.ReactNode, label: string, badge?: number) => (
    <button
      onClick={() => onTabChange(tab)}
      className={`flex items-center justify-between p-4 rounded-xl font-bold text-sm transition-all w-full text-left ${
        activeTab === tab ? 'bg-cyan-50 text-cyan-600' : 'text-slate-600 hover:bg-slate-50'
      }`}
    >
      <div className="flex items-center gap-3">{icon} {label}</div>
      {badge !== undefined && badge > 0 && (
        <span className="bg-orange-100 text-orange-600 py-0.5 px-2 rounded-full text-xs animate-pulse">{badge}</span>
      )}
      {badge !== undefined && badge === 0 && productCount > 0 && (
        <span className="bg-slate-100 text-slate-500 py-0.5 px-2 rounded-full text-xs">{productCount}</span>
      )}
    </button>
  );

  return (
    <div className="w-full lg:w-1/4 flex flex-col gap-4 sticky top-28">
      <div className="bg-slate-900 rounded-3xl p-8 text-white shadow-lg overflow-hidden relative">
        <div className="absolute top-0 right-0 p-4 opacity-10 text-cyan-500">
          {role === 'SHIPPER'
            ? <Truck className="w-32 h-32 -mr-10 -mt-10" />
            : <Store className="w-32 h-32 -mr-10 -mt-10" />}
        </div>
        <div className="relative z-10">
          <h2 className="text-2xl font-black mb-1 leading-tight">
            {role === 'MANAGER' ? 'Shop Manager' : role === 'SHIPPER' ? 'Delivery Center' : 'Vendor Portal'}
          </h2>
          <p className="text-cyan-400 text-xs font-bold uppercase tracking-wider mt-2">{role}</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl p-4 border border-slate-200 shadow-sm flex flex-col gap-1">
        {nav('dashboard', <TrendingUp className="w-5 h-5" />, 'Overview')}

        {role !== 'SHIPPER' && (
          <Link
            href="/seller/analytics"
            className="flex items-center gap-3 p-4 rounded-xl font-bold text-sm text-slate-600 hover:text-cyan-600 hover:bg-cyan-50 transition-all"
          >
            <BarChart3 className="w-5 h-5" /> Analytics & Reports
          </Link>
        )}

        {role !== 'SHIPPER' && (
          <Link
            href="/seller/forecast"
            className="flex items-center gap-3 p-4 rounded-xl font-bold text-sm text-slate-600 hover:text-cyan-600 hover:bg-cyan-50 transition-all"
          >
            <Brain className="w-5 h-5" /> Inventory Forecast
          </Link>
        )}

        {role !== 'SHIPPER' && (
          <>
            <button
              onClick={() => onTabChange('products')}
              className={`flex items-center justify-between p-4 rounded-xl font-bold text-sm transition-all w-full text-left ${
                activeTab === 'products' ? 'bg-cyan-50 text-cyan-600' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <Package className="w-5 h-5" />
                {role === 'MANAGER' ? 'Shop Inventory' : 'My Products'}
              </div>
              <span className="bg-slate-100 text-slate-500 py-0.5 px-2 rounded-full text-xs">{productCount}</span>
            </button>

            {role === 'MANAGER' && (
              <>
                <button
                  onClick={() => onTabChange('approval')}
                  className={`flex items-center justify-between p-4 rounded-xl font-bold text-sm transition-all w-full text-left ${
                    activeTab === 'approval' ? 'bg-cyan-50 text-cyan-600' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3"><ShieldCheck className="w-5 h-5" /> Approval Queue</div>
                  {approvalCount > 0 && (
                    <span className="bg-orange-100 text-orange-600 py-0.5 px-2 rounded-full text-xs animate-pulse">{approvalCount}</span>
                  )}
                </button>
                <button
                  onClick={() => onTabChange('settings')}
                  className={`flex items-center gap-3 p-4 rounded-xl font-bold text-sm transition-all w-full text-left ${
                    activeTab === 'settings' ? 'bg-cyan-50 text-cyan-600' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Settings className="w-5 h-5" /> Shop Settings
                </button>
              </>
            )}

            {role === 'VENDOR' && (
              <button
                onClick={() => onTabChange('settings')}
                className={`flex items-center gap-3 p-4 rounded-xl font-bold text-sm transition-all w-full text-left ${
                  activeTab === 'settings' ? 'bg-cyan-50 text-cyan-600' : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Settings className="w-5 h-5" /> Shop Profile
              </button>
            )}
          </>
        )}

        <div className="h-px bg-slate-100 my-2" />
        <div className="px-4 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">Order & Shipping</div>

        {role === 'VENDOR' && (
          <Link href="/seller/orders" className="flex items-center gap-3 p-4 rounded-xl font-bold text-sm text-slate-600 hover:text-cyan-600 hover:bg-cyan-50 transition-all">
            <ShoppingBag className="w-5 h-5" /> Order Management
          </Link>
        )}
        {role === 'MANAGER' && (
          <Link href="/manager/orders" className="flex items-center gap-3 p-4 rounded-xl font-bold text-sm text-slate-600 hover:text-cyan-600 hover:bg-cyan-50 transition-all">
            <ClipboardList className="w-5 h-5" /> Order Verification
          </Link>
        )}
        {role === 'SHIPPER' && (
          <Link href="/shipper/orders" className="flex items-center gap-3 p-4 rounded-xl font-bold text-sm text-slate-600 hover:text-cyan-600 hover:bg-cyan-50 transition-all">
            <Truck className="w-5 h-5" /> Delivery Dashboard
          </Link>
        )}
        
        {role !== 'SHIPPER' && (
          <button
            onClick={() => onTabChange('disputes')}
            className={`flex items-center gap-3 p-4 rounded-xl font-bold text-sm transition-all w-full text-left ${
              activeTab === 'disputes' ? 'bg-cyan-50 text-cyan-600' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Scale className="w-5 h-5" /> Disputes
          </button>
        )}
      </div>
    </div>
  );
}