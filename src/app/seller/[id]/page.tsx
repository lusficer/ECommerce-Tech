'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  Star, MapPin, Calendar, MessageSquare, Plus, Store, 
  Package, CheckCircle2, Loader2, ShoppingCart, Heart 
} from 'lucide-react';
import toast from 'react-hot-toast';
export default function ShopProfilePage() {
  const params = useParams();
  const shopId = params.id as string;
  const router = useRouter();

  const [activeTab, setActiveTab] = useState('All Products');
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [shopInfo, setShopInfo] = useState({
    name: shopId,
    description: 'Premium Tech Gadgets & Accessories',
    logoUrl: '',
    address: 'Đang cập nhật...',
    joined: 'Gần đây',
    totalProducts: 0,
    rating: 4.9 
  });

  const tabs = ['All Products', 'Smartphones', 'Laptops & PCs', 'Accessories', 'Audio', 'Gaming'];

  useEffect(() => {
    // 1. KIỂM TRA ĐĂNG NHẬP TRƯỚC TIÊN
    const token = localStorage.getItem('accessToken');
    
    if (!token) {
      toast.error("Vui lòng đăng nhập để xem thông tin chi tiết của Gian hàng!");
      router.push(`/login?redirect=/seller/${shopId}`);
      return;
    }

    const fetchShopData = async () => {
      setLoading(true);
      try {
        // Gọi API Sản phẩm (API này cấu hình public nên không cần token)
        const productsPromise = fetch(`http://localhost:8083/api/internal/products/filter?shopId=${shopId}&size=12`);
        
        // Gọi API Profile Shop (API này bắt buộc có Token)
        const profilePromise = fetch(`http://localhost:8082/api/shops/${shopId}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`, // Đã truyền Token vào đây!
            'Content-Type': 'application/json'
          }
        }).catch(() => null); 

        const [productsRes, profileRes] = await Promise.all([productsPromise, profilePromise]);

        // Xử lý Data Sản phẩm
        if (productsRes && productsRes.ok) {
          const data = await productsRes.json();
          setProducts(data.content || []);
          setShopInfo(prev => ({ ...prev, totalProducts: data.totalElements || data.content?.length || 0 }));
        }

        // Xử lý Data Profile Shop
        if (profileRes) {
          if (profileRes.status === 401 || profileRes.status === 403) {
             // Token hết hạn hoặc không hợp lệ -> Bắt đăng nhập lại
             localStorage.removeItem('token');
             router.push(`/login?redirect=/seller/${shopId}`);
             return;
          }
          
          if (profileRes.ok) {
            const profileData = await profileRes.json();
            
            let formattedDate = 'Gần đây';
            const dateString = profileData.createdAt || profileData.createdDate; 
            
            if (dateString) {
              try {
                const dateObj = new Date(dateString);
                if (!isNaN(dateObj.getTime())) {
                  formattedDate = dateObj.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
                }
              } catch (e) {
                console.error("Lỗi parse ngày:", e);
              }
            }

            setShopInfo(prev => ({
              ...prev,
              name: profileData.shopName || profileData.name || prev.name,
              description: profileData.description || prev.description,
              logoUrl: profileData.logoUrl || prev.logoUrl,
              address: profileData.address || profileData.location || 'Chưa cập nhật địa chỉ', 
              joined: formattedDate
            }));
          }
        }

      } catch (err) {
        console.error("Lỗi fetch dữ liệu Shop:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchShopData();
  }, [shopId, router]);

  const fallbackImage = "https://placehold.co/400x400/f8fafc/94a3b8?text=No+Image";

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-20">
      
      {/* 1. SHOP HEADER & BANNER */}
      <div className="w-full bg-white border-b border-slate-200">
        <div className="max-w-[1200px] mx-auto">
          
          <div className="h-48 md:h-72 w-full relative overflow-hidden bg-slate-900 rounded-b-3xl shadow-inner">
            <img 
              src="https://images.unsplash.com/photo-1550009158-9ebf69173e03?q=80&w=2001&auto=format&fit=crop" 
              alt="Shop Cover" 
              className="absolute inset-0 w-full h-full object-cover opacity-60"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent"></div>
          </div>

          <div className="px-4 sm:px-8 relative -mt-16 sm:-mt-24 pb-8">
            <div className="bg-white rounded-3xl p-6 shadow-xl border border-slate-100 flex flex-col md:flex-row items-center md:items-start gap-6 relative z-10">
              
              <div className="w-24 h-24 sm:w-32 sm:h-32 bg-white rounded-full p-1.5 shadow-md shrink-0 -mt-12 sm:-mt-16 border border-slate-100 relative">
                <div className="w-full h-full bg-slate-100 rounded-full overflow-hidden flex items-center justify-center">
                  {shopInfo.logoUrl ? (
                    <img src={shopInfo.logoUrl} alt={shopInfo.name} className="w-full h-full object-cover" />
                  ) : (
                    <Store className="w-10 h-10 text-cyan-600" />
                  )}
                </div>
                <div className="absolute bottom-1 right-1 bg-green-500 w-5 h-5 rounded-full border-2 border-white" title="Online Now"></div>
              </div>

              <div className="flex-1 text-center md:text-left">
                <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 mb-2">
                  <h1 className="text-2xl sm:text-3xl font-black text-slate-900 flex items-center justify-center md:justify-start gap-2">
                    {shopInfo.name}
                    <CheckCircle2 className="w-6 h-6 text-blue-500" fill="currentColor" stroke="white" />
                  </h1>
                </div>
                <p className="text-sm text-slate-500 font-medium mb-5">
                  {shopInfo.description}
                </p>
                <div className="flex items-center justify-center md:justify-start gap-3">
                  <button className="flex items-center gap-2 bg-cyan-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-cyan-700 transition-colors shadow-md shadow-cyan-600/20">
                    <Plus className="w-4 h-4" /> Follow
                  </button>
                  <button className="flex items-center gap-2 bg-slate-100 text-slate-700 px-6 py-2.5 rounded-xl font-bold hover:bg-slate-200 transition-colors border border-slate-200">
                    <MessageSquare className="w-4 h-4" /> Chat
                  </button>
                </div>
              </div>

              <div className="w-full md:w-auto grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 pt-6 md:pt-0 border-t md:border-t-0 border-slate-100 md:border-l pl-0 md:pl-8">
                <div className="flex flex-col items-center md:items-start">
                  <span className="text-slate-500 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider mb-1"><Package className="w-4 h-4" /> Products</span>
                  <span className="text-xl font-black text-slate-900">{shopInfo.totalProducts}</span>
                </div>
                <div className="flex flex-col items-center md:items-start">
                  <span className="text-slate-500 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider mb-1"><Star className="w-4 h-4" /> Rating</span>
                  <span className="text-xl font-black text-cyan-600">{shopInfo.rating}<span className="text-sm text-slate-400 font-medium">/5</span></span>
                </div>
                <div className="flex flex-col items-center md:items-start">
                  <span className="text-slate-500 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider mb-1"><MapPin className="w-4 h-4" /> Location</span>
                  <span className="text-sm font-bold text-slate-900 line-clamp-2 text-center md:text-left">{shopInfo.address}</span>
                </div>
                <div className="flex flex-col items-center md:items-start">
                  <span className="text-slate-500 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider mb-1"><Calendar className="w-4 h-4" /> Joined</span>
                  <span className="text-lg font-bold text-slate-900">{shopInfo.joined}</span>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* 2. THANH TABS CATEGORIES */}
        <div className="border-t border-slate-200 bg-white sticky top-[72px] z-40 shadow-sm">
          <div className="max-w-[1200px] mx-auto px-4 sm:px-8">
            <div className="flex overflow-x-auto scrollbar-hide gap-8">
              {tabs.map(tab => (
                <button 
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`whitespace-nowrap py-4 text-sm font-bold border-b-2 transition-colors ${
                    activeTab === tab 
                      ? 'border-cyan-600 text-cyan-600' 
                      : 'border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 3. LƯỚI SẢN PHẨM CỦA SHOP */}
      <div className="max-w-[1200px] mx-auto px-4 sm:px-8 pt-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-black text-slate-900">{activeTab}</h2>
          <div className="text-sm font-bold text-slate-500">
            Sort by: <span className="text-cyan-600 cursor-pointer">Latest</span>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-10 h-10 animate-spin text-cyan-600 mb-4" />
            <p className="text-slate-500 font-medium">Loading shop products...</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
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
                  {hasDiscount && (
                    <div className="absolute top-0 right-0 bg-yellow-400 text-slate-900 text-[11px] font-black px-2 py-1.5 rounded-bl-lg z-10 flex flex-col items-center leading-none shadow-sm">
                      <span>SALE</span><span className="text-sm mt-0.5">{product.discountPercentage}%</span>
                    </div>
                  )}
                  
                  <button className="absolute top-3 left-3 z-10 p-2 bg-white/80 backdrop-blur-sm rounded-full opacity-0 group-hover:opacity-100 hover:bg-red-50 hover:text-red-500 transition-all text-slate-400 shadow-sm" title="Add to Wishlist" onClick={(e) => { e.stopPropagation(); }}>
                    <Heart className="w-4 h-4" />
                  </button>

                  <div className="relative w-full aspect-square bg-white p-4 flex items-center justify-center border-b border-slate-50">
                    <img src={product.mainImage || fallbackImage} onError={(e) => { e.currentTarget.src = fallbackImage; }} alt={product.name} className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500" />
                  </div>
                  
                  <div className="p-4 flex flex-col flex-grow">
                    <h3 className="font-bold text-slate-900 text-sm mb-2 leading-snug group-hover:text-cyan-600 transition-colors line-clamp-2 min-h-[2.5rem]">
                      {product.name}
                    </h3>
                    <div className="flex flex-col mb-4">
                      <span className="text-lg font-black text-cyan-600">
                        {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(salePrice)}
                      </span>
                      {hasDiscount && (
                        <span className="text-xs font-medium text-slate-400 line-through mt-0.5">
                          {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(product.price)}
                        </span>
                      )}
                    </div>
                    
                    <button className="mt-auto w-full py-2 bg-slate-900 text-white text-xs font-bold rounded-xl opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all flex items-center justify-center gap-1.5 hover:bg-cyan-600" onClick={(e) => { e.stopPropagation(); }}>
                      <ShoppingCart className="w-3.5 h-3.5" /> Quick Add
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