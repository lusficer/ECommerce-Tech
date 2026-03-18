'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Flame, Heart, CheckCircle2, XCircle, ShoppingCart, Loader2, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';

interface Product {
  productId: string; name: string; price: number; mainImage: string; discountPercentage: number; stock: number;
}

export default function NewReleasesPage() {
  const [products, setProducts] = useState<Product[]>([]);
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
      const res = await fetch(`http://localhost:8081/api/wishlists/${userId}`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        setWishlistedIds(new Set(data.map((item: any) => item.productId)));
      }
    } catch (err) {}
  };

  const fetchProducts = async (pageNumber: number) => {
    try {
      const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
      const res = await fetch('http://localhost:8083/api/internal/products/trending', { headers: { 'Authorization': `Bearer ${token}` } });
      if (!res.ok) throw new Error("Failed to load data");
      const data = await res.json();
      const newProducts = data || [];
      if (pageNumber === 0) setProducts(newProducts);
      else setProducts(prev => [...prev, ...newProducts]);
      setHasMore(!data);
    } catch (error) { toast.error("Unable to load product list."); }
  };

  useEffect(() => { fetchProducts(0); fetchUserWishlist(); setLoading(false); }, []);

  
  const handleWishlist = async (e: React.MouseEvent, productId: string) => {
    e.preventDefault(); e.stopPropagation();
    const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
    const userId = localStorage.getItem('userId');
    if (!token || !userId) { toast.error("Please log in!"); return; }
    try {
      const res = await fetch(`http://localhost:8081/api/wishlists/${userId}/${productId}`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) {
        const isNowWishlisted = !wishlistedIds.has(productId);
        toast.success(isNowWishlisted ? "Added to Wishlist!" : "Removed from Wishlist!");
        setWishlistedIds(prev => { const newSet = new Set(prev); isNowWishlisted ? newSet.add(productId) : newSet.delete(productId); return newSet; });
        window.dispatchEvent(new Event('wishlistUpdated'));
      }
    } catch (err) { toast.error("Connection error."); }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-12 h-12 text-red-500 animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-20">
      <div className="bg-slate-900 py-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-transparent z-0"></div>
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 relative z-10 flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-red-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-blue-500/30 animate-pulse">
            <Flame className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tight mb-4">Best Sellers</h1>
          <p className="text-slate-400 font-medium max-w-lg">Discover the hottest best-selling tech products on the market.</p>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 mt-8">
        <div className="flex items-center text-sm font-bold text-slate-400 mb-8 uppercase tracking-wide">
          <Link href="/" className="hover:text-red-500 transition-colors">Home</Link> <ChevronRight className="w-4 h-4 mx-2" /> <span className="text-slate-900">Best Sellers</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {products.map((product) => {
            const isOutOfStock = product.stock <= 0;
            const salePrice = product.price * (1 - (product.discountPercentage || 0) / 100);
            const isWishlisted = wishlistedIds.has(product.productId);
            return (
              <Link href={`/products/${product.productId}`} key={product.productId} className="group relative flex flex-col bg-white p-4 rounded-2xl shadow-sm border border-slate-200 hover:border-blue-500 hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300">
                <div className="absolute top-4 left-4 right-4 flex justify-between items-start z-10 pointer-events-none">
                  <span className="bg-red-500 text-white text-[11px] font-black px-3 py-1.5 rounded-br-xl rounded-tl-lg uppercase tracking-wide shadow-md">NEW</span>
                  <button onClick={(e) => handleWishlist(e, product.productId)} className={`pointer-events-auto p-2 backdrop-blur-sm shadow-sm rounded-full transition-all ${isWishlisted ? 'bg-red-50 text-red-500' : 'bg-white/90 hover:bg-red-50 text-slate-400 hover:text-red-500'}`}><Heart className={`w-4 h-4 ${isWishlisted ? 'fill-current' : ''}`} /></button>
                </div>
                <div className="w-full aspect-square bg-slate-50 rounded-xl mb-4 flex items-center justify-center overflow-hidden">
                   <img src={product.mainImage ? product.mainImage.split('|')[0] : "https://placehold.co/400x400"} alt={product.name} className="w-full h-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-500 p-4" />
                </div>
                <h3 className="font-bold text-slate-900 mb-2 leading-snug group-hover:text-blue-600 transition-colors line-clamp-2 h-10">{product.name}</h3>
                <div className="flex flex-col gap-1 mb-4">
                  <span className="text-xl font-black text-blue-600">${salePrice.toFixed(2)}</span>
                </div>
                <div className="flex-grow"></div>
                <div className="mt-2 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    {isOutOfStock ? <><XCircle className="w-4 h-4 text-red-500" /><span className="text-[11px] font-bold text-slate-500">Out of Stock</span></> : <><CheckCircle2 className="w-4 h-4 text-green-500" /><span className="text-[11px] font-bold text-blue-600">Ready to ship</span></>}
                  </div>
                    <button disabled={isOutOfStock} onClick={(e) => { e.preventDefault(); toast.success("Added to cart"); }} className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${isOutOfStock ? 'bg-slate-100 text-slate-400' : 'bg-slate-900 text-white hover:bg-red-500 shadow-md'}`}><ShoppingCart className="w-4 h-4" /></button>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}