'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, PackageOpen, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatCurrency, getSalePrice } from '@/lib/format';
import { Product } from '@/types';

const FALLBACK_IMAGE = 'https://placehold.co/400x400/f8fafc/94a3b8?text=No+Image';

interface ProductGridProps {
  products: Product[];
  loading: boolean;
  totalElements: number;
  totalPages: number;
  currentPage: number;
  sortOption: string;
  hasActiveFilters: boolean;
  onClearFilters: () => void;
  onSortChange: (val: string) => void;
  onPageChange: (page: number) => void;
}

export default function ProductGrid({
  products,
  loading,
  totalElements,
  totalPages,
  currentPage,
  sortOption,
  hasActiveFilters,
  onClearFilters,
  onSortChange,
  onPageChange,
}: ProductGridProps) {
  const router = useRouter();

  // Keeps pagination compact when there are many pages.
  const buildPages = (): (number | '...')[] => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const uiPage = currentPage + 1;
    if (uiPage <= 3) return [1, 2, 3, 4, '...', totalPages];
    if (uiPage >= totalPages - 2)
      return [1, 2, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    return [1, 2, '...', uiPage - 1, uiPage, uiPage + 1, '...', totalPages];
  };

  return (
    <div className="w-full lg:w-3/4">
      <div className="bg-white rounded-3xl p-4 md:p-5 border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4 mb-8">
        <div className="text-sm font-medium text-slate-500 flex items-center gap-2">
          <span>
            Showing <span className="font-bold text-slate-900">{totalElements}</span>{' '}
            {hasActiveFilters ? 'results' : 'items'}
          </span>
          {hasActiveFilters && (
            <button
              onClick={onClearFilters}
              className="text-xs bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded-md transition-colors text-slate-600 font-bold"
            >
              Clear All
            </button>
          )}
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <span className="text-sm font-bold text-slate-400">Sort by:</span>
          <select
            value={sortOption}
            onChange={(e) => onSortChange(e.target.value)}
            className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-700 bg-slate-50 focus:outline-none focus:border-cyan-500 cursor-pointer"
          >
            <option value="latest">Latest Items</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="discount_desc">Biggest Discount</option>
          </select>
        </div>
      </div>
      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 bg-white rounded-3xl border border-slate-200 shadow-sm">
          <Loader2 className="w-12 h-12 animate-spin text-cyan-600 mb-4" />
          <p className="text-slate-500 font-medium">Loading products...</p>
        </div>
      ) : products.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 bg-white rounded-3xl border border-slate-200 shadow-sm border-dashed">
          <PackageOpen className="w-16 h-16 text-slate-300 mb-4" />
          <p className="text-xl font-bold text-slate-500 mb-2">No products found</p>
          <button
            onClick={onClearFilters}
            className="mt-6 px-6 py-2.5 bg-cyan-50 text-cyan-600 font-bold rounded-xl hover:bg-cyan-100 transition-colors"
          >
            Clear All Filters
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5">
            {products.map((product) => {
              const salePrice = getSalePrice(product.price, product.discountPercentage);
              const hasDiscount = product.discountPercentage > 0;

              return (
                <div
                  key={product.productId}
                  onClick={() => router.push(`/products/${product.productId}`)}
                  className="group bg-white flex flex-col border border-slate-200 hover:border-cyan-500 hover:shadow-xl hover:shadow-cyan-500/10 rounded-2xl overflow-hidden transition-all duration-300 relative cursor-pointer"
                >
                  {hasDiscount && (
                    <div className="absolute top-0 right-0 bg-yellow-400 text-slate-900 text-[11px] font-black px-2 py-1.5 rounded-bl-lg z-10 flex flex-col items-center leading-none shadow-sm">
                      <span>SALE</span>
                      <span className="text-sm mt-0.5">{product.discountPercentage}%</span>
                    </div>
                  )}

                  <div className="relative w-full aspect-square bg-white p-4 flex items-center justify-center border-b border-slate-50">
                    <img
                      src={product.mainImage || FALLBACK_IMAGE}
                      onError={(e) => { e.currentTarget.src = FALLBACK_IMAGE; }}
                      alt={product.name}
                      className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>

                  <div className="p-4 flex flex-col flex-grow">
                    <h3 className="font-bold text-slate-900 text-sm mb-2 leading-snug group-hover:text-cyan-600 transition-colors line-clamp-2 min-h-[2.5rem]">
                      {product.name}
                    </h3>
                    <div className="flex flex-col mb-4">
                      <span className="text-lg font-black text-cyan-600">
                        {formatCurrency(salePrice)}
                      </span>
                      {hasDiscount && (
                        <span className="text-xs font-medium text-slate-400 line-through mt-0.5">
                          {formatCurrency(product.price)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-12 pb-12">
              <button
                disabled={currentPage === 0}
                onClick={() => onPageChange(currentPage - 1)}
                className="w-10 h-10 flex items-center justify-center rounded-xl bg-white text-slate-600 border border-slate-200 hover:border-cyan-600 hover:text-cyan-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              {buildPages().map((p, idx) =>
                p === '...' ? (
                  <span key={idx} className="w-10 h-10 flex items-center justify-center text-slate-400 font-bold tracking-widest">
                    ...
                  </span>
                ) : (
                  <button
                    key={idx}
                    onClick={() => onPageChange((p as number) - 1)}
                    className={`w-10 h-10 flex items-center justify-center rounded-xl font-bold transition-all shadow-sm ${
                      currentPage === (p as number) - 1
                        ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/20 border-cyan-600'
                        : 'bg-white text-slate-600 border border-slate-200 hover:border-cyan-600 hover:text-cyan-600'
                    }`}
                  >
                    {p}
                  </button>
                )
              )}

              <button
                disabled={currentPage === totalPages - 1}
                onClick={() => onPageChange(currentPage + 1)}
                className="w-10 h-10 flex items-center justify-center rounded-xl bg-white text-slate-600 border border-slate-200 hover:border-cyan-600 hover:text-cyan-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
