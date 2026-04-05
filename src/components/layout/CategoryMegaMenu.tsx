'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Menu, ChevronDown, ChevronRight } from 'lucide-react';
import { CATEGORY_META, DEFAULT_META } from './categoryMeta';

import { apiGet } from '@/lib/api';

export default function CategoryMegaMenu() {
  const [show, setShow]                     = useState(false);
  const [categories, setCategories]         = useState<any[]>([]);
  const [activeCategoryId, setActiveId]     = useState('');
  const ref = useRef<HTMLDivElement>(null);

  // Categories are fetched once and cached in state.
  useEffect(() => {
    (async () => {
      try {
        const data = await apiGet<any[]>('product', '/api/categories', { withUserId: false });
        const merged = (data ?? []).map((cat: any) => ({
          id: cat.categoryId,
          name: cat.name,
          ...(CATEGORY_META[cat.categoryId] || DEFAULT_META),
        }));
        setCategories(merged);
        if (merged.length > 0) setActiveId(merged[0].id);
      } catch {}
    })();
  }, []);

  // Close the menu when clicking outside.
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setShow(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const activeCat = categories.find((c) => c.id === activeCategoryId) || categories[0];

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setShow((v) => !v)}
        className="flex items-center gap-3 bg-slate-900 px-6 py-3.5 text-sm font-bold text-white hover:bg-slate-800 transition-colors shadow-md"
      >
        <Menu className="w-5 h-5" />
        CATEGORIES
        <ChevronDown className={`w-4 h-4 ml-2 transition-transform ${show ? 'rotate-180' : ''}`} />
      </button>

      {show && categories.length > 0 && activeCat && (
        <div className="absolute top-full left-0 w-[960px] bg-white border border-slate-200 shadow-2xl rounded-b-xl overflow-hidden z-50 flex animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="w-1/3 bg-slate-50 border-r border-slate-100 min-h-[450px] max-h-[550px] overflow-y-auto">
            <ul className="flex flex-col py-4">
              {categories.map((cat) => {
                const Icon = cat.icon;
                return (
                  <li key={cat.id}>
                    <div
                      onMouseEnter={() => setActiveId(cat.id)}
                      className={`flex items-center justify-between px-6 py-4 cursor-pointer transition-colors ${
                        activeCategoryId === cat.id
                          ? 'bg-white text-cyan-600 border-l-4 border-cyan-600'
                          : 'text-slate-700 hover:bg-slate-100 border-l-4 border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-3 font-bold text-sm">
                        <Icon className="w-5 h-5" /> {cat.name}
                      </div>
                      <ChevronRight className="w-4 h-4 opacity-50" />
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="w-2/3 p-8 bg-white min-h-[450px] max-h-[550px] overflow-y-auto">
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-100">
              <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                <activeCat.icon className="w-6 h-6 text-cyan-600" />
                {activeCat.name}
              </h3>
              <Link
                href={`/products?category=${activeCat.id}`}
                onClick={() => setShow(false)}
                className="text-sm font-bold text-cyan-600 hover:text-cyan-800 bg-cyan-50 px-4 py-2 rounded-full transition-colors"
              >
                View All Products
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-10">
              <div>
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-5">Popular Brands</h4>
                <ul className="space-y-4">
                  {activeCat.brands.map((brand: string, idx: number) => (
                    <li key={idx}>
                      <Link
                        href={`/products?category=${activeCat.id}&brand=${encodeURIComponent(brand)}`}
                        onClick={() => setShow(false)}
                        className="text-[15px] font-medium text-slate-700 hover:text-cyan-600 hover:translate-x-1 transition-transform inline-block"
                      >
                        {brand}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-5">Shop by Price</h4>
                <ul className="space-y-4">
                  {activeCat.priceRanges.map((price: any, idx: number) => (
                    <li key={idx}>
                      <Link
                        href={`/products?category=${activeCat.id}&minPrice=${price.min}&maxPrice=${price.max}`}
                        onClick={() => setShow(false)}
                        className="text-[15px] font-medium text-slate-700 hover:text-cyan-600 hover:translate-x-1 transition-transform inline-block"
                      >
                        {price.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
