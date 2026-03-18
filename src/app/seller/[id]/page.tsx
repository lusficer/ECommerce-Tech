'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  Star, MapPin, Calendar, MessageSquare, Plus, Store, 
  Package, CheckCircle2, Loader2, ShoppingCart, Heart,
  ChevronLeft, ChevronRight
} from 'lucide-react';
import toast from 'react-hot-toast';

import ShopProfileSkeleton from '../../../components/skeleton/page'; 

const CATEGORY_MAP: Record<string, string> = {
  'CAT_PHONE': 'Smartphones',
  'CAT_LAPTOP': 'Laptops & PCs',
  'CAT_ACCESSORY': 'Accessories',
  'CAT_AUDIO': 'Audio',
  'CAT_GAMING': 'Gaming',
  'CAT_ELEC': 'Electronics',
  'CAT_MONITOR': 'Monitors',
  'CAT_TABLET': 'Tablets'
};

export default function ShopProfilePage() {
  const params = useParams();
  const shopId = params.id as string;
  const router = useRouter();

  const [activeTab, setActiveTab] = useState('All Products');
  const [products, setProducts] = useState<any[]>([]);
  const [dynamicTabs, setDynamicTabs] = useState<string[]>(['All Products']); 
  const [loading, setLoading] = useState(true);

  const [wishlistItems, setWishlistItems] = useState<Set<string>>(new Set());
  const [isAddingToCart, setIsAddingToCart] = useState<Record<string, boolean>>({});

  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 16; 

  const [shopInfo, setShopInfo] = useState({
    name: shopId,
    description: 'Premium Tech Gadgets & Accessories',
    logoUrl: '',
    address: 'Updating...',
    joined: 'Recently',
    totalProducts: 0,
    rating: 4.9 
  });

  useEffect(() => {
    const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
    const userId = localStorage.getItem('userId');
    
    if (!token) {
      toast.error("Please login to view Shop details!");
      router.push(`/login?redirect=/seller/${shopId}`);
      return;
    }

    const fetchShopData = async () => {
      setLoading(true);
      try {
        const productsPromise = fetch(`http://localhost:8083/api/internal/products/shop/${shopId}`);
        const profilePromise = fetch(`http://localhost:8082/api/shops/${shopId}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`, 
            'Content-Type': 'application/json'
          }
        }).catch(() => null); 

        let wishlistPromise: Promise<Response | null> = Promise.resolve(null);
        if (userId) {
          wishlistPromise = fetch(`http://localhost:8081/api/wishlists/${userId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          }).catch(() => null);
        }

        const [productsRes, profileRes, wishlistRes] = await Promise.all([productsPromise, profilePromise, wishlistPromise]);

        if (productsRes && productsRes.ok) {
          const data = await productsRes.json();
          setProducts(data || []);
          setShopInfo(prev => ({ ...prev, totalProducts: data.length || 0 }));

          if (data && data.length > 0) {
            const uniqueCategoryIds = Array.from(new Set<string>(data.map((p: any) => String(p.categoryId))));
            const fetchedTabs = uniqueCategoryIds.map((id: string) => CATEGORY_MAP[id] || id);
            setDynamicTabs(['All Products', ...fetchedTabs.sort()]); 
          }
        }

        if (profileRes && profileRes.ok) {
          const profileData = await profileRes.json();
          let formattedDate = 'Recently';
          const dateString = profileData.createdAt || profileData.createdDate; 
          
          if (dateString) {
            try {
              const dateObj = new Date(dateString);
              if (!isNaN(dateObj.getTime())) {
                formattedDate = dateObj.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
              }
            } catch (e) {}
          }

          setShopInfo(prev => ({
            ...prev,
            name: profileData.shopName || profileData.name || prev.name,
            description: profileData.description || prev.description,
            logoUrl: profileData.logoUrl || prev.logoUrl,
            address: profileData.address || profileData.location || 'Address not updated', 
            joined: formattedDate
          }));
        }

        if (wishlistRes && wishlistRes.ok) {
           const wishData = await wishlistRes.json();
           const wishSet = new Set<string>();
           wishData.forEach((item: any) => wishSet.add(item.productId));
           setWishlistItems(wishSet);
        }

      } catch (err) {
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchShopData();
  }, [shopId, router]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setCurrentPage(1); 
  };

  const handleToggleWishlist = async (e: React.MouseEvent, productId: string, categoryId: string) => {
    e.stopPropagation();
    const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
    const userId = localStorage.getItem('userId');

    if (!token || !userId) { toast.error("Please log in to save products!"); return; }

    try {
      const isCurrentlyWishlisted = wishlistItems.has(productId);
      const res = await fetch(`http://localhost:8081/api/wishlists/${userId}/${productId}`, {
        method: 'POST', headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        setWishlistItems(prev => {
          const newSet = new Set(prev);
          if (isCurrentlyWishlisted) newSet.delete(productId);
          else newSet.add(productId);
          return newSet;
        });
        toast.success(isCurrentlyWishlisted ? "Removed from wishlist!" : "Added to wishlist!");
      }
    } catch (err) { toast.error("Server connection error!"); }
  };

  const handleAddToCart = async (e: React.MouseEvent, productId: string, categoryId: string) => {
    e.stopPropagation();
    const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
    const userId = localStorage.getItem('userId');

    if (!token || !userId) { toast.error("Please login to add to cart!"); return; }

    setIsAddingToCart(prev => ({ ...prev, [productId]: true }));

    try {
      const res = await fetch(`http://localhost:8088/api/cart/add`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json', 'userId': userId },
        body: JSON.stringify({ productId: productId, quantity: 1 })
      });

      if (!res.ok) {
        toast.error("Error adding to cart!");
      } else {
        toast.success("Added to cart!");
        window.dispatchEvent(new Event('cartUpdated'));
      }
    } catch (err) {
      toast.error("Cannot connect to the cart server.");
    } finally {
      setIsAddingToCart(prev => ({ ...prev, [productId]: false }));
    }
  };

  const filteredProducts = activeTab === 'All Products' 
    ? products 
    : products.filter(p => (CATEGORY_MAP[String(p.categoryId)] || p.categoryId) === activeTab);

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  
  const currentProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage, 
    currentPage * itemsPerPage
  );

  const fallbackImage = "https://placehold.co/400x400/f8fafc/94a3b8?text=No+Image";

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const pages = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push(2);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push(2);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      }
    }

    const scrollToProducts = () => {
      window.scrollTo({ top: 450, behavior: 'smooth' });
    };

    return (
      <div className="flex justify-center items-center gap-2 mt-12 pb-8">
        <button 
          onClick={() => { setCurrentPage(currentPage - 1); scrollToProducts(); }}
          disabled={currentPage === 1}
          className={`w-10 h-10 flex items-center justify-center rounded-xl font-bold transition-all ${
            currentPage === 1 ? 'bg-slate-100 text-slate-300 cursor-not-allowed' : 'bg-white text-slate-700 hover:bg-cyan-50 hover:text-cyan-600 shadow-sm border border-slate-200'
          }`}
        >
          <ChevronLeft size={18} />
        </button>

        {pages.map((p, idx) => (
          <React.Fragment key={idx}>
            {p === '...' ? (
              <span className="w-10 h-10 flex items-center justify-center text-slate-400 font-bold tracking-widest">...</span>
            ) : (
              <button
                onClick={() => { setCurrentPage(p as number); scrollToProducts(); }}
                className={`w-10 h-10 flex items-center justify-center rounded-xl font-bold transition-all ${
                  currentPage === p ? 'bg-cyan-600 text-white shadow-md shadow-cyan-200' : 'bg-white text-slate-700 hover:bg-cyan-50 hover:text-cyan-600 shadow-sm border border-slate-200'
                }`}
              >
                {p}
              </button>
            )}
          </React.Fragment>
        ))}

        <button 
          onClick={() => { setCurrentPage(currentPage + 1); scrollToProducts(); }}
          disabled={currentPage === totalPages}
          className={`w-10 h-10 flex items-center justify-center rounded-xl font-bold transition-all ${
            currentPage === totalPages ? 'bg-slate-100 text-slate-300 cursor-not-allowed' : 'bg-white text-slate-700 hover:bg-cyan-50 hover:text-cyan-600 shadow-sm border border-slate-200'
          }`}
        >
          <ChevronRight size={18} />
        </button>
      </div>
    );
  };

  if (loading) {
    return <ShopProfileSkeleton />;
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-20 animate-in fade-in duration-500">
      <div className="w-full bg-white border-b border-slate-200">
        <div className="max-w-[1200px] mx-auto">
          <div className="h-48 md:h-72 w-full relative overflow-hidden bg-slate-900 rounded-b-3xl shadow-inner">
            <img src="https://images.unsplash.com/photo-1550009158-9ebf69173e03?q=80&w=2001&auto=format&fit=crop" alt="Shop Cover" className="absolute inset-0 w-full h-full object-cover opacity-60" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent"></div>
          </div>

          <div className="px-4 sm:px-8 relative -mt-16 sm:-mt-24 pb-8">
            <div className="bg-white rounded-3xl p-6 shadow-xl border border-slate-100 flex flex-col md:flex-row items-center md:items-start gap-6 relative z-10">
              <div className="w-24 h-24 sm:w-32 sm:h-32 bg-white rounded-full p-1.5 shadow-md shrink-0 -mt-12 sm:-mt-16 border border-slate-100 relative">
                <div className="w-full h-full bg-slate-100 rounded-full overflow-hidden flex items-center justify-center">
                  {shopInfo.logoUrl ? <img src={shopInfo.logoUrl} alt={shopInfo.name} className="w-full h-full object-cover" /> : <Store className="w-10 h-10 text-cyan-600" />}
                </div>
                <div className="absolute bottom-1 right-1 bg-green-500 w-5 h-5 rounded-full border-2 border-white"></div>
              </div>

              <div className="flex-1 text-center md:text-left">
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 flex items-center justify-center md:justify-start gap-2 mb-2">
                  {shopInfo.name} <CheckCircle2 className="w-6 h-6 text-blue-500" fill="currentColor" stroke="white" />
                </h1>
                <p className="text-sm text-slate-500 font-medium mb-5">{shopInfo.description}</p>
                <div className="flex items-center justify-center md:justify-start gap-3">
                  <button className="flex items-center gap-2 bg-cyan-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-cyan-700 transition-colors shadow-md shadow-cyan-600/20"><Plus className="w-4 h-4" /> Follow</button>
                  <button className="flex items-center gap-2 bg-slate-100 text-slate-700 px-6 py-2.5 rounded-xl font-bold hover:bg-slate-200 transition-colors border border-slate-200"><MessageSquare className="w-4 h-4" /> Chat</button>
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

        <div className="border-t border-slate-200 bg-white sticky top-[72px] z-40 shadow-sm">
          <div className="max-w-[1200px] mx-auto px-4 sm:px-8">
            <div className="flex overflow-x-auto scrollbar-hide gap-8 transform-gpu">
              {dynamicTabs.map(tab => (
                <button 
                  key={tab}
                  onClick={() => handleTabChange(tab)}
                  className={`whitespace-nowrap py-4 text-sm font-bold border-b-2 transition-all duration-300 ${
                    activeTab === tab ? 'border-cyan-600 text-cyan-600' : 'border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-4 sm:px-8 pt-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-black text-slate-900">
            {activeTab} <span className="text-sm text-slate-400 font-medium ml-2">({filteredProducts.length})</span>
          </h2>
        </div>

        {filteredProducts.length === 0 ? (
          <div className="text-center py-20 text-slate-400 font-bold">
            No products found in this category.
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
              {currentProducts.map((product) => {
                const hasDiscount = product.discountPercentage > 0;
                const salePrice = hasDiscount ? product.price * (1 - product.discountPercentage / 100) : product.price;
                const isWished = wishlistItems.has(product.productId);
                const isAdding = isAddingToCart[product.productId];

                return (
                  <div key={product.productId} onClick={() => router.push(`/products/${product.productId}`)} className="group bg-white flex flex-col border border-slate-200 hover:border-cyan-500 hover:shadow-xl hover:shadow-cyan-500/10 rounded-2xl overflow-hidden transition-all duration-300 relative cursor-pointer">
                    {hasDiscount && (
                      <div className="absolute top-0 right-0 bg-yellow-400 text-slate-900 text-[11px] font-black px-2 py-1.5 rounded-bl-lg z-10 flex flex-col items-center leading-none shadow-sm">
                        <span>SALE</span><span className="text-sm mt-0.5">{product.discountPercentage}%</span>
                      </div>
                    )}
                    
                    <button onClick={(e) => handleToggleWishlist(e, product.productId, product.categoryId)} className="absolute top-3 left-3 z-10 p-2 bg-white/80 backdrop-blur-sm rounded-full opacity-0 group-hover:opacity-100 hover:bg-red-50 hover:text-red-500 transition-all shadow-sm">
                      <Heart className={`w-4 h-4 ${isWished ? 'fill-red-500 text-red-500' : 'text-slate-400'}`} />
                    </button>

                    <div className="relative w-full aspect-square bg-white p-4 flex items-center justify-center border-b border-slate-50">
                      <img src={product.mainImage || fallbackImage} onError={(e) => { e.currentTarget.src = fallbackImage; }} alt={product.name} className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500" />
                    </div>
                    
                    <div className="p-4 flex flex-col flex-grow">
                      <h3 className="font-bold text-slate-900 text-sm mb-2 leading-snug group-hover:text-cyan-600 transition-colors line-clamp-2 min-h-[2.5rem]">{product.name}</h3>
                      <div className="flex flex-col mb-4">
                        <span className="text-lg font-black text-cyan-600">{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(salePrice)}</span>
                        {hasDiscount && <span className="text-xs font-medium text-slate-400 line-through mt-0.5">{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(product.price)}</span>}
                      </div>
                      
                      <button disabled={isAdding} onClick={(e) => handleAddToCart(e, product.productId, product.categoryId)} className={`mt-auto w-full py-2 text-xs font-bold rounded-xl opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all flex items-center justify-center gap-1.5 ${isAdding ? 'bg-slate-200 text-slate-500 cursor-not-allowed' : 'bg-slate-900 text-white hover:bg-cyan-600'}`}>
                        {isAdding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShoppingCart className="w-3.5 h-3.5" />} {isAdding ? 'Adding...' : 'Quick Add'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {renderPagination()}
          </>
        )}
      </div>
    </div>
  );
}