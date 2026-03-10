'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Zap, Heart, Star, CheckCircle2, XCircle, ShoppingCart, ArrowRight, Flame, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';

interface FlashProduct {
  productId: string;
  name: string;
  price: number;
  mainImage: string;
  discountPercentage: number;
  stock: number;
}

export default function FlashSale() {
  const [products, setProducts] = useState<FlashProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'sale' | 'new' | 'best'>('sale');
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
      console.error("Error loading homepage wishlist:", err);
    }
  };

  // Fetch product data
  useEffect(() => {
    const fetchTabProducts = async () => {
      setLoading(true);
      try {
        let url = '';
        if (activeTab === 'sale') {
          url = 'http://localhost:8083/api/internal/products/filter?size=4&sort=discount_desc';
        } else if (activeTab === 'new') {
          url = 'http://localhost:8083/api/internal/products/filter?size=4&sort=latest'; 
        } else if (activeTab === 'best') {
          url = 'http://localhost:8083/api/internal/products/trending'; 
        }

        const res = await fetch(url);
        if (!res.ok) throw new Error("Failed to fetch products");
        
        const data = await res.json();
        setProducts(data.content ? data.content.slice(0, 4) : data.slice(0, 4));
      } catch (error) {
        console.error("Error loading homepage data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTabProducts();
  }, [activeTab]); 

  useEffect(() => {
    fetchUserWishlist();
  }, []);

  const handleAddToCart = async (e: React.MouseEvent, productId: string) => {
    e.preventDefault(); 
    e.stopPropagation();
    
    const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
    const userId = localStorage.getItem('userId');

    if (!token || !userId) {
      toast.error("Vui lòng đăng nhập để thêm vào giỏ hàng!");
      return;
    }

    try {
      // 1. Gọi API Cart Service
      const res = await fetch(`http://localhost:8088/api/cart/add`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`, 
          'Content-Type': 'application/json',
          'userId': userId
        },
        body: JSON.stringify({ 
          productId: productId,
          quantity: 1 // Click ở trang chủ thì mặc định thêm 1 cái
        })
      });

      if (!res.ok) {
        const errorText = await res.text();
        toast.error(errorText || "Lỗi khi thêm vào giỏ hàng!");
        return;
      }

      toast.success("Đã thêm vào giỏ hàng!");
      // 2. Kích hoạt sự kiện để Header tự nảy số
      window.dispatchEvent(new Event('cartUpdated'));

      // 3. [AI LOG] TRACK ADD TO CART
      fetch(`http://localhost:8090/api/recommendations/track`, {
         method: 'POST',
         headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
         body: JSON.stringify({ 
           productId: productId, 
           actionType: 'ADD_TO_CART' 
         })
      }).catch(() => {});

    } catch (err) {
      toast.error("Không thể kết nối đến máy chủ giỏ hàng.");
    }
  };

  const handleWishlist = async (e: React.MouseEvent, productId: string) => {
    e.preventDefault(); e.stopPropagation();
    const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
    const userId = localStorage.getItem('userId');
    
    if (!token || !userId) { toast.error("Please log in!"); return; }

    try {
      const res = await fetch(`http://localhost:8081/api/wishlists/${userId}/${productId}`, {
        method: 'POST', headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const isNowWishlisted = !wishlistedIds.has(productId);
        toast.success(isNowWishlisted ? "Added to Wishlist!" : "Removed from Wishlist!");
        
        setWishlistedIds(prev => {
          const newSet = new Set(prev);
          if (isNowWishlisted) newSet.add(productId);
          else newSet.delete(productId);
          return newSet;
        });

        window.dispatchEvent(new Event('wishlistUpdated'));
      }
    } catch (err) { toast.error("Server connection error."); }
  };

  const getSeeMoreLink = () => {
    if (activeTab === 'sale') return '/flash-sale';
    if (activeTab === 'new') return '/new-releases';
    return '/best-sellers';
  };

  return (
    <section className="w-full mt-12 bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-100 flex flex-col md:flex-row min-h-[480px]">
      
      {/* Left Sidebar */}
      <div className="w-full md:w-[320px] bg-slate-900 p-8 flex flex-col items-center justify-center relative overflow-hidden shrink-0">
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-0"></div>
        <div className="relative z-10 w-full text-center">
           
           <div className="flex items-center justify-center gap-2 mb-8 animate-pulse">
              {activeTab === 'sale' && <Zap className="text-orange-500 w-10 h-10 fill-orange-500" />}
              {activeTab === 'new' && <Sparkles className="text-blue-500 w-10 h-10 fill-blue-500" />}
              {activeTab === 'best' && <Flame className="text-red-500 w-10 h-10 fill-red-500" />}
              
              <h2 className="text-3xl font-black text-white uppercase tracking-tight">
                {activeTab === 'sale' ? 'Flash Sale' : activeTab === 'new' ? 'New Arrivals' : 'Trending'}
              </h2>
           </div>

           <div className="space-y-4 w-full max-w-[220px] mx-auto text-left">
             <button onClick={() => setActiveTab('sale')} className={`w-full text-left text-sm font-black pb-2 flex justify-between transition-colors ${activeTab === 'sale' ? 'text-white border-b-2 border-orange-500' : 'text-slate-400 border-b border-slate-800 hover:text-white'}`}>
                UP TO 80% OFF {activeTab === 'sale' && <span className="text-orange-500">→</span>}
             </button>
             <button onClick={() => setActiveTab('new')} className={`w-full text-left text-sm font-black pb-2 flex justify-between transition-colors ${activeTab === 'new' ? 'text-white border-b-2 border-blue-500' : 'text-slate-400 border-b border-slate-800 hover:text-white'}`}>
                NEW RELEASES {activeTab === 'new' && <span className="text-blue-500">→</span>}
             </button>
             <button onClick={() => setActiveTab('best')} className={`w-full text-left text-sm font-black pb-2 flex justify-between transition-colors ${activeTab === 'best' ? 'text-white border-b-2 border-red-500' : 'text-slate-400 border-b border-slate-800 hover:text-white'}`}>
                BEST SELLERS {activeTab === 'best' && <span className="text-red-500">→</span>}
             </button>
           </div>
        </div>
        
        <div className={`absolute -bottom-10 right-0 w-48 h-48 rounded-full blur-3xl z-0 pointer-events-none transition-colors duration-700 ${activeTab === 'sale' ? 'bg-orange-500/20' : activeTab === 'new' ? 'bg-blue-500/20' : 'bg-red-500/20'}`}></div>
      </div>

      {/* Right Product Grid */}
      <div className="flex-1 p-6 md:p-8 bg-slate-50 flex flex-col">
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className={`w-10 h-10 border-4 border-t-transparent rounded-full animate-spin ${activeTab === 'sale' ? 'border-orange-500' : activeTab === 'new' ? 'border-blue-500' : 'border-red-500'}`}></div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {products.map((product) => {
                const isOutOfStock = (product.stock ?? 0) <= 0;
                const salePrice = product.price * (1 - (product.discountPercentage || 0) / 100);
                const imageUrl = product.mainImage ? product.mainImage.split('|')[0] : "https://placehold.co/400x400?text=No+Image";

                const isWishlisted = wishlistedIds.has(product.productId);

                return (
                  <Link href={`/products/${product.productId}`} key={product.productId} className="group relative flex flex-col bg-white p-4 rounded-2xl shadow-sm border border-slate-100 hover:border-slate-300 hover:shadow-xl transition-all duration-300">
                    
                    <div className="absolute top-4 left-4 right-4 flex justify-between items-start z-10 pointer-events-none">
                      {product.discountPercentage > 0 && (
                        <span className="bg-slate-900 text-white text-[10px] font-black px-2 py-1.5 rounded-br-lg rounded-tl-md uppercase tracking-wide shadow-md flex flex-col items-center leading-none">
                          <span>Sale</span><span className="text-sm mt-0.5">{product.discountPercentage}%</span>
                        </span>
                      )}
                      
                      <button 
                        onClick={(e) => handleWishlist(e, product.productId)} 
                        className={`pointer-events-auto p-2 backdrop-blur-sm shadow-sm rounded-full ml-auto transition-all ${
                          isWishlisted ? 'bg-red-50 text-red-500' : 'bg-white/80 hover:bg-red-50 text-slate-400 hover:text-red-500'
                        }`}
                      >
                        <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-current' : ''}`} />
                      </button>

                    </div>

                    <div className="w-full aspect-square bg-slate-50 rounded-xl mb-4 flex items-center justify-center group-hover:bg-slate-100 transition-colors border border-slate-50 overflow-hidden">
                      <img src={imageUrl} alt={product.name} className="w-full h-full object-contain mix-blend-multiply group-hover:scale-110 transition-transform duration-500 p-4" />
                    </div>

                    <h3 className="font-bold text-slate-900 mb-2 leading-snug group-hover:text-cyan-600 transition-colors line-clamp-2 h-10">{product.name}</h3>

                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-xl font-black text-slate-900">${salePrice.toFixed(2)}</span>
                      {product.discountPercentage > 0 && <span className="text-xs font-bold text-slate-400 line-through">${product.price.toFixed(2)}</span>}
                    </div>

                    <div className="flex-grow"></div>

                    <div className="flex items-center justify-between mt-2 pt-4 border-t border-slate-50">
                      <div className="flex items-center gap-1.5">
                        {isOutOfStock ? (
                          <><XCircle className="w-4 h-4 text-red-500" /><span className="text-[11px] font-bold text-slate-500">Sold out</span></>
                        ) : (
                          <><CheckCircle2 className="w-4 h-4 text-green-500" /><span className="text-[11px] font-bold text-slate-500">{product.stock} Left</span></>
                        )}
                      </div>
                      
                      <button disabled={isOutOfStock} onClick={(e) => handleAddToCart(e, product.productId)} className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${isOutOfStock ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-slate-900 text-white hover:bg-cyan-600 hover:scale-110 shadow-md'}`}>
                        <ShoppingCart className="w-4 h-4" />
                      </button>
                    </div>
                  </Link>
                );
              })}
            </div>

            <div className="mt-8 pt-6 border-t border-slate-200 flex justify-center mt-auto">
               <Link href={getSeeMoreLink()} className="flex items-center gap-2 px-8 py-3 bg-white border-2 border-slate-200 rounded-xl font-black text-slate-700 hover:border-slate-900 hover:text-slate-900 transition-all shadow-sm group">
                 See All {activeTab === 'sale' ? 'Flash Sale' : activeTab === 'new' ? 'New Releases' : 'Best Sellers'}
                 <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
               </Link>
            </div>
          </>
        )}
      </div>
    </section>
  );
}