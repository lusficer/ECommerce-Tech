'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Zap, Heart, Star, CheckCircle2, XCircle, ShoppingCart, Loader2, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';

interface FlashProduct {
  productId: string;
  name: string;
  price: number;
  mainImage: string;
  discountPercentage: number;
  stock: number;
}

export default function FlashSalePage() {
  const [products, setProducts] = useState<FlashProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  
  const [wishlistedIds, setWishlistedIds] = useState<Set<string>>(new Set());

  const fetchUserWishlist = async () => {
    const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
    const userId = localStorage.getItem('userId');
    if (!token || !userId) return;

    try {
      const res = await fetch(`http://localhost:8081/api/wishlists/${userId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        const ids = new Set<string>(data.map((item: any) => item.productId));
        setWishlistedIds(ids);
      }
    } catch (err) {
      console.error("Error loading wishlist:", err);
    }
  };

  const fetchProducts = async (pageNumber: number) => {
    try {
      const res = await fetch(`http://localhost:8083/api/internal/products/filter?size=12&page=${pageNumber}&sort=discount_desc`);
      if (!res.ok) throw new Error("Failed to load data");
      
      const data = await res.json();
      const newProducts = data.content || [];
      
      if (pageNumber === 0) {
        setProducts(newProducts);
      } else {
        setProducts(prev => [...prev, ...newProducts]);
      }

      setHasMore(!data.last);
    } catch (error) {
      console.error("Error loading Flash Sale page:", error);
      toast.error("Unable to load product list.");
    }
  };

  useEffect(() => {
    fetchProducts(0);
    fetchUserWishlist();
    setLoading(false);
  }, []);

  const handleLoadMore = async () => {
    setLoadingMore(true);
    const nextPage = page + 1;
    await fetchProducts(nextPage);
    setPage(nextPage);
    setLoadingMore(false);
  };

  const handleAddToCart = (e: React.MouseEvent, productId: string) => {
    e.preventDefault();
    e.stopPropagation();
    toast.success("Added to cart!");
  };

  const handleWishlist = async (e: React.MouseEvent, productId: string) => {
    e.preventDefault();
    e.stopPropagation();
    const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
    const userId = localStorage.getItem('userId');
    
    if (!token || !userId) {
      toast.error("Please log in to save products!");
      return;
    }

    try {
      const res = await fetch(`http://localhost:8081/api/wishlists/${userId}/${productId}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (res.ok) {
        const isNowWishlisted = !wishlistedIds.has(productId);
        toast.success(isNowWishlisted ? "Added to Wishlist!" : "Removed from Wishlist!");
        
        // Instantly update heart UI
        setWishlistedIds(prev => {
          const newSet = new Set(prev);
          if (isNowWishlisted) newSet.add(productId);
          else newSet.delete(productId);
          return newSet;
        });

        // Notify Header to update count
        window.dispatchEvent(new Event('wishlistUpdated'));
      }
    } catch (err) {
      toast.error("Server connection error.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-orange-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-20">
      
      <div className="bg-slate-900 py-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-orange-600/20 to-transparent z-0"></div>
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 relative z-10 flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-orange-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-orange-500/30 animate-bounce">
            <Zap className="w-8 h-8 text-white fill-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tight mb-4">
            Flash Sale Lightning Deals
          </h1>
          <p className="text-slate-400 font-medium max-w-lg">
            Grab top tech deals at unbelievable prices. Limited stock, act fast!
          </p>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 mt-8">
        
        <div className="flex items-center text-sm font-bold text-slate-400 mb-8 uppercase tracking-wide">
          <Link href="/" className="hover:text-orange-500 transition-colors">Home</Link> 
          <ChevronRight className="w-4 h-4 mx-2" /> 
          <span className="text-slate-900">Flash Sale</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {products.map((product) => {
            const isOutOfStock = product.stock <= 0;
            const salePrice = product.price * (1 - (product.discountPercentage || 0) / 100);
            const savedAmount = product.price - salePrice;
            const imageUrl = product.mainImage ? product.mainImage.split('|')[0] : "https://placehold.co/400x400?text=No+Image";
            
            const isWishlisted = wishlistedIds.has(product.productId);

            return (
              <Link href={`/products/${product.productId}`} key={product.productId} className="group relative flex flex-col bg-white p-4 rounded-2xl shadow-sm border border-slate-200 hover:border-orange-500 hover:shadow-xl hover:shadow-orange-500/10 transition-all duration-300">
                
                <div className="absolute top-4 left-4 right-4 flex justify-between items-start z-10 pointer-events-none">
                  {product.discountPercentage > 0 && (
                    <span className="bg-orange-500 text-white text-[11px] font-black px-2.5 py-1.5 rounded-br-xl rounded-tl-lg uppercase tracking-wide shadow-md flex flex-col items-center leading-none">
                      <span>Save</span>
                      <span className="text-sm mt-0.5">{product.discountPercentage}%</span>
                    </span>
                  )}
                  <button 
                    onClick={(e) => handleWishlist(e, product.productId)}
                    className={`pointer-events-auto p-2 backdrop-blur-sm shadow-sm rounded-full transition-all ${
                      isWishlisted 
                        ? 'bg-red-50 text-red-500' 
                        : 'bg-white/90 hover:bg-red-50 text-slate-400 hover:text-red-500'
                    }`}
                  >
                    <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-current' : ''}`} />
                  </button>
                </div>

                <div className="w-full aspect-square bg-slate-50 rounded-xl mb-4 flex items-center justify-center group-hover:bg-slate-100 transition-colors overflow-hidden">
                   <img src={imageUrl} alt={product.name} className="w-full h-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-500 p-4" />
                </div>

                <h3 className="font-bold text-slate-900 mb-2 leading-snug group-hover:text-orange-600 transition-colors line-clamp-2 h-10">
                  {product.name}
                </h3>

                <div className="flex flex-col gap-1 mb-4">
                  <span className="text-xl font-black text-orange-600">{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(salePrice)}</span>
                  {product.discountPercentage > 0 && (
                    <span className="text-xs font-bold text-slate-400 line-through">
                      Original: {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(product.price)}
                    </span>
                  )}
                </div>

                <div className="flex-grow"></div>

                <div className="mt-2 pt-4 border-t border-slate-100">
                  <div className="w-full bg-slate-100 rounded-full h-1.5 mb-2 overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${isOutOfStock ? 'bg-slate-300' : 'bg-orange-500'}`} 
                      style={{ width: `${Math.min(100, Math.max(5, (product.stock / 100) * 100))}%` }}
                    ></div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      {isOutOfStock ? (
                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Sold Out</span>
                      ) : (
                        <span className="text-[11px] font-bold text-orange-600 uppercase tracking-wide">{product.stock} left</span>
                      )}
                    </div>
                    
                    <button 
                      disabled={isOutOfStock}
                      onClick={(e) => handleAddToCart(e, product.productId)}
                      className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                        isOutOfStock ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-slate-900 text-white hover:bg-orange-500 hover:scale-110 shadow-md'
                      }`}
                    >
                      <ShoppingCart className="w-4 h-4" />
                    </button>
                  </div>
                </div>

              </Link>
            );
          })}
        </div>

        {hasMore && (
          <div className="flex justify-center mt-12">
            <button 
              onClick={handleLoadMore}
              disabled={loadingMore}
              className="px-8 py-3 bg-white border-2 border-slate-200 text-slate-700 font-bold rounded-xl hover:border-orange-500 hover:text-orange-600 transition-colors flex items-center gap-2"
            >
              {loadingMore ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
              {loadingMore ? 'Loading...' : 'View More Products'}
            </button>
          </div>
        )}

      </div>
    </div>
  );
}