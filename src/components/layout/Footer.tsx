import React from 'react';
import Link from 'next/link';
import { ArrowRight, Twitter, Facebook, Instagram, Youtube, Globe, Apple, CreditCard } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="w-full bg-slate-100 pt-16 pb-8 border-t border-slate-200 font-sans mt-20">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Top Section: 4 Columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-8 mb-16">
          
          {/* Col 1: Newsletter & Socials (Takes up 4 columns) */}
          <div className="lg:col-span-4 pr-0 lg:pr-10">
            <p className="text-slate-600 font-medium mb-6 leading-relaxed">
              Be the first to get the latest news about tech trends, promotions and much more!
            </p>
            
            <div className="relative mb-4">
              <input 
                type="email" 
                placeholder="Enter your email address" 
                className="w-full bg-white border border-slate-200 rounded-lg py-3.5 pl-4 pr-12 text-sm focus:outline-none focus:border-orange-500 shadow-sm transition-colors"
              />
              <button className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-900 hover:text-orange-500 transition-colors">
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
            
            <p className="text-xs text-slate-500 mb-8">
              By subscribing, you accept the <Link href="#" className="font-bold text-slate-700 hover:text-orange-500 underline underline-offset-2">Privacy Policy</Link>
            </p>

            <div className="flex items-center gap-5 text-slate-900">
              <Link href="#" className="hover:text-orange-500 transition-colors"><Twitter className="w-4 h-4" /></Link>
              <Link href="#" className="hover:text-orange-500 transition-colors"><Facebook className="w-4 h-4" /></Link>
              <Link href="#" className="hover:text-orange-500 transition-colors"><Instagram className="w-4 h-4" /></Link>
              <Link href="#" className="hover:text-orange-500 transition-colors"><Youtube className="w-4 h-4" /></Link>
            </div>
          </div>

          {/* Col 2: Get In Touch (Takes up 3 columns) */}
          <div className="lg:col-span-3">
            <h3 className="text-base font-black text-slate-900 mb-6">Get In Touch</h3>
            <ul className="space-y-4 text-sm text-slate-600">
              <li className="leading-relaxed">1 Infinite Loop, Cupertino,<br/>CA, 95014</li>
              <li>+1 (800) 123 4567</li>
              <li><Link href="mailto:support@techstore.com" className="hover:text-orange-500 transition-colors">support@techstore.com</Link></li>
            </ul>
          </div>

          {/* Col 3: Help/Policies (Takes up 3 columns) */}
          <div className="lg:col-span-3">
            <ul className="space-y-4 text-sm text-slate-600">
              <li><Link href="#" className="hover:text-orange-500 transition-colors">FAQs</Link></li>
              <li><Link href="#" className="hover:text-orange-500 transition-colors">Payment</Link></li>
              <li><Link href="#" className="hover:text-orange-500 transition-colors">Shipping</Link></li>
              <li><Link href="#" className="hover:text-orange-500 transition-colors">Guest purchase</Link></li>
              <li><Link href="#" className="hover:text-orange-500 transition-colors">Returns</Link></li>
              <li><Link href="#" className="hover:text-orange-500 transition-colors">Terms & Conditions</Link></li>
              <li><Link href="#" className="hover:text-orange-500 transition-colors">Gift Card</Link></li>
            </ul>
          </div>

          {/* Col 4: About (Takes up 2 columns) */}
          <div className="lg:col-span-2">
            <ul className="space-y-4 text-sm text-slate-600">
              <li><Link href="#" className="hover:text-orange-500 transition-colors">About Store</Link></li>
              <li><Link href="#" className="hover:text-orange-500 transition-colors">Contact</Link></li>
              <li><Link href="#" className="hover:text-orange-500 transition-colors">Careers</Link></li>
              <li><Link href="#" className="hover:text-orange-500 transition-colors">Editorial</Link></li>
            </ul>
          </div>

        </div>

        {/* Bottom Section: Payments, Logo, Language */}
        <div className="border-t border-slate-200 pt-8 flex flex-col md:flex-row items-center justify-between gap-6">
          
          {/* Payments (Giả lập bằng icon thẻ tín dụng vì Lucide ko có logo Visa/Master) */}
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-500 mr-2">Accept for</span>
            <div className="flex gap-2 text-slate-700">
              <CreditCard className="w-8 h-8" />
              {/* Thêm text giả logo thanh toán */}
              <span className="font-black italic text-blue-800 text-lg tracking-tighter">VISA</span>
              <span className="font-bold text-red-500 text-lg">Pay<span className="text-blue-500">Pal</span></span>
            </div>
          </div>

          {/* Center Logo */}
          <div className="flex items-center gap-1.5 text-slate-900">
            <Apple className="w-6 h-6 text-slate-900" />
            <span className="text-xl font-black tracking-tight">Tech<span className="text-blue-600">Mall</span></span>
          </div>

          {/* Language Selector */}
          <div className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer hover:text-orange-500 transition-colors">
            <Globe className="w-4 h-4" />
            <span>Language: <span className="font-bold text-slate-900">English</span></span>
          </div>

        </div>

        {/* Copyright */}
        <div className="mt-8 text-center text-xs text-slate-400">
          © {new Date().getFullYear()} TechStore. All Rights Reserved.
        </div>

      </div>
    </footer>
  );
}