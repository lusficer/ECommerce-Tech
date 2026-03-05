'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { 
  Search, Heart, User, ShoppingCart, RefreshCcw, Menu, ChevronDown, 
  LogOut, Store, Loader2, Smartphone, Laptop, Headphones, Watch, 
  ChevronRight, Tablet, Monitor, Gamepad, Mouse, Package
} from 'lucide-react';

// --- TỪ ĐIỂN MARKETING CHO DANH MỤC ---
const CATEGORY_META: Record<string, { icon: any, brands: string[], priceRanges: any[] }> = {
  'CAT_PHONE': {
    icon: Smartphone,
    brands: ['Apple', 'Samsung', 'Google', 'Xiaomi', 'Oppo', 'Huawei'],
    priceRanges: [{ label: 'Under $300', min: 0, max: 300 }, { label: '$300 - $800', min: 300, max: 800 }, { label: 'Over $800', min: 800, max: '' }]
  },
  'CAT_LAPTOP': {
    icon: Laptop,
    brands: ['MacBook', 'Dell', 'Asus ROG', 'HP', 'Lenovo', 'MSI'],
    priceRanges: [{ label: 'Under $800', min: 0, max: 800 }, { label: '$800 - $1500', min: 800, max: 1500 }, { label: 'Premium (Over $1500)', min: 1500, max: '' }]
  },
  'CAT_AUDIO': {
    icon: Headphones,
    brands: ['Sony', 'Apple', 'JBL', 'Bose', 'Sennheiser', 'Marshall'],
    priceRanges: [{ label: 'Under $50', min: 0, max: 50 }, { label: '$50 - $150', min: 50, max: 150 }, { label: 'Over $150', min: 150, max: '' }]
  },
  'CAT_ACCESSORY': {
    icon: Watch,
    brands: ['Mibro', 'Anker', 'Logitech', 'Garmin', 'Corsair', 'Samsung'],
    priceRanges: [{ label: 'Under $20', min: 0, max: 20 }, { label: '$20 - $50', min: 20, max: 50 }, { label: 'Over $50', min: 50, max: '' }]
  },
  'CAT_TABLET': {
    icon: Tablet,
    brands: ['Apple iPad', 'Samsung Galaxy Tab', 'Lenovo', 'Xiaomi'],
    priceRanges: [{ label: 'Under $300', min: 0, max: 300 }, { label: '$300 - $800', min: 300, max: 800 }, { label: 'Over $800', min: 800, max: '' }]
  },
  'CAT_MONITOR': {
    icon: Monitor,
    brands: ['LG', 'Samsung', 'Dell', 'Asus', 'BenQ'],
    priceRanges: [{ label: 'Under $200', min: 0, max: 200 }, { label: '$200 - $500', min: 200, max: 500 }, { label: '4K & Ultrawide', min: 500, max: '' }]
  },
  'CAT_GAMING': {
    icon: Gamepad,
    brands: ['PlayStation', 'Xbox', 'Nintendo', 'Razer', 'Logitech G'],
    priceRanges: [{ label: 'Under $100', min: 0, max: 100 }, { label: 'Consoles ($300+)', min: 300, max: '' }]
  }
};

const DEFAULT_META = {
  icon: Package,
  brands: ['Top Brands', 'Trending Deals'],
  priceRanges: [{ label: 'Under $50', min: 0, max: 50 }, { label: '$50 - $200', min: 50, max: 200 }, { label: 'Over $200', min: 200, max: '' }]
};

