'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Heart } from 'lucide-react';
import { getAuth } from '@/lib/auth';
import { apiGet } from '@/lib/api';
import { getSalePrice } from '@/lib/format';

export default function WishlistIcon() {
  const [count, setCount]     = useState(0);
  const [preview, setPreview] = useState<any[]>([]);

  const fetchWishlist = async () => {
    const { token, userId } = getAuth();
    if (!token || !userId) {
      setCount(0);
      setPreview([]);
      return;
    }
    try {
      const data = await apiGet<any[]>('user', `/api/wishlists/${userId}`, { withUserId: false });
      setCount(data.length);

      const top = data.slice(0, 3);
      if (top.length > 0) {
        const ids = top.map((i: any) => i.productId).join(',');
        const products = await apiGet<any[]>(
          'product',
          `/api/internal/products/batch?ids=${ids}`,
          { withAuth: false, withUserId: false }
        );
        setPreview(products ?? []);
      } else {
        setPreview([]);
      }
    } catch {}
  };

  useEffect(() => {
    fetchWishlist();
    window.addEventListener('wishlistUpdated', fetchWishlist);
    window.addEventListener('authUpdated', fetchWishlist);
    window.addEventListener('storage', fetchWishlist);
    return () => {
      window.removeEventListener('wishlistUpdated', fetchWishlist);
      window.removeEventListener('authUpdated', fetchWishlist);
      window.removeEventListener('storage', fetchWishlist);
    };
  }, []);

  return (
    <div className="relative group">
      <div className="relative group">
        <Link href="/wishlist" className="flex text-slate-600 hover:text-cyan-600 transition-colors relative py-2" title="My Wishlist">
          <Heart className="w-6 h-6" />
          {count > 0 && (
            <span className="absolute top-0 -right-1.5 w-4 h-4 bg-red-500 text-[10px] font-bold text-white flex items-center justify-center rounded-full border-2 border-white shadow-sm">
              {count}
            </span>
          )}
        </Link>
        <div className="absolute top-full right-0 w-80 bg-white border border-slate-200 shadow-2xl rounded-2xl overflow-hidden opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50 transform origin-top-right scale-95 group-hover:scale-100">
          <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
            <h4 className="font-bold text-slate-900 text-sm">Recently Saved</h4>
            <span className="text-xs font-bold text-slate-400 bg-white px-2 py-1 rounded-md border border-slate-200">
              {count} Items
            </span>
          </div>

          <div className="max-h-[300px] overflow-y-auto">
            {preview.length > 0 ? (
              preview.map((item) => {
                const salePrice = getSalePrice(item.price, item.discountPercentage || 0);
                const img = item.mainImage
                  ? item.mainImage.split('|')[0]
                  : 'https://placehold.co/100x100?text=No+Image';
                return (
                  <Link
                    key={item.productId}
                    href={`/products/${item.productId}`}
                    className="flex items-center gap-4 p-4 border-b border-slate-50 hover:bg-slate-50 transition-colors group/item"
                  >
                    <div className="w-12 h-12 bg-white rounded-lg border border-slate-100 flex items-center justify-center shrink-0 overflow-hidden">
                      <img
                        src={img}
                        alt={item.name}
                        className="w-full h-full object-cover group-hover/item:scale-110 transition-transform"
                      />
                    </div>
                    <div className="flex flex-col flex-1 min-w-0">
                      <span className="text-sm font-bold text-slate-900 line-clamp-1 group-hover/item:text-cyan-600 transition-colors">
                        {item.name}
                      </span>
                      <span className="text-xs font-black text-red-500 mt-1">
                        ${salePrice.toFixed(2)}
                      </span>
                    </div>
                  </Link>
                );
              })
            ) : (
              <div className="p-6 text-center text-slate-500 text-sm font-medium">
                Your wishlist is empty.
              </div>
            )}
          </div>

          <div className="p-3 bg-white border-t border-slate-100">
            <Link
              href="/wishlist"
              className="block w-full py-2.5 text-center bg-slate-900 text-white font-bold text-sm rounded-xl hover:bg-cyan-600 transition-colors shadow-md"
            >
              View Full Wishlist
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
