import React from 'react';
import Link from 'next/link';
import { Search, Heart, User, ShoppingCart, RefreshCcw, Menu, Phone, ChevronDown, Apple } from 'lucide-react';

export default function Header() {
  return (
    <header className="w-full bg-white border-b border-slate-200 font-sans sticky top-0 z-50">
      {/* Tier 1: Top Bar */}
      <div className="hidden md:flex justify-between items-center px-4 lg:px-8 bg-slate-50 border-b border-slate-200 text-sm font-medium text-slate-600">
        
        {/* Left Side (Links with borders) */}
        <div className="flex items-center divide-x divide-slate-300  border-slate-300">
          <Link href="#" className="px-5 py-2.5 hover:text-blue-700 hover:bg-slate-200/50 transition-all">
            Become a Vendor
          </Link>
          <Link href="#" className="px-5 py-2.5 hover:text-blue-700 hover:bg-slate-200/50 border-r border-slate-300 transition-all">
            Order Tracking
          </Link>
        </div>

        {/* Right Side (Currency with border) */}
        <div className="flex items-center border-l border-r border-slate-300">
          <button className="flex items-center gap-1.5 px-5 py-2.5 hover:text-blue-700 hover:bg-slate-200/50 transition-all">
            $ USD <ChevronDown className="w-4 h-4" />
          </button>
        </div>
        
      </div>

      {/* Tier 2: Main Header */}
      <div className="px-4 lg:px-8 py-4 lg:py-5 flex items-center justify-between gap-4 md:gap-8 border-b border-slate-100">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 text-slate-900 shrink-0 group">
          <Apple className="w-8 h-8 group-hover:text-blue-600 transition-colors" />
          <span className="text-xl font-black tracking-tight">Tech<span className="text-blue-600">Mall</span></span>


        </Link>

        {/* Big Search Bar (Center) - Fixed width issue */}
        <div className="hidden md:flex flex-1 max-w-3xl relative">
          <input 
            type="text" 
            placeholder="Search for laptops, phones, accessories..." 
            className="w-full bg-slate-100 border border-transparent focus:bg-white focus:border-blue-500 rounded-full py-3 pl-6 pr-12 text-sm text-slate-900 transition-all placeholder:text-slate-500 shadow-sm"
          />
          <button className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-blue-600 rounded-full text-white bhover:bg-lue-700 transition-colors shadow-sm">
            <Search className="w-4 h-4" />
          </button>
        </div>

        {/* Right Actions & Hotline */}
        <div className="flex items-center gap-6 shrink-0">
          <div className="hidden xl:flex items-center gap-3 mr-4">
            <div className="p-2.5 bg-slate-100 rounded-full text-blue-600">
              <Phone className="w-4 h-4" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-slate-500">Hotline 24/7</span>
              <span className="text-sm font-bold text-slate-900">(025) 3686 25 16</span>
            </div>
          </div>

          <div className="flex items-center gap-5">
            <button className="text-slate-600 hover:text-blue-600 transition-colors hidden sm:block">
              <RefreshCcw className="w-6 h-6" />
            </button>
            <button className="text-slate-600 hover:text-blue-600 transition-colors relative">
              <Heart className="w-6 h-6" />
              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-blue-600 text-[10px] font-bold text-white flex items-center justify-center rounded-full border-2 border-white">
                0
              </span>
            </button>
            <button className="text-slate-600 hover:text-blue-600 transition-colors">
              <User className="w-6 h-6" />
            </button>
            <button className="text-slate-600 hover:text-blue-600 transition-colors relative">
              <ShoppingCart className="w-6 h-6" />
              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-blue-600 text-[10px] font-bold text-white flex items-center justify-center rounded-full border-2 border-white">
                2
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Tier 3: Navigation */}
      <div className="hidden md:flex px-4 lg:px-8 py-0 items-center gap-8">
        {/* Categories Dropdown Button */}
        <button className="flex items-center gap-3 bg-slate-900 px-6 py-3.5 text-sm font-bold text-white hover:bg-slate-800 transition-colors shadow-md">
          <Menu className="w-5 h-5" />
          CATEGORIES
          <ChevronDown className="w-4 h-4 ml-2" />
        </button>

        {/* Nav Links */}
        <nav className="flex gap-8 text-sm font-semibold text-slate-600">
          <Link href="#" className="text-slate-900">Home</Link>
          <Link href="#" className="hover:text-blue-600 flex items-center gap-1 transition-colors">
            Products <ChevronDown className="w-3 h-3" />
          </Link>
          <Link href="#" className="hover:text-blue-600 transition-colors">Brands</Link>
          <Link href="#" className="hover:text-blue-600 transition-colors">Contact</Link>
          <Link href="#" className="hover:text-blue-600 transition-colors">About</Link>
        </nav>
      </div>
    </header>
  );
}