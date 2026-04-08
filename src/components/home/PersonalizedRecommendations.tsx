'use client';

import React, { useEffect, useRef, useState } from 'react';
import { CheckCircle2, ChevronLeft, ChevronRight, Loader2, ShoppingCart, Sparkles, TrendingUp, XCircle } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

import { logout } from '@/lib/auth';
import { apiGet, apiPost, isApiError } from '@/lib/api';
import { formatCurrency } from '@/lib/format';

type RecommendationSectionType =
  | 'URGENT'
  | 'RECENTLY_VIEWED'
  | 'FOR_YOU'
  | 'TRENDING'
  | 'SEARCH_RELATED'
  | 'CATEGORY_PICKS';

interface RecommendationItemDto {
  productId: string;
  name: string;
  mainImage?: string;
  price: number;
  stockLeft?: number;
  badge?: string;
  reason?: string;
}

interface RecommendationSection {
  sectionType: RecommendationSectionType;
  title: string;
  items: RecommendationItemDto[];
}

interface RecommendationHomeResponse {
  userId: string;
  strategy: 'COLD_START_TRENDING' | 'PERSONALIZED' | string;
  sections: RecommendationSection[];
}

const FALLBACK_IMAGE = 'https://placehold.co/400x400/f8fafc/94a3b8?text=No+Image';

function getFirstImage(imageUrl?: string) {
  if (!imageUrl) return FALLBACK_IMAGE;
  const first = imageUrl.split('|')[0]?.trim();
  return first || FALLBACK_IMAGE;
}

function normalizeBadgeText(badge?: string): string | null {
  if (!badge) return null;
  const trimmed = badge.trim();
  const lower = trimmed.toLowerCase();
  const ascii = lower.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  if (ascii === 'out of stock' || ascii === 'oos') return 'OUT OF STOCK';

  return trimmed;
}

function isOutOfStock(item: RecommendationItemDto): boolean {
  const normalizedBadge = normalizeBadgeText(item.badge);
  if (normalizedBadge?.toLowerCase() === 'out of stock') return true;
  if (typeof item.stockLeft === 'number' && item.stockLeft <= 0) return true;
  return false;
}

function SectionRow({
  section,
  onAddToCart,
}: {
  section: RecommendationSection;
  onAddToCart: (e: React.MouseEvent, productId: string) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const accent = section.sectionType === 'URGENT' ? 'orange' : 'cyan';
  const borderHover =
    accent === 'orange'
      ? 'border-orange-200 hover:border-orange-500 hover:shadow-orange-500/10'
      : 'border-slate-100 hover:border-cyan-500 hover:shadow-cyan-500/10';
  const reasonColor = accent === 'orange' ? 'text-red-500' : 'text-cyan-600';
  const cartButton =
    accent === 'orange'
      ? 'bg-orange-500 text-white'
      : 'bg-slate-900 text-white hover:bg-cyan-600';

  const showEmptyTrending = section.sectionType === 'TRENDING' && section.items.length === 0;
  const shouldRender = section.items.length > 0 || section.sectionType === 'TRENDING';
  if (!shouldRender) return null;

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const { scrollLeft, clientWidth } = scrollRef.current;
    const scrollTo = direction === 'left' ? scrollLeft - clientWidth : scrollLeft + clientWidth;
    scrollRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
  };

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-black text-slate-900 tracking-tight">{section.title}</h3>
      </div>

      {showEmptyTrending ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <p className="text-sm font-medium text-slate-500">No trending products to display right now.</p>
        </div>
      ) : (
        <div className="relative group">
          <button
            onClick={() => scroll('left')}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 bg-white shadow-lg border border-slate-100 rounded-full p-2 text-slate-600 hover:text-cyan-600 opacity-0 group-hover:opacity-100 transition-opacity hidden md:flex"
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          <div
            ref={scrollRef}
            className="flex gap-4 md:gap-6 overflow-x-auto scroll-smooth scrollbar-hide pb-4 snap-x snap-mandatory"
            style={{ msOverflowStyle: 'none', scrollbarWidth: 'none' }}
          >
            {section.items.map((item) => {
              const outOfStock = isOutOfStock(item);
              const itemImg = getFirstImage(item.mainImage);
              const displayBadge = normalizeBadgeText(item.badge);

              return (
                <div
                  key={item.productId}
                  className="shrink-0 w-[calc(50%-0.5rem)] md:w-[calc(25%-1.125rem)] lg:w-[calc(20%-1.2rem)] snap-start"
                >
                  <Link
                    href={`/products/${item.productId}`}
                    className={`h-full group/card relative flex flex-col bg-white p-4 rounded-2xl shadow-sm border transition-all duration-300 ${borderHover}`}
                  >
                    {displayBadge && (
                      <div
                        className={`absolute top-0 right-0 text-[10px] font-black px-2 py-1.5 rounded-bl-lg z-10 flex flex-col items-center leading-none shadow-sm ${
                          displayBadge?.toLowerCase() === 'out of stock'
                            ? 'bg-red-500 text-white'
                            : item.badge === 'ALMOST SOLD OUT'
                              ? 'bg-red-500 text-white'
                              : 'bg-yellow-400 text-slate-900'
                        }`}
                      >
                        <span className="uppercase">{displayBadge}</span>
                      </div>
                    )}

                    <div className="w-full aspect-square bg-slate-50 rounded-xl mb-4 flex items-center justify-center transition-colors border overflow-hidden group-hover/card:bg-slate-100 border-slate-50">
                      <img
                        src={itemImg}
                        alt={item.name}
                        className="w-full h-full object-contain mix-blend-multiply group-hover/card:scale-110 transition-transform duration-500 p-4"
                      />
                    </div>

                    {item.reason && (
                      <p className={`text-[11px] font-bold uppercase tracking-wider mb-2 ${reasonColor}`}>
                        ✨ {item.reason}
                      </p>
                    )}

                    <h4 className="font-bold text-slate-900 mb-2 leading-snug group-hover/card:text-cyan-600 transition-colors line-clamp-2 min-h-[2.5rem]">
                      {item.name}
                    </h4>

                    <div className="mt-auto flex items-end justify-between pt-4 border-t border-slate-50">
                      <div className="flex flex-col">
                        <span className="text-xl font-black text-slate-900">{formatCurrency(item.price)}</span>
                        <div className="flex items-center gap-1.5 mt-1">
                          {outOfStock ? (
                            <>
                              <XCircle className="w-4 h-4 text-red-500" />
                              <span className="text-[11px] font-bold text-slate-500">Out of stock</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="w-4 h-4 text-green-500" />
                              <span className="text-[11px] font-bold text-slate-500">In stock</span>
                            </>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={(e) => onAddToCart(e, item.productId)}
                        disabled={outOfStock}
                        className={`w-8 h-8 rounded-full flex items-center justify-center transition-all shadow-md ${
                          outOfStock
                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                            : `${cartButton} hover:scale-110`
                        }`}
                        aria-label="Add to cart"
                      >
                        <ShoppingCart className="w-4 h-4" />
                      </button>
                    </div>
                  </Link>
                </div>
              );
            })}
          </div>

          <button
            onClick={() => scroll('right')}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 bg-white shadow-lg border border-slate-100 rounded-full p-2 text-slate-600 hover:text-cyan-600 opacity-0 group-hover:opacity-100 transition-opacity hidden md:flex"
            aria-label="Scroll right"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>
      )}
    </div>
  );
}

