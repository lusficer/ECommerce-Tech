// ===== src/components/cart/CartShopGroup.tsx =====
'use client';

import React from 'react';
import Link from 'next/link';
import { Store } from 'lucide-react';
import { CartItemResponse } from '@/types';
import CartItemCard from '@/components/cart/CartItemCard';

interface CartShopGroupProps {
  shopId: string;
  shopName: string;
  items: CartItemResponse[];
  selectedItems: Set<number>;
  updatingId: number | null;
  onSelectShop: (items: CartItemResponse[]) => void;
  onSelectItem: (itemId: number) => void;
  onUpdateQuantity: (itemId: number, newQty: number) => void;
}

export default function CartShopGroup({
  shopId,
  shopName,
  items,
  selectedItems,
  updatingId,
  onSelectShop,
  onSelectItem,
  onUpdateQuantity,
}: CartShopGroupProps) {
  const isShopAllSelected = items.every((item) => selectedItems.has(item.itemId));

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Shop header */}
      <div className="px-5 py-4 border-b border-slate-100 bg-slate-50 flex items-center gap-3">
        <input
          type="checkbox"
          checked={isShopAllSelected}
          onChange={() => onSelectShop(items)}
          className="w-5 h-5 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500 cursor-pointer"
        />
        <Store className="w-5 h-5 text-cyan-600" />
        <Link
          href={`/seller/${shopId}`}
          className="font-black text-slate-800 tracking-wide hover:text-cyan-600 transition-colors"
        >
          {shopName}
        </Link>
      </div>

      {/* Items */}
      <div className="flex flex-col divide-y divide-slate-100">
        {items.map((item) => (
          <CartItemCard
            key={item.itemId}
            item={item}
            isSelected={selectedItems.has(item.itemId)}
            isUpdating={updatingId === item.itemId}
            onSelect={onSelectItem}
            onUpdateQuantity={onUpdateQuantity}
          />
        ))}
      </div>
    </div>
  );
}
