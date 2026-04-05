// Reusable product card used across listing pages
// products listing, wishlist, and shop profile pages.

'use client';

import React from 'react';
import Link from 'next/link';
import { Heart, ShoppingCart, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { formatCurrency, getFirstImage, getSalePrice } from '@/lib/format';

export interface ProductCardProps {
  productId: string;
  name: string;
  price: number;
  mainImage?: string;
  discountPercentage?: number;
  stock: number;

  isWishlisted?: boolean;
  isAddingToCart?: boolean;

  // Called when the wishlist heart is clicked.
  onWishlistToggle?: (e: React.MouseEvent, productId: string) => void;
  // Called when the add-to-cart button is clicked.
  onAddToCart?: (e: React.MouseEvent, productId: string) => void;

  // Accent colour for hover border / price.
  accentColor?: 'cyan' | 'blue' | 'red' | 'orange';

  // Optional label badge (e.g. "NEW", "SALE").
  badge?: string;
  // Badge background class (e.g. "bg-red-500").
  badgeColor?: string;
}

const ACCENT: Record<string, { border: string; price: string; cartHover: string }> = {
  cyan:   { border: 'hover:border-cyan-500 hover:shadow-cyan-500/10',   price: 'text-cyan-600',   cartHover: 'hover:bg-cyan-600'   },
  blue:   { border: 'hover:border-blue-500 hover:shadow-blue-500/10',   price: 'text-blue-600',   cartHover: 'hover:bg-blue-500'   },
  red:    { border: 'hover:border-red-500 hover:shadow-red-500/10',     price: 'text-red-600',    cartHover: 'hover:bg-red-500'    },
  orange: { border: 'hover:border-orange-500 hover:shadow-orange-500/10', price: 'text-orange-600', cartHover: 'hover:bg-orange-500' },
};

export default function ProductCard({
  productId,
  name,
  price,
  mainImage,
  discountPercentage = 0,
  stock,
  isWishlisted = false,
  isAddingToCart = false,
  onWishlistToggle,
  onAddToCart,
  accentColor = 'cyan',
  badge,
  badgeColor = 'bg-red-500',
}: ProductCardProps) {
  const isOutOfStock = stock <= 0;
  const salePrice = getSalePrice(price, discountPercentage);
  const imageUrl = getFirstImage(mainImage);
  const accent = ACCENT[accentColor] ?? ACCENT.cyan;

  return (
    <Link
      href={`/products/${productId}`}
      className={`group relative flex flex-col bg-white p-4 rounded-2xl shadow-sm border border-slate-200 hover:shadow-xl transition-all duration-300 ${accent.border}`}
    >
      <div className="absolute top-4 left-4 right-4 flex justify-between items-start z-10 pointer-events-none">
        {badge ? (
          <span className={`${badgeColor} text-white text-[11px] font-black px-3 py-1.5 rounded-br-xl rounded-tl-lg uppercase tracking-wide shadow-md`}>
            {badge}
          </span>
        ) : discountPercentage > 0 ? (
          <span className="bg-slate-900 text-white text-[10px] font-black px-2 py-1.5 rounded-br-lg rounded-tl-md uppercase tracking-wide shadow-md flex flex-col items-center leading-none">
            <span>Sale</span>
            <span className="text-sm mt-0.5">{discountPercentage}%</span>
          </span>
        ) : (
          <span /> // Keep spacing consistent when no badge is shown.
        )}

        {onWishlistToggle && (
          <button
            onClick={(e) => onWishlistToggle(e, productId)}
            className={`pointer-events-auto p-2 backdrop-blur-sm shadow-sm rounded-full transition-all ${
              isWishlisted
                ? 'bg-red-50 text-red-500'
                : 'bg-white/90 hover:bg-red-50 text-slate-400 hover:text-red-500'
            }`}
          >
            <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-current' : ''}`} />
          </button>
        )}
      </div>

      <div className="w-full aspect-square bg-slate-50 rounded-xl mb-4 flex items-center justify-center overflow-hidden">
        <img
          src={imageUrl}
          alt={name}
          className="w-full h-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-500 p-4"
        />
      </div>

      <h3 className={`font-bold text-slate-900 mb-2 leading-snug group-hover:${accent.price} transition-colors line-clamp-2 h-10 text-sm`}>
        {name}
      </h3>

      <div className="flex flex-col gap-0.5 mb-3">
        <span className={`text-xl font-black ${accent.price}`}>
          {formatCurrency(salePrice)}
        </span>
        {discountPercentage > 0 && (
          <span className="text-xs font-bold text-slate-400 line-through">
            {formatCurrency(price)}
          </span>
        )}
      </div>

      <div className="flex-grow" />

      <div className="mt-2 pt-3 border-t border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          {isOutOfStock ? (
            <>
              <XCircle className="w-4 h-4 text-red-500" />
              <span className="text-[11px] font-bold text-slate-500">Out of Stock</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              <span className="text-[11px] font-bold text-slate-500">In Stock</span>
            </>
          )}
        </div>

        {onAddToCart && (
          <button
            disabled={isOutOfStock || isAddingToCart}
            onClick={(e) => onAddToCart(e, productId)}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
              isOutOfStock || isAddingToCart
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                : `bg-slate-900 text-white ${accent.cartHover} shadow-md hover:scale-110`
            }`}
          >
            {isAddingToCart ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <ShoppingCart className="w-4 h-4" />
            )}
          </button>
        )}
      </div>
    </Link>
  );
}
