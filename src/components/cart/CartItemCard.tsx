// ===== src/components/cart/CartItemCard.tsx =====
'use client';

import React from 'react';
import Link from 'next/link';
import { Trash2 } from 'lucide-react';
import { formatCurrency, getFirstImage, getOriginalPrice } from '@/lib/format';
import { CartItemResponse } from '@/types';

interface CartItemCardProps {
  item: CartItemResponse;
  isSelected: boolean;
  isUpdating: boolean;
  onSelect: (itemId: number) => void;
  onUpdateQuantity: (itemId: number, newQty: number) => void;
}

export default function CartItemCard({
  item,
  isSelected,
  isUpdating,
  onSelect,
  onUpdateQuantity,
}: CartItemCardProps) {
  const img = getFirstImage(item.productImage, 'https://placehold.co/200x200?text=No+Image');
  const hasDiscount = item.discountPercentage && item.discountPercentage > 0;
  const originalPrice = hasDiscount
    ? getOriginalPrice(item.unitPrice, item.discountPercentage as number)
    : item.unitPrice;

  return (
    <div
      className={`p-5 flex flex-col sm:flex-row gap-6 items-center sm:items-start transition-all relative
        ${isUpdating ? 'opacity-50 pointer-events-none' : ''}
        ${isSelected ? 'bg-cyan-50/30' : 'hover:bg-slate-50'}`}
    >
      {/* Checkbox */}
      <div className="absolute top-5 left-5 sm:static sm:mt-12 shrink-0">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onSelect(item.itemId)}
          className="w-5 h-5 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500 cursor-pointer"
        />
      </div>

      {/* Product image */}
      <Link
        href={`/products/${item.productId}`}
        className="w-24 h-24 sm:w-28 sm:h-28 shrink-0 bg-white rounded-xl border border-slate-200 flex items-center justify-center p-2 group mt-6 sm:mt-0"
      >
        <img
          src={img}
          alt={item.productName}
          className="w-full h-full object-contain mix-blend-multiply group-hover:scale-110 transition-transform duration-500"
        />
      </Link>

      {/* Info */}
      <div className="flex-1 flex flex-col w-full">
        <div className="pr-10 mb-2">
          <Link href={`/products/${item.productId}`}>
            <h3 className="text-base font-bold text-slate-900 leading-snug hover:text-cyan-600 transition-colors line-clamp-2">
              {item.productName}
            </h3>
          </Link>
        </div>

        {/* Price row */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className="text-lg font-black text-cyan-600">
            {formatCurrency(item.unitPrice)}
          </span>
          {hasDiscount && (
            <>
              <span className="text-sm font-medium text-slate-400 line-through">
                {formatCurrency(originalPrice)}
              </span>
              <span className="bg-yellow-400 text-slate-900 text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider">
                -{item.discountPercentage}%
              </span>
            </>
          )}
        </div>

        {/* Qty + subtotal */}
        <div className="mt-auto flex items-center justify-between">
          <div className="flex items-center bg-white border border-slate-200 rounded-xl p-1 w-28">
            <button
              onClick={() => onUpdateQuantity(item.itemId, item.quantity - 1)}
              className="w-8 h-8 flex items-center justify-center text-slate-600 hover:bg-slate-100 rounded-lg transition-colors font-black"
            >
              -
            </button>
            <input
              type="number"
              value={item.quantity}
              readOnly
              className="flex-1 w-8 text-center font-bold text-slate-900 bg-transparent border-none p-0 focus:ring-0
                [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            />
            <button
              onClick={() => onUpdateQuantity(item.itemId, item.quantity + 1)}
              className="w-8 h-8 flex items-center justify-center text-slate-600 hover:bg-slate-100 rounded-lg transition-colors font-black"
            >
              +
            </button>
          </div>

          <div className="text-right">
            <span className="text-xs font-bold text-slate-400 block">Subtotal</span>
            <span className="text-base font-black text-slate-900">
              {formatCurrency(item.subTotal)}
            </span>
          </div>
        </div>
      </div>

      {/* Remove button */}
      <button
        onClick={() => onUpdateQuantity(item.itemId, 0)}
        className="absolute top-4 right-4 p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
        title="Remove item"
      >
        <Trash2 className="w-5 h-5" />
      </button>
    </div>
  );
}
