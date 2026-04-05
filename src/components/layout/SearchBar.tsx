'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, Loader2 } from 'lucide-react';

import { apiGet, apiPost } from '@/lib/api';

const FALLBACK = 'https://placehold.co/100x100/f8fafc/94a3b8?text=Img';

export default function SearchBar() {
  const router = useRouter();
  const [input, setInput]             = useState('');
  const [results, setResults]         = useState<any[]>([]);
  const [searching, setSearching]     = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  // Debounce search to avoid spamming the API while typing.
  useEffect(() => {
    const t = setTimeout(() => {
      if (input.trim().length >= 2) fetchResults(input.trim());
      else { setResults([]); setShowDropdown(false); }
    }, 500);
    return () => clearTimeout(t);
  }, [input]);

  // Close the dropdown when clicking outside.
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (formRef.current && !formRef.current.contains(e.target as Node))
        setShowDropdown(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const fetchResults = async (keyword: string) => {
    setSearching(true);
    try {
      const data = await apiGet<any[]>(
        'product',
        `/api/internal/products/search?keyword=${encodeURIComponent(keyword)}`,
        { withUserId: false }
      );
      setResults(data ?? []);
      setShowDropdown(true);
    } catch {} finally { setSearching(false); }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const kw = input.trim();
    if (!kw) return;
    setShowDropdown(false);
    router.push(`/products?keyword=${encodeURIComponent(kw)}`);

    // Fire-and-forget tracking so search stays snappy.
    apiPost(
      'recommendation',
      '/api/recommendations/track',
      { actionType: 'SEARCH', searchKeyword: kw },
      { withUserId: false }
    ).catch(() => {});
  };

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      className="hidden md:flex flex-1 max-w-3xl relative mx-8"
    >
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onFocus={() => { if (results.length > 0) setShowDropdown(true); }}
        placeholder="Search for laptops, PC components, accessories..."
        className={`w-full bg-slate-100 border focus:bg-white focus:border-cyan-500 py-3.5 pl-6 pr-14 text-sm text-slate-900 transition-all placeholder:text-slate-500 shadow-sm outline-none ${
          showDropdown ? 'border-cyan-500 rounded-t-2xl' : 'border-transparent rounded-full'
        }`}
      />
      {searching && (
        <Loader2 className="absolute right-12 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-cyan-600" />
      )}
      <button
        type="submit"
        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-cyan-600 rounded-full text-white hover:bg-cyan-700 transition-colors shadow-sm"
      >
        <Search className="w-4 h-4" />
      </button>

      {showDropdown && (
        <div className="absolute top-full left-0 right-0 bg-white border border-t-0 border-cyan-500 rounded-b-2xl shadow-xl overflow-hidden z-50">
          {results.length === 0 && !searching ? (
            <div className="p-4 text-center text-sm text-slate-500">
              No products found for "{input}"
            </div>
          ) : (
            <ul className="max-h-[400px] overflow-y-auto">
              {results.map((product) => (
                <li key={product.productId} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                  <Link
                    href={`/products/${product.productId}`}
                    onClick={() => setShowDropdown(false)}
                    className="flex items-center gap-4 p-3"
                  >
                    <div className="w-12 h-12 bg-white rounded-lg border border-slate-100 flex items-center justify-center shrink-0">
                      <img
                        src={product.mainImage || FALLBACK}
                        onError={(e) => { e.currentTarget.src = FALLBACK; }}
                        alt={product.name}
                        className="w-full h-full object-contain p-1"
                      />
                    </div>
                    <div className="flex flex-col flex-1 min-w-0">
                      <span className="text-sm font-bold text-slate-900 line-clamp-1">{product.name}</span>
                      <span className="text-xs font-black text-cyan-600">${product.price}</span>
                    </div>
                  </Link>
                </li>
              ))}
              <li className="bg-slate-50 p-2 text-center">
                <button
                  type="submit"
                  className="text-xs font-bold text-cyan-600 hover:text-cyan-700 w-full"
                >
                  View all results for "{input}"
                </button>
              </li>
            </ul>
          )}
        </div>
      )}
    </form>
  );
}
