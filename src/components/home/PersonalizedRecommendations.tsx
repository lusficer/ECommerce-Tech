'use client'; // Thêm dòng này vì chúng ta có dùng state (useState) để giả lập việc Đăng nhập

import React, { useState } from 'react';
import { Sparkles, Heart, Star, ShieldCheck, ShoppingCart, TrendingUp } from 'lucide-react';

// Dữ liệu mô phỏng
const RECOMMENDATIONS = [
  {
    id: 1,
    title: 'Apple AirPods Pro (2nd Gen) with MagSafe',
    store: 'Apple Official Store',
    price: 249.00,
    sold: '10.5k',
    rating: 4.9,
    reason: 'Matches your Apple ecosystem', // Lý do gợi ý
  },
  {
    id: 2,
    title: 'Keychron Q1 Pro Custom Mechanical Keyboard',
    store: 'Keychron Mall',
    price: 199.00,
    sold: '850',
    rating: 4.8,
    reason: 'Based on your browsing',
  },
  {
    id: 3,
    title: 'LG UltraGear 27" 1440p 165Hz Gaming Monitor',
    store: 'LG Electronics',
    price: 349.00,
    sold: '2.1k',
    rating: 4.7,
    reason: 'Similar to your wishlist',
  },
  {
    id: 4,
    title: 'Anker 737 Power Bank (PowerCore 24K)',
    store: 'Anker Official',
    price: 149.00,
    sold: '5.4k',
    rating: 4.9,
    reason: 'Top pick for you',
  },
  {
    id: 5,
    title: 'WD Black SN850X 2TB NVMe SSD',
    store: 'Western Digital',
    price: 139.00,
    sold: '3.2k',
    rating: 4.8,
    reason: 'Frequently bought together',
  },
];

export default function PersonalizedRecommendations() {
  // Biến state này chỉ dùng để giả lập trên UI. 
  // Thực tế bạn sẽ lấy từ Context/Redux (dữ liệu người dùng đã đăng nhập chưa)
  const [isLoggedIn, setIsLoggedIn] = useState(true);

  return (
    <section className="w-full mt-12 mb-12">
      
      {/* Header section với AI indicator */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-6 pb-4 border-b border-slate-200 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            {isLoggedIn ? (
               <Sparkles className="w-6 h-6 text-orange-500" />
            ) : (
               <TrendingUp className="w-6 h-6 text-blue-500" />
            )}
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              {isLoggedIn ? 'Just For You' : 'Trending Now'}
            </h2>
          </div>
          <p className="text-sm text-slate-500">
            {isLoggedIn 
              ? 'Personalized recommendations based on your activity' 
              : 'Top picks from our marketplace. Log in for custom recommendations.'}
          </p>
        </div>

        {/* Nút giả lập đăng nhập để bạn test UI */}
        <button 
          onClick={() => setIsLoggedIn(!isLoggedIn)}
          className="text-xs font-bold px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full transition-colors w-fit"
        >
          Toggle Auth State: {isLoggedIn ? 'Logged In' : 'Logged Out'}
        </button>
      </div>

      {/* Products Grid - Dùng 5 cột trên màn hình lớn để tạo cảm giác feed kéo dài */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {RECOMMENDATIONS.map((product) => (
          <div key={product.id} className="group flex flex-col bg-white border border-slate-200 hover:border-orange-500 hover:shadow-xl rounded-2xl p-3 transition-all duration-300 relative">
            
            {/* Tag lý do gợi ý (Chỉ hiện khi user đăng nhập) */}
            {isLoggedIn && (
               <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 w-max max-w-[90%] px-2 py-0.5 bg-slate-900 text-white text-[9px] font-bold rounded-full text-center truncate shadow-sm z-20">
                 {product.reason}
               </div>
            )}

            {/* Hình ảnh */}
            <div className="relative w-full aspect-square bg-slate-50 rounded-xl mb-3 flex items-center justify-center border border-slate-100 mt-2">
              <button className="absolute top-2 right-2 p-1.5 bg-white/80 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-full transition-colors z-10 opacity-0 group-hover:opacity-100 shadow-sm">
                <Heart className="w-4 h-4" />
              </button>
              <span className="text-slate-300 font-medium text-xs">Image</span>
            </div>

            {/* Gian hàng */}
            <div className="flex items-center gap-1 mb-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
              <span className="text-[10px] font-bold text-slate-500 truncate">{product.store}</span>
            </div>

            {/* Tên sản phẩm */}
            <h3 className="font-bold text-slate-900 text-xs md:text-sm mb-1 leading-snug hover:text-orange-600 cursor-pointer transition-colors line-clamp-2 min-h-[2.5rem]">
              {product.title}
            </h3>

            {/* Đánh giá & Đã bán */}
            <div className="flex items-center gap-2 mb-3 mt-1">
              <div className="flex items-center gap-0.5">
                <Star className="w-3 h-3 fill-orange-400 text-orange-400" />
                <span className="text-[10px] font-bold text-slate-700">{product.rating}</span>
              </div>
              <span className="text-[10px] text-slate-400 border-l border-slate-300 pl-2">{product.sold} sold</span>
            </div>

            {/* Giá & Thêm vào giỏ */}
            <div className="mt-auto flex items-end justify-between">
              <span className="text-lg font-black text-slate-900">${product.price.toFixed(2)}</span>
              <button className="p-2 bg-slate-100 hover:bg-orange-500 hover:text-white text-slate-900 rounded-lg transition-colors">
                 <ShoppingCart className="w-4 h-4" />
              </button>
            </div>

          </div>
        ))}
      </div>

      {/* Nút Load More */}
      <div className="flex justify-center mt-10">
        <button className="px-8 py-3 bg-white border-2 border-slate-200 text-slate-600 font-bold rounded-full hover:border-slate-900 hover:text-slate-900 transition-colors shadow-sm">
          Load More
        </button>
      </div>
    </section>
  );
}