'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Trash2, ShoppingCart, ChevronRight, HeartCrack, Loader2, Heart } from 'lucide-react';
import toast from 'react-hot-toast';

interface WishlistItem {
  productId: string;
  name: string;
  price: number;
  mainImage: string;
  discountPercentage: number;
  stock: number;
  addedAt: string; 
}

export default function WishlistPage() {
  const router = useRouter();
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
    const userId = localStorage.getItem('userId');
    if (!token) {
      toast.error("Please log in to view your wishlist!");
      router.push('/login?redirect=/wishlist');
      return;
    }

    const fetchWishlist = async () => {
      try {
        const wishlistRes = await fetch(`http://localhost:8081/api/wishlists/${userId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (wishlistRes.status === 401 || wishlistRes.status === 403) {
          localStorage.removeItem('accessToken');
          toast.error("Login session expired!");
          router.push('/login?redirect=/wishlist');
          return;
        }

        if (wishlistRes.ok) {
          const wishlistData = await wishlistRes.json(); 
          
          if (wishlistData.length === 0) {
            setItems([]);
            setLoading(false);
            return;
          }

          const productPromises = wishlistData.map(async (item: any) => {
            const prodRes = await fetch(`http://localhost:8083/api/internal/products/${item.productId}`);
            if (prodRes.ok) {
              const prodData = await prodRes.json();
              return {
                ...prodData,
                addedAt: item.addedAt 
              };
            }
            return null;
          });

          const products = await Promise.all(productPromises);
          
          setItems(products.filter(p => p !== null));
        }
      } catch (error) {
        console.error("Error loading Wishlist:", error);
        toast.error("Unable to load wishlist at this moment.");
      } finally {
        setLoading(false);
      }
    };

    fetchWishlist();
  }, [router]);

  const handleRemoveItem = async (productId: string) => {
    const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
    const userId = localStorage.getItem('userId');

    try {
      const res = await fetch(`http://localhost:8081/api/wishlists/${userId}/${productId}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        setItems(prev => prev.filter(item => item.productId !== productId));
        toast.success("Removed from wishlist!");
        
        window.dispatchEvent(new Event('wishlistUpdated'));
      }
    } catch (error) {
      toast.error("An error occurred while removing!");
    }
  };

  const handleAddToCart = async (productId: string) => {
    const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
    const userId = localStorage.getItem('userId');

    if (!token || !userId) {
      toast.error("Please login to add to cart!");
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
        body: JSON.stringify({ 
          productId: productId,
          quantity: 1 
        })
      });

      if (!res.ok) {
        const errorText = await res.text();
        toast.error(errorText || "Error adding to cart!");
        return;
      }

      toast.success("Added to cart!");
      
      window.dispatchEvent(new Event('cartUpdated'));

      fetch(`http://localhost:8090/api/recommendations/track`, {
         method: 'POST',
         headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
         body: JSON.stringify({ 
           productId: productId, 
           actionType: 'ADD_TO_CART' 
         })
      }).catch(() => {});

    } catch (err) {
      toast.error("Unable to connect to the cart server.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
        <Loader2 className="w-12 h-12 text-cyan-600 animate-spin mb-4" />
        <p className="text-slate-500 font-bold">Loading your wishlist...</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen py-10 font-sans">
      <div className="max-w-[1000px] mx-auto px-4 sm:px-6">
        
        <div className="flex items-center text-sm font-bold text-slate-400 mb-8 uppercase tracking-wide">
          <Link href="/" className="hover:text-cyan-600 transition-colors">Home</Link> 
          <ChevronRight className="w-4 h-4 mx-2" /> 
          <span className="text-slate-900">My Wishlist</span>
        </div>

        <div className="flex items-center gap-3 mb-8">
          <Heart className="w-8 h-8 text-red-500 fill-current" />
          <h1 className="text-3xl font-black text-slate-900">My Wishlist</h1>
          <span className="ml-2 bg-slate-200 text-slate-700 py-1 px-3 rounded-full text-sm font-bold">
            {items.length} Items
          </span>
        </div>

        {items.length === 0 ? (
          <div className="bg-white rounded-3xl p-16 text-center shadow-sm border border-slate-200 flex flex-col items-center">
            <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6">
              <HeartCrack className="w-12 h-12 text-slate-300" />
            </div>
            <h2 className="text-2xl font-black text-slate-800 mb-3">Your wishlist is empty</h2>
            <p className="text-slate-500 mb-8 max-w-md">You haven't saved any items yet. Start exploring our collections and add your favorite products here!</p>
            <Link href="/products" className="bg-slate-900 text-white px-8 py-3.5 rounded-xl font-bold hover:bg-cyan-600 transition-colors shadow-lg">
              Explore Products
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {items.map((item) => {
              const salePrice = item.price * (1 - (item.discountPercentage || 0) / 100);
              
              const isOutOfStock = false; 
              
              const imageUrl = item.mainImage ? item.mainImage.split('|')[0] : "https://placehold.co/400x400/f8fafc/94a3b8?text=No+Image";

              return (
                <div key={item.productId} className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-slate-200 flex flex-col sm:flex-row items-center gap-6 group hover:border-cyan-300 transition-colors">
                  
                  <Link href={`/products/${item.productId}`} className="w-full sm:w-32 h-32 bg-slate-50 rounded-xl border border-slate-100 p-2 shrink-0 flex items-center justify-center relative overflow-hidden cursor-pointer">
                    <img src={imageUrl} alt={item.name} className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500" />
                  </Link>

                  <div className="flex-1 text-center sm:text-left">
                    <Link href={`/products/${item.productId}`}>
                      <h3 className="text-lg font-bold text-slate-900 hover:text-cyan-600 transition-colors line-clamp-2 mb-2">
                        {item.name}
                      </h3>
                    </Link>
                    <div className="flex items-center justify-center sm:justify-start gap-3 mb-2">
                      <span className="text-xl font-black text-cyan-600">
                        {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(salePrice)}
                      </span>
                      {item.discountPercentage > 0 && (
                        <span className="text-sm font-bold text-slate-400 line-through">
                          {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(item.price)}
                        </span>
                      )}
                    </div>
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-md ${isOutOfStock ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                      {isOutOfStock ? 'Out of Stock' : 'In Stock'}
                    </span>
                  </div>

                  <div className="flex sm:flex-col w-full sm:w-auto gap-3 shrink-0">
                    <button 
                      onClick={() => handleAddToCart(item.productId)}
                      disabled={isOutOfStock}
                      className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold transition-all shadow-sm ${
                        isOutOfStock 
                          ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                          : 'bg-slate-900 text-white hover:bg-cyan-600 hover:-translate-y-0.5'
                      }`}
                    >
                      <ShoppingCart className="w-4 h-4" /> Add to Cart
                    </button>
                    
                    <button 
                      onClick={() => handleRemoveItem(item.productId)}
                      className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-red-500 bg-red-50 hover:bg-red-500 hover:text-white transition-colors"
                    >
                      <Trash2 className="w-4 h-4" /> Remove
                    </button>
                  </div>

                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}