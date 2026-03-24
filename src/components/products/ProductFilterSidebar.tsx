// ===== src/components/products/ProductFilterSidebar.tsx =====
'use client';

import React from 'react';
import { Filter, Loader2 } from 'lucide-react';
import { Category } from '@/types';

interface ProductFilterSidebarProps {
  categories: Category[];
  loadingCategories: boolean;
  selectedCategory: string;
  brand: string;
  minPrice: string;
  maxPrice: string;
  onCategoryChange: (val: string) => void;
  onBrandChange: (val: string) => void;
  onMinPriceChange: (val: string) => void;
  onMaxPriceChange: (val: string) => void;
  onApply: () => void;
}

export default function ProductFilterSidebar({
  categories,
  loadingCategories,
  selectedCategory,
  brand,
  minPrice,
  maxPrice,
  onCategoryChange,
  onBrandChange,
  onMinPriceChange,
  onMaxPriceChange,
  onApply,
}: ProductFilterSidebarProps) {
  return (
    <div className="w-full lg:w-1/4 flex flex-col gap-6 sticky top-28">
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
        {/* Header */}
        <div className="flex items-center gap-2 mb-6 pb-4 border-b border-slate-100">
          <Filter className="w-5 h-5 text-slate-900" />
          <h3 className="text-lg font-black text-slate-900">Filters</h3>
        </div>

        {/* Categories */}
        <div className="mb-6">
          <h4 className="font-bold text-slate-900 mb-3">Categories</h4>
          {loadingCategories ? (
            <div className="flex items-center gap-2 text-slate-400 text-sm">
              <Loader2 className="w-4 h-4 animate-spin" /> Loading...
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-2">
              {categories.map((cat) => (
                <label key={cat.categoryId} className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="radio"
                    name="category"
                    value={cat.categoryId}
                    checked={selectedCategory === cat.categoryId}
                    onChange={(e) => onCategoryChange(e.target.value)}
                    className="w-4 h-4 rounded-full border-slate-300 text-cyan-600 focus:ring-cyan-600 cursor-pointer"
                  />
                  <span className={`text-sm font-medium transition-colors ${
                    selectedCategory === cat.categoryId
                      ? 'text-cyan-600 font-bold'
                      : 'text-slate-600 group-hover:text-cyan-600'
                  }`}>
                    {cat.name}
                  </span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Brand */}
        <div className="mb-6">
          <h4 className="font-bold text-slate-900 mb-3">Brand</h4>
          <input
            type="text"
            placeholder="e.g. Apple, Samsung..."
            value={brand}
            onChange={(e) => onBrandChange(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-cyan-500"
          />
        </div>

        {/* Price range */}
        <div>
          <h4 className="font-bold text-slate-900 mb-3">Price Range ($)</h4>
          <div className="flex items-center gap-2">
            <input
              type="number"
              placeholder="Min"
              value={minPrice}
              onChange={(e) => onMinPriceChange(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-cyan-500"
            />
            <span className="text-slate-400">-</span>
            <input
              type="number"
              placeholder="Max"
              value={maxPrice}
              onChange={(e) => onMaxPriceChange(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-cyan-500"
            />
          </div>
          <button
            onClick={onApply}
            className="w-full mt-6 py-2.5 bg-slate-900 text-white text-sm font-bold rounded-xl hover:bg-slate-800 transition-colors shadow-sm"
          >
            Apply Filter
          </button>
        </div>
      </div>
    </div>
  );
}
