import React from 'react';
import { Heart, Star, Store, ShieldCheck, ArrowRight } from 'lucide-react';

const PRODUCTS = [
  {
    id: 1,
    title: 'MacBook Pro M3 Max 14" Space Black',
    store: 'Apple Official Store',
    isMall: true,
    sold: '1.2k',
    price: 2999.00,
    oldPrice: 3199.00,
    save: '200',
    rating: 5,
    reviews: 152,
  },
  {
    id: 2,
    title: 'Logitech MX Master 3S Wireless Mouse',
    store: 'GearVN Store',
    isMall: false,
    sold: '450',
    price: 99.00,
    oldPrice: 120.00,
    save: '21',
    rating: 4.8,
    reviews: 84,
  },
  {
    id: 3,
    title: 'Sony WH-1000XM5 Noise Cancelling',
    store: 'Sony Center',
    isMall: true,
    sold: '890',
    price: 348.00,
    oldPrice: null,
    save: null,
    rating: 4.9,
    reviews: 320,
  },
  {
    id: 4,
    title: 'Samsung Galaxy S24 Ultra 512GB',
    store: 'Samsung Official',
    isMall: true,
    sold: '2.5k',
    price: 1299.00,
    oldPrice: 1399.00,
    save: '100',
    rating: 5,
    reviews: 412,
  },
];

export default function FeaturedProducts() {
  return (
    <section className="w-full mt-12 bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-sm">
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Recommended for You</h2>
          <p className="text-sm text-slate-500 mt-1">Products from top-rated sellers</p>
        </div>
        <button className="text-sm font-bold text-slate-600 hover:text-blue-600 flex items-center gap-1 transition-colors uppercase tracking-wide">
          See All <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {PRODUCTS.map((product) => (
          <div key={product.id} className="group flex flex-col border border-transparent hover:border-slate-200 hover:shadow-lg rounded-2xl p-3 transition-all duration-300">
            
            {/* Hình ảnh & Tem giảm giá */}
            <div className="relative w-full h-48 bg-slate-50 rounded-xl mb-4 flex items-center justify-center">
              {product.save && (
                <span className="absolute top-2 left-2 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wide shadow-sm z-10">
                  Save ${product.save}
                </span>
              )}
              <button className="absolute top-2 right-2 p-1.5 bg-white/80 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-full transition-colors z-10">
                <Heart className="w-4 h-4" />
              </button>
              <span className="text-slate-300 font-medium text-xs">Product Image</span>
            </div>

            {/* Thông tin Gian Hàng (Marketplace Vibe nằm ở đây) */}
            <div className="flex items-center gap-1.5 mb-2">
              {product.isMall ? (
                <span className="flex items-center gap-0.5 bg-blue-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-sm uppercase tracking-wider">
                  <ShieldCheck className="w-3 h-3" /> Mall
                </span>
              ) : (
                <Store className="w-3.5 h-3.5 text-slate-400" />
              )}
              <span className="text-xs font-medium text-slate-500 truncate hover:text-blue-600 cursor-pointer">
                {product.store}
              </span>
            </div>

            {/* Tên sản phẩm */}
            <h3 className="font-bold text-slate-900 text-sm mb-1 leading-snug hover:text-blue-600 cursor-pointer transition-colors line-clamp-2">
              {product.title}
            </h3>

            {/* Đánh giá & Đã bán */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1">
                <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                <span className="text-xs font-bold text-slate-700">{product.rating}</span>
                <span className="text-xs text-slate-400">({product.reviews})</span>
              </div>
              <span className="text-[10px] font-medium text-slate-500">{product.sold} sold</span>
            </div>

            {/* Giá cả */}
            <div className="mt-auto flex items-end gap-2">
              <span className="text-lg font-black text-blue-600">${product.price.toFixed(2)}</span>
              {product.oldPrice && (
                <span className="text-xs font-medium text-slate-400 line-through mb-1">
                  ${product.oldPrice.toFixed(2)}
                </span>
              )}
            </div>

          </div>
        ))}
      </div>
    </section>
  );
}