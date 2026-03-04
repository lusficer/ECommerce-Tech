'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast'; // Đảm bảo bạn đã cài react-hot-toast
import { Search, Heart, User, ShoppingCart, RefreshCcw, Menu, Phone, ChevronDown, LogOut, Store } from 'lucide-react';

export default function Header() {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState('User');
  const [isShopManager, setIsShopManager] = useState(false); 
    useEffect(() => {
    setIsMounted(true);
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('accessToken');
      const userId = localStorage.getItem('userId'); // Giả sử bạn lưu userId khi đăng nhập
      if (token) {
        setIsLoggedIn(true);
        if (userId) {
          fetchUserProfile(userId, token);
          setIsShopManager(true);
        }      
      }
    }
  }, []);

  const fetchUserProfile = async (id: string, token: string) => {
    try {
      const response = await fetch(`http://localhost:8081/api/account/status/${id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`, // Gắn chìa khóa Token vào đây
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        // Cập nhật tên lên giao diện từ data.profile.name
        if (data.profile && data.profile.name) {
          setUserName(data.profile.name); 
        }
      }
    } catch (error) {
      console.error("Lỗi khi lấy thông tin user:", error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('userId'); // Nhớ xóa luôn userId khi đăng xuất
    setIsLoggedIn(false);
    setUserName('User'); // Reset lại tên
    toast.success('Đã đăng xuất thành công!');
    router.push('/login');
  };

  return (
    <header className="w-full bg-white border-b border-slate-200 font-sans sticky top-0 z-50 shadow-sm">
      {/* Tier 1: Top Bar */}
      <div className="hidden md:flex justify-between items-center px-4 lg:px-8 bg-slate-50 border-b border-slate-200 text-sm font-medium text-slate-600">
        <div className="flex items-center divide-x divide-slate-300 border-l border-slate-300">
          <Link href="#" className="px-5 py-2 hover:text-cyan-600 hover:bg-slate-200/50 transition-all">
            Seller Centre
          </Link>
          <Link href="#" className="px-5 py-2 hover:text-cyan-600 hover:bg-slate-200/50 transition-all border-r">
            Order Tracking
          </Link>
        </div>
        <div className="flex items-center border-l border-r border-slate-300">
          <button className="flex items-center gap-1.5 px-5 py-2 hover:text-cyan-600 hover:bg-slate-200/50 transition-all">
            $ USD <ChevronDown className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tier 2: Main Header */}
      <div className="px-4 lg:px-8 py-4 flex items-center justify-between gap-4 md:gap-8 border-b border-slate-100">
        
        {/* Logo */}
        <Link href="/" className="flex items-center shrink-0 group">
          <div className="flex items-center font-rubik tracking-tighter">
            <span className="text-2xl md:text-3xl font-black text-slate-900">Tech</span>
            <span className="text-2xl md:text-3xl font-black text-cyan-600 drop-shadow-[0_1.2px_1.2px_rgba(0,0,0,0.1)]">Stone</span>
            <div className="ml-1 w-2 h-2 rounded-full bg-cyan-500 animate-pulse hidden md:block" />
          </div>
        </Link>

        {/* Search Bar */}
        <div className="hidden md:flex flex-1 max-w-3xl relative">
          <input 
            type="text" 
            placeholder="Search for laptops, PC components, accessories..." 
            className="w-full bg-slate-100 border border-transparent focus:bg-white focus:border-cyan-500 rounded-full py-3.5 pl-6 pr-12 text-sm text-slate-900 transition-all placeholder:text-slate-500 shadow-sm outline-none"
          />
          <button className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-cyan-600 rounded-full text-white hover:bg-cyan-700 transition-colors shadow-sm">
            <Search className="w-5 h-5" />
          </button>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-5 shrink-0">
          <button className="text-slate-600 hover:text-cyan-600 transition-colors hidden sm:block">
            <RefreshCcw className="w-6 h-6" />
          </button>
          <button className="text-slate-600 hover:text-cyan-600 transition-colors relative">
            <Heart className="w-6 h-6" />
            <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-cyan-600 text-[10px] font-bold text-white flex items-center justify-center rounded-full border-2 border-white">0</span>
          </button>

          <div className="h-8 w-px bg-slate-200 hidden md:block mx-1"></div>
          
          {/* --- KHỐI ĐĂNG NHẬP (Đã được fix cứng chiều rộng để không vỡ layout) --- */}
          <div className="flex items-center min-w-[140px] shrink-0">
            {!isMounted ? (
              // Trạng thái Loading (Skeleton)
              <div className="flex items-center gap-2">
                 <div className="w-8 h-8 rounded-full bg-slate-100 animate-pulse"></div>
                 <div className="hidden lg:block w-20 h-4 bg-slate-100 animate-pulse rounded"></div>
              </div>
            ) : isLoggedIn ? (
              <div className="flex items-center gap-3 w-full">
                
                <Link href="/profile" className="flex items-center gap-2 group cursor-pointer hover:opacity-80 transition-all">
                  <div className="text-cyan-600 p-1.5 bg-cyan-50 rounded-full">
                    <User className="w-5 h-5" />
                  </div>
                  <div className="hidden lg:flex flex-col items-start">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none mb-0.5">Hello,</span>
                    
                    {/* 3. HIỂN THỊ TÊN ĐỘNG TẠI ĐÂY */}
                    <span className="text-sm font-bold text-slate-900 leading-none truncate max-w-[70px]">{userName}</span>
                    
                  </div>
                </Link>
                {isShopManager && (
                  <>
                    <div className="h-6 w-px bg-slate-200 hidden md:block mx-1"></div>
                    <Link href="/seller" className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors shadow-sm group">
                      <Store className="w-4 h-4 group-hover:scale-110 transition-transform" />
                      <span className="text-xs font-bold uppercase tracking-wider hidden md:block">Seller</span>
                    </Link>
                  </>
                )}
                <button onClick={handleLogout} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors ml-auto" title="Log Out">
                  <LogOut className="w-[18px] h-[18px]" />
                </button>
              </div>
            )
            : (
              // Trạng thái: CHƯA ĐĂNG NHẬP
              <div className="flex items-center gap-2 group">
                <div className="text-slate-600 p-1.5 bg-slate-100 rounded-full group-hover:bg-slate-200 transition-colors">
                  <User className="w-5 h-5" />
                </div>
                <div className="hidden lg:flex flex-col items-start">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none mb-0.5">Welcome</span>
                  <div className="flex items-center gap-1 text-sm font-bold text-slate-900 leading-none">
                    <Link href="/login" className="hover:text-cyan-600 transition-colors">Log In</Link>
                    <span className="text-slate-300 font-normal">/</span>
                    <Link href="/register" className="hover:text-cyan-600 transition-colors">Register</Link>
                  </div>
                </div>
              </div>
            )}
          </div>
          {/* ----------------------------------------------------------------- */}

          <button className="text-slate-600 hover:text-cyan-600 transition-colors relative ml-1">
            <ShoppingCart className="w-6 h-6" />
            <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-cyan-600 text-[10px] font-bold text-white flex items-center justify-center rounded-full border-2 border-white">2</span>
          </button>
        </div>
      </div>

      {/* Tier 3: Navigation */}
      <div className="hidden md:flex px-4 lg:px-8 py-0 items-center gap-8 border-t border-slate-100">
        <button className="flex items-center gap-3 bg-slate-900 px-6 py-3.5 text-sm font-bold text-white hover:bg-slate-800 transition-colors shadow-md">
          <Menu className="w-5 h-5" />
          CATEGORIES
          <ChevronDown className="w-4 h-4 ml-2" />
        </button>

        <nav className="flex gap-8 text-sm font-semibold text-slate-600">
          <Link href="/" className="text-cyan-600">Home</Link>
          <Link href="#" className="hover:text-cyan-600 flex items-center gap-1 transition-colors">
            Products <ChevronDown className="w-3 h-3" />
          </Link>
          <Link href="#" className="hover:text-cyan-600 transition-colors">Brands</Link>
          <Link href="#" className="hover:text-cyan-600 transition-colors">TechStore Mall</Link>
          <Link href="#" className="hover:text-cyan-600 transition-colors">About</Link>
        </nav>
      </div>
    </header>
  );
}