// src/components/home/FlashSale.tsx
import React from 'react';
import { Zap, Heart, Star, CheckCircle2, XCircle } from 'lucide-react';

const FLASH_PRODUCTS = [
  {
    id: 1,
    title: 'Intel Core i9-14900K Processor',
    price: 549.00,
    oldPrice: 629.00,
    save: '80.00',
    rating: 5,
    reviews: 120,
    inStock: true,
  },
  {
    id: 2,
    title: 'ASUS ROG Strix GeForce RTX 4090',
    price: 1899.00,
    oldPrice: 1999.00,
    save: '100.00',
    rating: 4.9,
    reviews: 350,
    inStock: true,
  },
  {
    id: 3,
    title: 'Corsair Vengeance RGB DDR5 64GB',
    price: 219.00,
    oldPrice: 259.00,
    save: '40.00',
    rating: 4.8,
    reviews: 85,
    inStock: false,
  },
  {
    id: 4,
    title: 'Samsung 990 PRO 2TB NVMe SSD',
    price: 159.00,
    oldPrice: 189.00,
    save: '30.00',
    rating: 5,
    reviews: 512,
    inStock: true,
  },
];

export default function FlashSale() {
  return (
    <section className="w-full mt-12 bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-100 flex flex-col md:flex-row">
      
      {/* Left Sidebar (Dark Area) */}
      <div className="w-full md:w-[320px] bg-slate-900 p-8 flex flex-col items-center justify-center relative overflow-hidden shrink-0">
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-0"></div>
        <div className="relative z-10 w-full text-center">
           <div className="flex items-center justify-center gap-2 mb-8">
              <Zap className="text-orange-500 w-8 h-8 fill-orange-500" />
              <h2 className="text-3xl font-black text-white uppercase tracking-tight">Flash Sale</h2>
           </div>

           {/* Menu Items */}
           <div className="space-y-3 w-full max-w-[200px] mx-auto text-left">
             <button className="w-full text-left text-sm font-bold text-slate-300 hover:text-white border-b border-slate-700 pb-2 transition-colors flex justify-between">
                40% OFF <span className="text-slate-500">→</span>
             </button>
             <button className="w-full text-left text-sm font-bold text-slate-300 hover:text-white border-b border-slate-700 pb-2 transition-colors flex justify-between">
                NEW RELEASES <span className="text-slate-500">→</span>
             </button>
              <button className="w-full text-left text-sm font-bold text-slate-300 hover:text-white border-b border-slate-700 pb-2 transition-colors flex justify-between">
                BEST SELLERS <span className="text-slate-500">→</span>
             </button>
           </div>
        </div>

        {/* Decorative Element (Replaces the dog) */}
        <div className="absolute -bottom-10 right-0 w-48 h-48 bg-blue-500/20 rounded-full blur-3xl z-0"></div>
      </div>

      {/* Right Product Grid */}
      <div className="flex-1 p-6 md:p-8">
         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {FLASH_PRODUCTS.map((product) => (
            <div key={product.id} className="group relative flex flex-col">
              
              {/* Top Badges */}
              <div className="absolute top-2 left-2 right-2 flex justify-between items-start z-10 pointer-events-none">
                {product.save && (
                  <span className="bg-orange-500 text-white text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wide">
                    Save ${product.save}
                  </span>
                )}
                <button className="pointer-events-auto p-1.5 bg-slate-100 hover:bg-orange-50 text-slate-400 hover:text-orange-500 rounded-full transition-colors">
                  <Heart className="w-4 h-4" />
                </button>
              </div>

              {/* Product Image Placeholder */}
              <div className="w-full h-48 bg-slate-50 rounded-2xl mb-4 flex items-center justify-center group-hover:bg-slate-100 transition-colors border border-slate-100">
                 <span className="text-slate-300 font-medium text-xs text-center px-4">{product.title}</span>
              </div>

              {/* Reviews */}
              <div className="flex items-center gap-1 mb-2">
                <div className="flex text-yellow-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className={`w-3.5 h-3.5 ${i < Math.floor(product.rating) ? 'fill-current' : 'text-slate-200'}`} />
                  ))}
                </div>
                <span className="text-xs text-slate-500 font-medium ml-1">({product.reviews})</span>
              </div>

              {/* Title */}
              <h3 className="font-bold text-slate-900 mb-2 leading-tight hover:text-orange-500 cursor-pointer transition-colors line-clamp-2">
                {product.title}
              </h3>

              {/* Price */}
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xl font-black text-slate-900">${product.price.toFixed(2)}</span>
                {product.oldPrice && (
                  <span className="text-sm font-medium text-slate-400 line-through">${product.oldPrice.toFixed(2)}</span>
                )}
              </div>

              <div className="flex-grow"></div>

              {/* Tags & Stock Status */}
              <div className="flex flex-col gap-2 mt-2">
                 <div className="flex gap-2">
                    <span className="text-[9px] font-bold text-green-600 border border-green-200 px-1.5 py-0.5 rounded uppercase tracking-wide">
                      Free Shipping
                    </span>
                  </div>
                <div className="flex items-center gap-1.5 mt-1">
                  {product.inStock ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                      <span className="text-xs font-bold text-slate-600">In stock</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4 text-red-500" />
                      <span className="text-xs font-bold text-slate-600">Out of stock</span>
                    </>
                  )}
                </div>
              </div>

            </div>
          ))}
        </div>
      </div>
    </section>
  );
}