export default function Header() {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState('User');
  const [isShopManager, setIsShopManager] = useState(false); 
  
  const [searchInput, setSearchInput] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchRef = useRef<HTMLFormElement>(null); 

  const [showCategories, setShowCategories] = useState(false);
  const [categoriesList, setCategoriesList] = useState<any[]>([]);
  const [activeCategoryId, setActiveCategoryId] = useState<string>(''); 
  const catMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsMounted(true);
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('accessToken');
      const userId = localStorage.getItem('userId');
      if (token) {
        setIsLoggedIn(true);
        if (userId) {
          fetchUserProfile(userId, token);
          setIsShopManager(true); 
        }      
      }
    }

    const fetchCategories = async () => {
      try {
        const res = await fetch('http://localhost:8083/api/categories');
        if (res.ok) {
          const data = await res.json();
          const mergedData = data.map((cat: any) => ({
            id: cat.categoryId,
            name: cat.name,
            ...(CATEGORY_META[cat.categoryId] || DEFAULT_META)
          }));
          setCategoriesList(mergedData);
          if (mergedData.length > 0) setActiveCategoryId(mergedData[0].id);
        }
      } catch (error) {
        console.error("Lỗi load categories header:", error);
      }
    };
    fetchCategories();
  }, []);

  const fetchUserProfile = async (id: string, token: string) => {
    try {
      const response = await fetch(`http://localhost:8081/api/account/status/${id}`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      });
      if (response.ok) {
        const data = await response.json();
        if (data.profile && data.profile.name) setUserName(data.profile.name); 
      }
    } catch (error) {}
  };

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('userId');
    setIsLoggedIn(false);
    setUserName('User');
    toast.success('Đã đăng xuất thành công!');
    router.push('/login');
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchInput.trim().length >= 2) fetchSearchResults(searchInput.trim());
      else { setSearchResults([]); setShowDropdown(false); }
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [searchInput]);

  const fetchSearchResults = async (keyword: string) => {
    setIsSearching(true);
    try {
      const res = await fetch(`http://localhost:8083/api/internal/products/search?keyword=${encodeURIComponent(keyword)}`);
      if (res.ok) {
        setSearchResults(await res.json());
        setShowDropdown(true);
      }
    } catch (error) {} finally { setIsSearching(false); }
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) setShowDropdown(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [searchRef]);

  useEffect(() => {
    function handleCatClickOutside(event: MouseEvent) {
      if (catMenuRef.current && !catMenuRef.current.contains(event.target as Node)) setShowCategories(false);
    }
    document.addEventListener("mousedown", handleCatClickOutside);
    return () => document.removeEventListener("mousedown", handleCatClickOutside);
  }, [catMenuRef]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if(searchInput.trim()) {
       setShowDropdown(false); 
       router.push(`/products?keyword=${encodeURIComponent(searchInput.trim())}`);
    }
  };

  const fallbackImage = "https://placehold.co/100x100/f8fafc/94a3b8?text=Img";
  const activeCategoryData = categoriesList.find(c => c.id === activeCategoryId) || categoriesList[0];

  return (
    <header className="w-full bg-white border-b border-slate-200 font-sans sticky top-0 z-50 shadow-sm">
      {/* Tier 1: Top Bar */}
      <div className="hidden md:flex justify-between items-center px-4 lg:px-8 bg-slate-50 border-b border-slate-200 text-sm font-medium text-slate-600">
        <div className="flex items-center divide-x divide-slate-300 border-l border-slate-300">
          <Link href="/seller" className="px-5 py-2 hover:text-cyan-600 hover:bg-slate-200/50 transition-all">Seller Centre</Link>
          <Link href="#" className="px-5 py-2 hover:text-cyan-600 hover:bg-slate-200/50 transition-all border-r">Order Tracking</Link>
        </div>
        <div className="flex items-center border-l border-r border-slate-300">
          <button className="flex items-center gap-1.5 px-5 py-2 hover:text-cyan-600 hover:bg-slate-200/50 transition-all">
            $ USD <ChevronDown className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tier 2: Main Header */}
      <div className="px-4 lg:px-8 py-4 flex items-center justify-between gap-4 md:gap-8 border-b border-slate-100">
        <Link href="/" className="flex items-center shrink-0 group">
          <div className="flex items-center font-rubik tracking-tighter">
            <span className="text-2xl md:text-3xl font-black text-slate-900">Tech</span>
            <span className="text-2xl md:text-3xl font-black text-cyan-600 drop-shadow-[0_1.2px_1.2px_rgba(0,0,0,0.1)]">Stone</span>
          </div>
        </Link>

        {/* SEARCH BAR */}
        <form ref={searchRef} onSubmit={handleSearchSubmit} className="hidden md:flex flex-1 max-w-3xl relative mx-8">
          <input 
            type="text" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} onFocus={() => { if (searchResults.length > 0) setShowDropdown(true); }}
            placeholder="Search for laptops, PC components, accessories..." 
            className={`w-full bg-slate-100 border focus:bg-white focus:border-cyan-500 py-3.5 pl-6 pr-14 text-sm text-slate-900 transition-all placeholder:text-slate-500 shadow-sm outline-none ${showDropdown ? 'border-cyan-500 rounded-t-2xl' : 'border-transparent rounded-full'}`}
          />
          {isSearching && <Loader2 className="absolute right-12 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-cyan-600" />}
          <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-cyan-600 rounded-full text-white hover:bg-cyan-700 transition-colors shadow-sm"><Search className="w-4 h-4" /></button>

          {/* SEARCH DROPDOWN */}
          {showDropdown && (
            <div className="absolute top-full left-0 right-0 bg-white border border-t-0 border-cyan-500 rounded-b-2xl shadow-xl overflow-hidden z-50">
              {searchResults.length === 0 && !isSearching ? (
                 <div className="p-4 text-center text-sm text-slate-500">No products found for "{searchInput}"</div>
              ) : (
                <ul className="max-h-[400px] overflow-y-auto">
                  {searchResults.map((product) => (
                      <li key={product.productId} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                        <Link href={`/products/${product.productId}`} onClick={() => setShowDropdown(false)} className="flex items-center gap-4 p-3">
                          <div className="w-12 h-12 bg-white rounded-lg border border-slate-100 flex items-center justify-center shrink-0">
                            <img src={product.mainImage || fallbackImage} onError={(e) => { e.currentTarget.src = fallbackImage; }} alt={product.name} className="w-full h-full object-contain p-1" />
                          </div>
                          <div className="flex flex-col flex-1 min-w-0">
                            <span className="text-sm font-bold text-slate-900 line-clamp-1">{product.name}</span>
                            <span className="text-xs font-black text-cyan-600">${product.price}</span>
                          </div>
                        </Link>
                      </li>
                  ))}
                  <li className="bg-slate-50 p-2 text-center"><button onClick={handleSearchSubmit} className="text-xs font-bold text-cyan-600 hover:text-cyan-700 w-full">View all results for "{searchInput}"</button></li>
                </ul>
              )}
            </div>
          )}
        </form>
          
        {/* ACCOUNT, WISHLIST & CART */}
        <div className="flex items-center gap-5 shrink-0">
          
          {/* Nút So sánh (Compare - Ẩn trên mobile cho gọn) */}
          <button className="text-slate-600 hover:text-cyan-600 transition-colors hidden sm:block" title="Compare Products">
            <RefreshCcw className="w-6 h-6" />
          </button>

          {/* ========================================== */}
          {/* Nút Yêu thích (Wishlist) kèm Dropdown Hover  */}
          {/* ========================================== */}
          <div className="relative group">
            <Link href="/wishlist" className="flex text-slate-600 hover:text-cyan-600 transition-colors relative py-2" title="My Wishlist">
              <Heart className="w-6 h-6" />
              <span className="absolute top-0 -right-1.5 w-4 h-4 bg-red-500 text-[10px] font-bold text-white flex items-center justify-center rounded-full border-2 border-white shadow-sm">
                3
              </span>
            </Link>

            {/* Dropdown Menu Yêu thích */}
            <div className="absolute top-full right-0 w-80 bg-white border border-slate-200 shadow-2xl rounded-2xl overflow-hidden opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50 transform origin-top-right scale-95 group-hover:scale-100">
              <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                <h4 className="font-bold text-slate-900 text-sm">Recently Saved</h4>
                <span className="text-xs font-bold text-slate-400 bg-white px-2 py-1 rounded-md border border-slate-200">3 Items</span>
              </div>
              
              <div className="max-h-[300px] overflow-y-auto">
                {/* Mock Item 1 */}
                <Link href="#" className="flex items-center gap-4 p-4 border-b border-slate-50 hover:bg-slate-50 transition-colors group/item">
                  <div className="w-12 h-12 bg-white rounded-lg border border-slate-100 flex items-center justify-center shrink-0 overflow-hidden">
                    <img src="https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=100&q=80" alt="Phone" className="w-full h-full object-cover group-hover/item:scale-110 transition-transform" />
                  </div>
                  <div className="flex flex-col flex-1 min-w-0">
                    <span className="text-sm font-bold text-slate-900 line-clamp-1 group-hover/item:text-cyan-600 transition-colors">Samsung Galaxy S23 Ultra</span>
                    <span className="text-xs font-black text-red-500 mt-1">$949.00</span>
                  </div>
                </Link>
                {/* Mock Item 2 */}
                <Link href="#" className="flex items-center gap-4 p-4 border-b border-slate-50 hover:bg-slate-50 transition-colors group/item">
                  <div className="w-12 h-12 bg-white rounded-lg border border-slate-100 flex items-center justify-center shrink-0 overflow-hidden">
                    <img src="https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=100&q=80" alt="Laptop" className="w-full h-full object-cover group-hover/item:scale-110 transition-transform" />
                  </div>
                  <div className="flex flex-col flex-1 min-w-0">
                    <span className="text-sm font-bold text-slate-900 line-clamp-1 group-hover/item:text-cyan-600 transition-colors">MacBook Pro M3 14"</span>
                    <span className="text-xs font-black text-red-500 mt-1">$1,599.00</span>
                  </div>
                </Link>
              </div>

              <div className="p-3 bg-white border-t border-slate-100">
                <Link href="/wishlist" className="block w-full py-2.5 text-center bg-slate-900 text-white font-bold text-sm rounded-xl hover:bg-cyan-600 transition-colors shadow-md">
                  View Full Wishlist
                </Link>
              </div>
            </div>
          </div>
          {/* ========================================== */}

          {/* Đường gạch dọc phân cách */}
          <div className="h-8 w-px bg-slate-200 hidden md:block mx-1"></div>
          
          {/* KHỐI ĐĂNG NHẬP / USER INFO */}
          <div className="flex items-center min-w-[140px] shrink-0">
            {!isMounted ? (
              <div className="flex items-center gap-2"><div className="w-8 h-8 rounded-full bg-slate-100 animate-pulse"></div></div>
            ) : isLoggedIn ? (
              <div className="flex items-center gap-3 w-full">
                <Link href="/profile" className="flex items-center gap-2 group cursor-pointer hover:opacity-80 transition-all">
                  <div className="text-cyan-600 p-1.5 bg-cyan-50 rounded-full"><User className="w-5 h-5" /></div>
                  <div className="hidden lg:flex flex-col items-start">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none mb-0.5">Hello,</span>
                    <span className="text-sm font-bold text-slate-900 leading-none truncate max-w-[70px]">{userName}</span>
                  </div>
                </Link>
                {isShopManager && (
                  <>
                    <div className="h-6 w-px bg-slate-200 hidden md:block mx-1"></div>
                    <Link href="/seller" className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors shadow-sm"><Store className="w-4 h-4" /><span className="text-xs font-bold uppercase tracking-wider hidden md:block">Seller</span></Link>
                  </>
                )}
                <button onClick={handleLogout} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full"><LogOut className="w-[18px] h-[18px]" /></button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <div className="text-slate-600 p-1.5 bg-slate-100 rounded-full"><User className="w-5 h-5" /></div>
                <div className="hidden lg:flex flex-col items-start">
                  <div className="flex items-center gap-1 text-sm font-bold text-slate-900">
                    <Link href="/login" className="hover:text-cyan-600 transition-colors">Log In</Link>
                    <span className="text-slate-300 font-normal">/</span>
                    <Link href="/register" className="hover:text-cyan-600 transition-colors">Register</Link>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Nút Giỏ Hàng (Cart) */}
          <Link href="/cart" className="text-slate-600 hover:text-cyan-600 transition-colors relative ml-1" title="Shopping Cart">
            <ShoppingCart className="w-6 h-6" />
            <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-cyan-600 text-[10px] font-bold text-white flex items-center justify-center rounded-full border-2 border-white">
              2
            </span>
          </Link>
        </div>
      </div>

      {/* Tier 3: Navigation with MEGA MENU */}
      <div className="hidden md:flex px-4 lg:px-8 py-0 items-center gap-8 border-t border-slate-100">
        
        {/* MEGA MENU CONTAINER */}
        <div className="relative" ref={catMenuRef}>
          <button 
            onClick={() => setShowCategories(!showCategories)}
            className="flex items-center gap-3 bg-slate-900 px-6 py-3.5 text-sm font-bold text-white hover:bg-slate-800 transition-colors shadow-md"
          >
            <Menu className="w-5 h-5" />
            CATEGORIES
            <ChevronDown className={`w-4 h-4 ml-2 transition-transform ${showCategories ? 'rotate-180' : ''}`} />
          </button>

          {/* ĐÃ TĂNG CHIỀU RỘNG LÊN 960PX VÀ THÊM MIN-HEIGHT */}
          {showCategories && categoriesList.length > 0 && activeCategoryData && (
            <div className="absolute top-full left-0 w-[960px] bg-white border border-slate-200 shadow-2xl rounded-b-xl overflow-hidden z-50 flex animate-in fade-in slide-in-from-top-2 duration-200">
              
              {/* CỘT TRÁI: DANH MỤC CHÍNH */}
              <div className="w-1/3 bg-slate-50 border-r border-slate-100 min-h-[450px] max-h-[550px] overflow-y-auto">
                <ul className="flex flex-col py-4">
                  {categoriesList.map((cat) => {
                    const IconComponent = cat.icon;
                    return (
                      <li key={cat.id}>
                        <div 
                          onMouseEnter={() => setActiveCategoryId(cat.id)}
                          className={`flex items-center justify-between px-6 py-4 cursor-pointer transition-colors ${activeCategoryId === cat.id ? 'bg-white text-cyan-600 border-l-4 border-cyan-600' : 'text-slate-700 hover:bg-slate-100 border-l-4 border-transparent'}`}
                        >
                          <div className="flex items-center gap-3 font-bold text-sm">
                            <IconComponent className="w-5 h-5" /> {cat.name}
                          </div>
                          <ChevronRight className="w-4 h-4 opacity-50" />
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>

              {/* CỘT PHẢI: CHI TIẾT DANH MỤC (BRANDS & PRICE) */}
              <div className="w-2/3 p-8 bg-white min-h-[450px] max-h-[550px] overflow-y-auto">
                <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-100">
                  <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                     <activeCategoryData.icon className="w-6 h-6 text-cyan-600" /> 
                     {activeCategoryData.name}
                  </h3>
                  <Link 
                    href={`/products?category=${activeCategoryData.id}`} 
                    onClick={() => setShowCategories(false)}
                    className="text-sm font-bold text-cyan-600 hover:text-cyan-800 bg-cyan-50 px-4 py-2 rounded-full transition-colors"
                  >
                    View All Products
                  </Link>
                </div>

                <div className="grid grid-cols-2 gap-10">
                  {/* Khu vực Hãng (Brands) */}
                  <div>
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-5">Popular Brands</h4>
                    <ul className="space-y-4">
                      {activeCategoryData.brands.map((brand: string, idx: number) => (
                        <li key={idx}>
                          <Link 
                            href={`/products?category=${activeCategoryData.id}&keyword=${encodeURIComponent(brand)}`} 
                            onClick={() => setShowCategories(false)}
                            className="text-[15px] font-medium text-slate-700 hover:text-cyan-600 hover:translate-x-1 transition-transform inline-block"
                          >
                            {brand}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Khu vực Giá (Price) */}
                  <div>
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-5">Shop by Price</h4>
                    <ul className="space-y-4">
                      {activeCategoryData.priceRanges.map((price: any, idx: number) => (
                        <li key={idx}>
                          <Link 
                            href={`/products?category=${activeCategoryData.id}&minPrice=${price.min}&maxPrice=${price.max}`} 
                            onClick={() => setShowCategories(false)}
                            className="text-[15px] font-medium text-slate-700 hover:text-cyan-600 hover:translate-x-1 transition-transform inline-block"
                          >
                            {price.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

            </div>
          )}
        </div>

        <nav className="flex gap-8 text-sm font-semibold text-slate-600">
          <Link href="/" className="hover:text-cyan-600 transition-colors">Home</Link>
          <Link href="/brands" className="hover:text-cyan-600 transition-colors">Brands</Link>
          <Link href="/seller" className="hover:text-cyan-600 transition-colors">TechStore Mall</Link>
          <Link href="/about" className="hover:text-cyan-600 transition-colors">About Us</Link>
        </nav>
      </div>
    </header>
  );
}