'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ShoppingCart } from 'lucide-react';
import { getAuth } from '@/lib/auth';
import { apiGet } from '@/lib/api';
import { formatCurrency, getFirstImage } from '@/lib/format';

export default function CartIcon() {
  const [count, setCount]   = useState(0);
  const [items, setItems]   = useState<any[]>([]);

  const fetchCart = async () => {
    const { token, userId } = getAuth();
    if (!token || !userId) return;
    try {
      const data = await apiGet<any>('cart', '/api/cart');
      setCount(data?.totalItems || 0);
      setItems(data?.items || []);
    } catch {}
  };

  useEffect(() => {
    fetchCart();
    window.addEventListener('cartUpdated', fetchCart);
    return () => window.removeEventListener('cartUpdated', fetchCart);
  }, []);

  return (
    <div className="relative group flex items-center h-full py-4">
      <Link href="/cart" className="text-slate-600 hover:text-cyan-600 transition-colors relative ml-1 block" title="Shopping Cart">
        <ShoppingCart className="w-6 h-6" />
        {count > 0 && (
          <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-cyan-600 text-[10px] font-bold text-white flex items-center justify-center rounded-full border-2 border-white">
            {count}
          </span>
        )}
      </Link>
      <div className="absolute right-0 top-full w-80 md:w-96 pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-[100] transform origin-top-right scale-95 group-hover:scale-100">
        <div className="bg-white rounded-2xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.15)] border border-slate-100 overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50">
            <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest">Recently Added</h4>
          </div>

          {count === 0 ? (
            <div className="p-8 text-center flex flex-col items-center justify-center">
              <ShoppingCart className="w-12 h-12 text-slate-200 mb-3" />
              <p className="text-sm font-bold text-slate-500">Your cart is empty</p>
            </div>
          ) : (
            <>
              <div className="max-h-[320px] overflow-y-auto p-2">
                {items.slice(0, 5).map((item, idx) => (
                  <Link
                    href={`/products/${item.productId}`}
                    key={idx}
                    className="flex items-center gap-3 p-2.5 hover:bg-slate-50 rounded-xl transition-colors group/item"
                  >
                    <div className="w-14 h-14 bg-white rounded-lg border border-slate-100 flex items-center justify-center p-1.5 shrink-0">
                      <img
                        src={getFirstImage(item.productImage, 'https://placehold.co/100x100?text=No+Image')}
                        alt={item.productName}
                        className="w-full h-full object-contain mix-blend-multiply group-hover/item:scale-110 transition-transform"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-800 truncate">{item.productName}</p>
                      <p className="text-xs font-medium text-slate-500 mt-1">
                        Qty: <span className="text-slate-900">{item.quantity}</span>
                      </p>
                    </div>
                    <p className="text-sm font-black text-cyan-600 shrink-0">
                      {formatCurrency(item.unitPrice)}
                    </p>
                  </Link>
                ))}
              </div>

              <div className="p-4 border-t border-slate-100 bg-white">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-sm font-bold text-slate-500">{count} Items in cart</span>
                  <span className="text-xs font-medium text-slate-400">Taxes excluded</span>
                </div>
                <Link
                  href="/cart"
                  className="w-full py-3 bg-slate-900 text-white text-sm font-black rounded-xl hover:bg-cyan-600 transition-colors flex items-center justify-center shadow-md"
                >
                  View My Cart
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