export default function PersonalizedRecommendations() {
  const [data, setData] = useState<RecommendationHomeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasToken, setHasToken] = useState(false);

  useEffect(() => {
    const fetchRecommendations = async () => {
      const token =
        (typeof window !== 'undefined' &&
          (localStorage.getItem('accessToken') || localStorage.getItem('token'))) ||
        '';

      if (!token) {
        setHasToken(false);
        setLoading(false);
        return; 
      }

      setHasToken(true);
      try {
        const result = await apiGet<RecommendationHomeResponse>(
          'recommendation',
          '/api/recommendations/home',
          { withUserId: false }
        );
        setData(result);
      } catch (error) {
        if (isApiError(error) && (error.status === 401 || error.status === 403)) {
          logout();
          setHasToken(false);
          return;
        }
        console.error('Failed to load AI recommendations:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, []);

  const handleAddToCart = async (e: React.MouseEvent, productId: string) => {
    e.preventDefault(); 
    e.stopPropagation(); 

    const token =
      (typeof window !== 'undefined' &&
        (localStorage.getItem('accessToken') || localStorage.getItem('token'))) ||
      '';
    const userId = (typeof window !== 'undefined' && localStorage.getItem('userId')) || '';

    if (!token || !userId) {
      toast.error("Please log in to add to cart!");
      return;
    }

    try {
      await apiPost('cart', '/api/cart/add', { productId, quantity: 1 });

      window.dispatchEvent(new Event('cartUpdated'));
      toast.success("Added to cart!");

      apiPost(
        'recommendation',
        '/api/recommendations/track',
        { productId, actionType: 'ADD_TO_CART' },
        { withUserId: false }
      ).catch(() => {});

    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="py-20 flex justify-center"><Loader2 className="w-10 h-10 animate-spin text-orange-500" /></div>;

  const sections = data?.sections ?? [];

  if (!hasToken) {
    return (
      <section className="w-full mt-12 mb-12">
        <div className="flex items-center gap-2 mb-6 pb-4 border-b border-slate-200">
          <TrendingUp className="w-6 h-6 text-slate-400" />
          <h2 className="text-2xl font-black text-slate-400 tracking-tight">Login for Custom Recommendations</h2>
        </div>
      </section>
    );
  }

  const showHeader = sections.length > 0;

  return (
    <section className="w-full mt-12 mb-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-6 pb-4 border-b border-slate-200 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-6 h-6 text-orange-500" />
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Just For You</h2>
          </div>
          {showHeader && (
            <p className="text-sm text-slate-500">
              {data?.strategy === 'COLD_START_TRENDING' ? 'Trending across marketplace' : 'Based on your recent activity'}
            </p>
          )}
        </div>
      </div>

      {sections.map((section) => (
        <SectionRow key={section.sectionType} section={section} onAddToCart={handleAddToCart} />
      ))}
    </section>
  );
}