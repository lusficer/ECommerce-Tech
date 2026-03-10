'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Heart, Star, ShoppingCart, TrendingUp, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
interface RecommendationItem {
  productId: string;
  name: string;
  mainImage: string;
  price: number;
  stockLeft: number;
  badge?: string;
  reason?: string;
}

interface RecommendationResponse {
  userId: string;
  strategy: string;
  urgentItems: RecommendationItem[];
  suggestedItems: RecommendationItem[];
}

export default function PersonalizedRecommendations() {
  const [data, setData] = useState<RecommendationResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchRecommendations = async () => {
      const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
      
      if (!token) {
        setIsLoggedIn(false);
        setLoading(false);
        return; 
      }

      setIsLoggedIn(true);
      try {
        const response = await fetch('http://localhost:8090/api/recommendations/home', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
          const result = await response.json();
          setData(result);
        }
      } catch (error) {
        console.error("Lỗi tải AI Recommendation:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, []);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const scrollTo = direction === 'left' ? scrollLeft - clientWidth : scrollLeft + clientWidth;
      scrollRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
    }
  };

  const fallbackImage = "https://placehold.co/400x400/f8fafc/94a3b8?text=No+Image";

  const handleAddToCart = async (e: React.MouseEvent, productId: string) => {
    e.preventDefault(); 
    e.stopPropagation(); 
    
    const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
    const userId = localStorage.getItem('userId');

    if (!token || !userId) {
      toast.error("Please log in to add to cart!");
      return;
    }

    try {
      const res = await fetch(`http://localhost:8088/api/cart/add`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`, 
          'Content-Type': 'application/json',
          'userId': userId
        },
        body: JSON.stringify({ productId: productId, quantity: 1 })
      });

      if (!res.ok) return;

      window.dispatchEvent(new Event('cartUpdated'));
      toast.success("Added to cart!");

      fetch(`http://localhost:8090/api/recommendations/track`, {
         method: 'POST',
         headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
         body: JSON.stringify({ productId: productId, actionType: 'ADD_TO_CART' })
      }).catch(() => {});

    } catch (err) {
      console.error(err);
    }
  };

  const renderProductCard = (item: RecommendationItem, isUrgent: boolean = false) => {
    const itemImg = item.mainImage ? item.mainImage.split('|')[0] : fallbackImage;
    
    return (
      <Link href={`/products/${item.productId}`} key={item.productId} className={`h-full group relative flex flex-col bg-white p-4 rounded-2xl shadow-sm border transition-all duration-300 ${isUrgent ? 'border-orange-200 hover:border-orange-500 hover:shadow-orange-500/10' : 'border-slate-100 hover:border-cyan-500 hover:shadow-cyan-500/10'}`}>
        
        {item.badge && (
          <div className={`absolute top-0 right-0 text-[10px] font-black px-2 py-1.5 rounded-bl-lg z-10 flex flex-col items-center leading-none shadow-sm ${item.badge === 'ALMOST SOLD OUT' ? 'bg-red-500 text-white' : 'bg-yellow-400 text-slate-900'}`}>
            <span className="uppercase">{item.badge}</span>
          </div>
        )}

        <div className={`w-full aspect-square bg-slate-50 rounded-xl mb-4 flex items-center justify-center transition-colors border overflow-hidden ${isUrgent ? 'group-hover:bg-orange-50 border-orange-50' : 'group-hover:bg-slate-100 border-slate-50'}`}>
          <img src={itemImg} alt={item.name} className="w-full h-full object-contain mix-blend-multiply group-hover:scale-110 transition-transform duration-500 p-4" />
        </div>

        {item.reason && (
           <p className={`text-[11px] font-bold uppercase tracking-wider mb-2 ${isUrgent ? 'text-red-500' : 'text-cyan-600'}`}>
             ✨ {item.reason}
           </p>
        )}

        <h3 className="font-bold text-slate-900 mb-2 leading-snug group-hover:text-cyan-600 transition-colors line-clamp-2 min-h-[2.5rem]">
          {item.name}
        </h3>

        <div className="mt-auto flex items-end justify-between pt-4 border-t border-slate-50">
          <span className="text-xl font-black text-slate-900">
             {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(item.price)}
          </span>
          <button 
             onClick={(e) => handleAddToCart(e, item.productId)}
             className={`w-8 h-8 rounded-full flex items-center justify-center transition-all shadow-md ${isUrgent ? 'bg-orange-500 text-white hover:scale-110' : 'bg-slate-900 text-white hover:bg-cyan-600 hover:scale-110'}`}
          >
             <ShoppingCart className="w-4 h-4" />
          </button>
        </div>
      </Link>
    );
  };

  if (loading) return <div className="py-20 flex justify-center"><Loader2 className="w-10 h-10 animate-spin text-orange-500" /></div>;

  const urgentItems = data?.urgentItems || [];
  const suggestedItems = data?.suggestedItems || [];
  const allItems = [...urgentItems, ...suggestedItems];

  if (!isLoggedIn || allItems.length === 0) {
    return (
      <section className="w-full mt-12 mb-12">
        <div className="flex items-center gap-2 mb-6 pb-4 border-b border-slate-200">
          <TrendingUp className="w-6 h-6 text-slate-400" />
          <h2 className="text-2xl font-black text-slate-400 tracking-tight">Login for Custom Recommendations</h2>
        </div>
      </section>
    );
  }

  // Set for quick lookup of urgent items
  const urgentIds = new Set(urgentItems.map(i => i.productId));

  return (
    <section className="w-full mt-12 mb-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-6 pb-4 border-b border-slate-200 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-6 h-6 text-orange-500" />
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Just For You</h2>
          </div>
          <p className="text-sm text-slate-500">
            Powered by AI • {data?.strategy === 'COLD_START_TRENDING' ? 'Trending across marketplace' : 'Based on your recent activity'}
          </p>
        </div>
      </div>

      {/* CAROUSEL AREA */}
      <div className="relative group">
        {/* Left Scroll Button */}
        <button 
          onClick={() => scroll('left')} 
          className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 bg-white shadow-lg border border-slate-100 rounded-full p-2 text-slate-600 hover:text-cyan-600 opacity-0 group-hover:opacity-100 transition-opacity hidden md:flex"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        {/* Scrollbar-hidden scroll area (shows 5 items on Desktop) */}
        <div 
          ref={scrollRef} 
          className="flex gap-4 md:gap-6 overflow-x-auto scroll-smooth scrollbar-hide pb-4 snap-x snap-mandatory"
          style={{ msOverflowStyle: 'none', scrollbarWidth: 'none' }}
        >
          {allItems.map(item => (
            <div 
              key={item.productId} 
              // Width config: Mobile 2 columns, Tablet 4 columns, Desktop 5 columns
              className="shrink-0 w-[calc(50%-0.5rem)] md:w-[calc(25%-1.125rem)] lg:w-[calc(20%-1.2rem)] snap-start"
            >
              {renderProductCard(item, urgentIds.has(item.productId))}
            </div>
          ))}
        </div>

        {/* Right Scroll Button */}
        <button 
          onClick={() => scroll('right')} 
          className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 bg-white shadow-lg border border-slate-100 rounded-full p-2 text-slate-600 hover:text-cyan-600 opacity-0 group-hover:opacity-100 transition-opacity hidden md:flex"
        >
          <ChevronRight className="w-6 h-6" />
        </button>

      </div>
    </section>
  );
}