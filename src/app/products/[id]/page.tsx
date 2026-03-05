'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Heart, Star, ShoppingCart, Truck, ShieldCheck, ChevronRight, Store, Share2, Loader2, Info, MessageSquare } from 'lucide-react';

interface ProductInternalDto {
  productId: string;
  name: string;
  price: number;
  mainImage: string;
  description?: string; // Thêm trường description
  shopId: string;
  stock: number;
  discountPercentage: number;
}

// DỮ LIỆU ĐÁNH GIÁ GIẢ LẬP (MOCK REVIEWS)
const MOCK_REVIEWS = [
  { id: 1, user: "Alex Johnson", rating: 5, date: "Nov 12, 2025", comment: "Absolutely love this! The build quality is premium, and it performs exactly as described. Delivery was also surprisingly fast." },
  { id: 2, user: "Sarah M.", rating: 4, date: "Oct 28, 2025", comment: "Great value for the price. The features are solid and it looks really sleek. I knocked off one star just because the packaging was slightly dented upon arrival, but the product inside was perfectly safe." },
  { id: 3, user: "Michael T.", rating: 5, date: "Oct 15, 2025", comment: "Highly recommend! I've been using it daily and it hasn't let me down. Best purchase I've made this month." }
];

export default function ProductDetailPage() {
  const params = useParams();
  const productId = params.id as string;

  const [product, setProduct] = useState<ProductInternalDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);

  useEffect(() => {
    if (!productId) {
      setLoading(false);
      return;
    }

    const fetchProductDetail = async () => {
      try {
        const cleanId = decodeURIComponent(productId);
        const response = await fetch(`http://localhost:8083/api/internal/products/${cleanId}`);
        
        if (response.ok) {
          const data = await response.json();
          setProduct(data);
        }
      } catch (error) {
        console.error('Network or connection error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProductDetail();
  }, [productId]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 font-sans">
        <Loader2 className="w-12 h-12 animate-spin text-cyan-600 mb-4" />
        <p className="text-slate-500 font-medium">Loading product details...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 font-sans">
        <Info className="w-16 h-16 text-slate-300 mb-4" />
        <h2 className="text-2xl font-black text-slate-700 mb-2">Product Not Found</h2>
        <p className="text-slate-500 mb-6">The product you are looking for does not exist or has been removed.</p>
        <Link href="/products" className="px-6 py-3 bg-cyan-600 text-white font-bold rounded-xl hover:bg-cyan-700 transition-colors shadow-md">
          Back to Products
        </Link>
      </div>
    );
  }

  const fallbackImage = "https://placehold.co/600x600/f8fafc/94a3b8?text=No+Image";
  
  // XỬ LÝ ẢNH: Cắt chuỗi ảnh bằng ký tự '|' nếu có nhiều ảnh.
  const imageUrls = product.mainImage ? product.mainImage.split('|') : [fallbackImage];
  
  const hasDiscount = product.discountPercentage > 0;
  const salePrice = hasDiscount ? product.price * (1 - product.discountPercentage / 100) : product.price;

  return (
    <div className="bg-slate-50 min-h-screen py-8 font-sans">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Breadcrumb */}
        <div className="flex items-center text-sm font-bold text-slate-400 mb-8 uppercase tracking-wide">
          <Link href="/" className="hover:text-cyan-600 transition-colors">Home</Link> 
          <ChevronRight className="w-4 h-4 mx-2" /> 
          <Link href="/products" className="hover:text-cyan-600 transition-colors">Products</Link> 
          <ChevronRight className="w-4 h-4 mx-2" /> 
          <span className="text-slate-900 truncate max-w-[200px]">{product.name}</span>
        </div>

        {/* Main Product Section */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 md:p-10 flex flex-col lg:flex-row gap-10 lg:gap-16">
          
          {/* Left: Image Gallery */}
          <div className="w-full lg:w-1/2 flex flex-col">
            <div className="relative w-full aspect-square bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-center p-8 overflow-hidden group">
              {hasDiscount && (
                  <div className="absolute top-4 left-4 bg-yellow-400 text-slate-900 text-sm font-black px-3 py-1.5 rounded-lg z-10 shadow-sm">
                    {product.discountPercentage}% OFF
                  </div>
              )}
              <img 
                src={imageUrls[activeImage] || fallbackImage} 
                onError={(e) => { e.currentTarget.src = fallbackImage; }} 
                alt={product.name} 
                className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500" 
              />
            </div>

            {/* Thumbnails: CHỈ HIỂN THỊ NẾU CÓ TỪ 2 ẢNH TRỞ LÊN */}
            {imageUrls.length > 1 && (
              <div className="flex gap-4 mt-4 overflow-x-auto pb-2 scrollbar-hide">
                {imageUrls.map((img, idx) => (
                  <div 
                    key={idx} 
                    onClick={() => setActiveImage(idx)}
                    className={`w-20 h-20 shrink-0 rounded-xl border-2 p-2 cursor-pointer transition-all ${activeImage === idx ? 'border-cyan-600 bg-cyan-50' : 'border-slate-100 bg-white hover:border-slate-300'}`}
                  >
                    <img src={img} onError={(e) => { e.currentTarget.src = fallbackImage; }} alt={`Thumbnail ${idx}`} className="w-full h-full object-contain" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right: Product Info */}
          <div className="w-full lg:w-1/2 flex flex-col">
            
            <div className="flex items-center justify-between mb-4">
              <Link href={`/seller/${product.shopId}`} className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-bold transition-colors">
                <Store className="w-4 h-4 text-cyan-600" />
                {product.shopId}
              </Link>
              <div className="flex items-center gap-3">
                <button className="text-slate-400 hover:text-cyan-600 transition-colors"><Share2 className="w-5 h-5" /></button>
                <button className="text-slate-400 hover:text-red-500 transition-colors"><Heart className="w-5 h-5" /></button>
              </div>
            </div>

            <h1 className="text-2xl md:text-3xl lg:text-4xl font-black text-slate-900 leading-tight mb-4">
              {product.name}
            </h1>

            <div className="flex items-center gap-4 mb-6">
              <div className="flex items-center text-yellow-400">
                <Star className="w-5 h-5 fill-current" />
                <Star className="w-5 h-5 fill-current" />
                <Star className="w-5 h-5 fill-current" />
                <Star className="w-5 h-5 fill-current" />
                <Star className="w-5 h-5 fill-current text-slate-200" />
              </div>
              <span className="text-sm font-bold text-slate-600 underline cursor-pointer hover:text-cyan-600">4.0 (128 reviews)</span>
              <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
              <span className="text-sm font-bold text-green-600">In Stock</span>
            </div>

            <div className="mb-8">
              <div className="flex items-end gap-3 mb-2">
                <span className="text-4xl font-black text-cyan-600 tracking-tight">
                  {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(salePrice)}
                </span>
                {hasDiscount && (
                  <span className="text-lg font-bold text-slate-400 line-through mb-1">
                    {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(product.price)}
                  </span>
                )}
              </div>
              <p className="text-sm font-medium text-slate-500">Taxes included. Free shipping on qualifying orders.</p>
            </div>

            {/* Add to Cart Actions */}
            <div className="flex flex-col sm:flex-row gap-4 mb-8">
              <div className="flex items-center bg-slate-100 rounded-2xl p-1 w-full sm:w-32 shrink-0">
                <button 
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-10 h-10 flex items-center justify-center text-slate-600 hover:bg-white rounded-xl transition-colors font-black text-lg"
                >-</button>
                <span className="flex-1 text-center font-bold text-slate-900">{quantity}</span>
                <button 
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-10 h-10 flex items-center justify-center text-slate-600 hover:bg-white rounded-xl transition-colors font-black text-lg"
                >+</button>
              </div>

              <button className="flex-1 bg-slate-900 text-white font-black text-lg py-4 rounded-2xl hover:bg-cyan-600 transition-all shadow-md flex items-center justify-center gap-2 group">
                <ShoppingCart className="w-5 h-5 group-hover:-rotate-12 transition-transform" />
                Add to Cart
              </button>
            </div>

            {/* Badges */}
            <div className="grid grid-cols-2 gap-4 mt-auto p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="flex items-center gap-3">
                <Truck className="w-5 h-5 text-cyan-600" />
                <span className="text-sm font-bold text-slate-700">Free Shipping<br/><span className="text-xs font-medium text-slate-500">On orders over $50</span></span>
              </div>
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-5 h-5 text-green-500" />
                <span className="text-sm font-bold text-slate-700">1 Year Warranty<br/><span className="text-xs font-medium text-slate-500">100% Secure</span></span>
              </div>
            </div>

          </div>
        </div>

        {/* CỘT DƯỚI: MÔ TẢ & ĐÁNH GIÁ (CHIA 2 CỘT TRÊN MÀN HÌNH LỚN) */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Description Section */}
          <div className="lg:col-span-2 bg-white rounded-3xl shadow-sm border border-slate-200 p-8 md:p-10">
            <h2 className="text-2xl font-black text-slate-900 mb-6 flex items-center gap-2">
              <Info className="w-6 h-6 text-cyan-600" /> Product Overview
            </h2>
            <div className="prose prose-slate max-w-none text-slate-600 leading-relaxed font-medium">
              {product.description ? (
                <p>{product.description}</p>
              ) : (
                <p className="italic text-slate-400">No detailed description is available for this product yet.</p>
              )}
            </div>
          </div>

          {/* Reviews Section */}
          <div className="lg:col-span-1 bg-white rounded-3xl shadow-sm border border-slate-200 p-8 md:p-10">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-cyan-600" /> Reviews
              </h2>
              <span className="text-sm font-bold text-cyan-600 bg-cyan-50 px-3 py-1 rounded-full">4.0 / 5</span>
            </div>
            
            <div className="flex flex-col gap-6 max-h-[400px] overflow-y-auto pr-2 scrollbar-thin">
              {MOCK_REVIEWS.map((review) => (
                <div key={review.id} className="border-b border-slate-100 last:border-0 pb-6 last:pb-0">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className="font-bold text-slate-900 block text-sm">{review.user}</span>
                      <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{review.date}</span>
                    </div>
                    <div className="flex text-yellow-400">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`w-3.5 h-3.5 ${i < review.rating ? 'fill-current' : 'text-slate-200 fill-current'}`} />
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-slate-600 font-medium leading-relaxed">"{review.comment}"</p>
                </div>
              ))}
            </div>
            
            <button className="w-full mt-6 py-3 border-2 border-slate-100 text-slate-600 font-bold rounded-xl hover:border-cyan-600 hover:text-cyan-600 transition-colors">
              Write a Review
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}