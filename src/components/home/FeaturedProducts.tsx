'use client';

import React, { useState, useEffect } from 'react';
import { ArrowRight, Loader2, Image as ImageIcon } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { apiGet } from '@/lib/api';

interface ProductInternalDto {
  productId: string;
  name: string;
  price: number;
  discountPercentage: number;
  mainImage: string;
  shopId: string;
  stock: number;
}

export default function FeaturedProducts() {
  const [products, setProducts] = useState<ProductInternalDto[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter(); 

  useEffect(() => {
    const fetchTrendingProducts = async () => {
      try {
        const data = await apiGet<ProductInternalDto[]>(
          'product',
          '/api/internal/products/trending',
          { withAuth: false, withUserId: false }
        );
        setProducts((data ?? []).slice(0, 5));
      } catch (error) {
        console.error('Error loading products:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTrendingProducts();
  }, []);

  const fallbackImage = "https://placehold.co/400x400/f8fafc/94a3b8?text=No+Image";

  return (
    <section className="w-full mt-12 bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-sm">
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Best Selling Phones</h2>
          <p className="text-sm text-slate-500 mt-1">Most popular products</p>
        </div>
        <Link 
          href="/products" 
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full text-sm font-bold transition-colors flex items-center gap-1"
        >
          See all <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
           <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
        </div>
      ) : products.length === 0 ? (
          <div className="text-center py-16 text-slate-500 font-medium border-2 border-dashed border-slate-100 rounded-2xl">
            No products approved yet.
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {products.map((product) => {
            const hasDiscount = product.discountPercentage > 0; 
            
            const salePrice = hasDiscount 
              ? product.price * (1 - product.discountPercentage / 100) 
              : product.price;

            return (
              <div 
                  key={product.productId} 
                  onClick={() => router.push(`/products/${product.productId}`)} 
                  className="group bg-white flex flex-col border border-slate-200 hover:border-cyan-500 hover:shadow-xl hover:shadow-cyan-500/10 rounded-2xl overflow-hidden transition-all duration-300 relative cursor-pointer"
                >
                
                {hasDiscount ? (
                    <div className="absolute top-0 right-0 bg-yellow-400 text-slate-900 text-[11px] font-black px-2 py-1.5 rounded-bl-lg z-10 flex flex-col items-center leading-none shadow-sm">
                       <span>SALE</span>
                       <span className="text-sm mt-0.5">{product.discountPercentage}%</span>
                    </div>
                ) : null}

                <div className="relative w-full aspect-square bg-white p-4 flex items-center justify-center border-b border-slate-50">
                  <img 
                    src={product.mainImage ? product.mainImage.split('|')[0] : fallbackImage} 
                    onError={(e) => { e.currentTarget.src = fallbackImage; }}
                    alt={product.name} 
                    className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500" 
                  />
                </div>

                <div className="p-4 flex flex-col flex-grow">
                  <h3 className="font-bold text-slate-900 text-sm mb-2 leading-snug group-hover:text-cyan-600 transition-colors line-clamp-2 min-h-[2.5rem]">
                    {product.name}
                  </h3>

                  <div className="flex flex-col mb-4">
                    <span className="text-lg font-black text-cyan-600">
                      {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(salePrice)}
                    </span>
                    {hasDiscount ? (
                        <span className="text-xs font-medium text-slate-400 line-through mt-0.5">
                          {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(product.price)}
                        </span>
                    ) : null}
                  </div>

                  <div className="mt-auto bg-slate-50 border border-slate-100 rounded-lg p-2.5">
                    <p className="text-[11px] text-slate-600 leading-relaxed line-clamp-3">
                      0% installment on {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(salePrice)}. Includes 6-month accidental damage warranty. Free shipping.
                    </p>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}