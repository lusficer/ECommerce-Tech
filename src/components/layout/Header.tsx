'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  RefreshCcw, ChevronDown, Store, Loader2, ChevronRight, Package,
} from 'lucide-react';

import SearchBar from './SearchBar';
import CategoryMegaMenu from './CategoryMegaMenu';
import WishlistIcon from './WishlistIcon';
import NotificationBell from './NotificationBell';
import CartIcon from './CartIcon';
import UserMenu from './UserMenu';

import { apiGet } from '@/lib/api';

export default function Header() {
  const [shops, setShops]                   = useState<any[]>([]);
  const [loadingShops, setLoadingShops]     = useState(false);
  const [showShopDropdown, setShowShopDropdown] = useState(false);

  // Preload a small shop list for the header dropdown.
  useEffect(() => {
    (async () => {
      setLoadingShops(true);
      try {
        const data = await apiGet<any[]>('shop', '/api/shops', { withUserId: false });
        setShops((data ?? []).slice(0, 8));
      } catch {} finally { setLoadingShops(false); }
    })();
  }, []);

  return (
    <header className="w-full bg-white border-b border-slate-200 font-sans sticky top-0 z-50 shadow-sm">
      <div className="hidden md:flex justify-between items-center px-4 lg:px-8 bg-slate-50 border-b border-slate-200 text-sm font-medium text-slate-600">
        <div className="flex items-center divide-x divide-slate-300 border-l border-slate-300">
          <Link href="/seller"  className="px-5 py-2 hover:text-cyan-600 hover:bg-slate-200/50 transition-all">Seller Centre</Link>
          <Link href="/orders"  className="px-5 py-2 hover:text-cyan-600 hover:bg-slate-200/50 transition-all border-r border-slate-300">Order Tracking</Link>
        </div>
      </div>
      <div className="px-4 lg:px-8 py-4 flex items-center justify-between gap-4 md:gap-8 border-b border-slate-100">
        <Link href="/" className="flex items-center shrink-0 group">
          <div className="flex items-center font-rubik tracking-tighter">
            <span className="text-2xl md:text-3xl font-black text-slate-900">Tech</span>
            <span className="text-2xl md:text-3xl font-black text-cyan-600 drop-shadow-[0_1.2px_1.2px_rgba(0,0,0,0.1)]">Stone</span>
          </div>
        </Link>
        <SearchBar />
        <div className="flex items-center gap-5 shrink-0">
          <WishlistIcon />

          <NotificationBell />

          <div className="h-8 w-px bg-slate-200 hidden md:block mx-1" />

          <UserMenu />

          <CartIcon />
        </div>
      </div>
      <div className="hidden md:flex px-4 lg:px-8 py-0 items-center gap-8 border-t border-slate-100">
        <CategoryMegaMenu />

        <nav className="flex gap-8 text-sm font-bold text-slate-600 h-full items-center">
          <Link href="/" className="hover:text-cyan-600 transition-colors">Home</Link>

          <Link href="/products" className="flex items-center gap-1.5 hover:text-cyan-600 transition-colors">
            <Package size={18} className="text-cyan-600" /> Products
          </Link>
          <div
            className="relative h-full flex items-center"
            onMouseEnter={() => setShowShopDropdown(true)}
            onMouseLeave={() => setShowShopDropdown(false)}
          >
            <Link href="/shops" className="flex items-center gap-1.5 hover:text-cyan-600 transition-colors">
              <Store size={18} className="text-cyan-600" /> Shops <ChevronDown size={14} />
            </Link>

            {showShopDropdown && (
              <div className="absolute top-full left-0 w-64 bg-white border border-slate-100 shadow-2xl rounded-2xl py-4 z-50 animate-in fade-in slide-in-from-top-2">
                <div className="px-4 mb-3">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Official Stores</span>
                </div>
                {loadingShops ? (
                  <div className="px-4 py-2 flex items-center gap-2 text-slate-400 text-xs italic">
                    <Loader2 size={14} className="animate-spin" /> Loading stores...
                  </div>
                ) : (
                  <div className="space-y-1">
                    {shops.map((shop) => (
                      <Link
                        key={shop.shopId}
                        href={`/seller/${shop.shopId}`}
                        className="flex items-center px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-cyan-600 transition-all"
                      >
                        {shop.shopName}
                      </Link>
                    ))}
                    <div className="border-t border-slate-50 mt-2 pt-2 px-4">
                      <Link href="/shops" className="text-xs font-bold text-cyan-600 flex items-center gap-1 hover:underline">
                        View all shops <ChevronRight size={12} />
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <Link href="/brands" className="hover:text-cyan-600 transition-colors">Brands</Link>
          <Link href="/about"  className="hover:text-cyan-600 transition-colors">About Us</Link>
        </nav>
      </div>
    </header>
  );
}
