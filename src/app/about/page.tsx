'use client';
import React from 'react';
import { Target, ShieldCheck, Truck, HeadphonesIcon, Award } from 'lucide-react';
import Link from 'next/link';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-20">
      {/* Hero Section */}
      <div className="bg-slate-900 text-white py-24 text-center px-4 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-cyan-400 via-slate-900 to-slate-900"></div>
        <div className="relative z-10 max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-6">Redefining the <span className="text-cyan-500">Tech</span> Experience.</h1>
          <p className="text-lg text-slate-400 leading-relaxed">TechStone is your ultimate destination for premium electronics, cutting-edge gadgets, and unrivaled customer service.</p>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 mt-[-40px] relative z-20">
        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-8 md:p-12 text-center">
          <h2 className="text-2xl font-black text-slate-900 mb-4">Our Mission</h2>
          <p className="text-slate-600 leading-relaxed max-w-2xl mx-auto">We believe that technology should be accessible, reliable, and inspiring. Our mission is to bridge the gap between top-tier manufacturers and tech enthusiasts by providing a seamless, transparent, and highly secure multivendor marketplace.</p>
        </div>
      </div>

      {/* Core Values */}
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-black text-slate-900">Why Choose TechStone?</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            { icon: ShieldCheck, title: "100% Secure", desc: "All vendors are strictly verified. Your payments and data are heavily encrypted." },
            { icon: Truck, title: "Fast Delivery", desc: "Our integrated warehouse system ensures lightning-fast shipping to your door." },
            { icon: Award, title: "Premium Brands", desc: "We partner directly with top brands to guarantee authentic products." },
            { icon: HeadphonesIcon, title: "24/7 Support", desc: "Our dedicated tech experts are always ready to help you out." }
          ].map((item, idx) => (
            <div key={idx} className="bg-white p-8 rounded-3xl border border-slate-200 hover:border-cyan-500 hover:shadow-lg transition-all text-center group">
              <div className="w-16 h-16 bg-cyan-50 text-cyan-600 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 group-hover:bg-cyan-600 group-hover:text-white transition-all">
                <item.icon className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-black text-slate-900 mb-2">{item.title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 text-center">
        <div className="bg-cyan-600 rounded-3xl p-12 text-white shadow-xl shadow-cyan-600/20">
           <h2 className="text-3xl font-black mb-4">Ready to upgrade your gear?</h2>
           <p className="text-cyan-100 mb-8 max-w-xl mx-auto">Explore over 500+ curated products from our trusted vendors.</p>
           <Link href="/products" className="inline-block px-8 py-4 bg-white text-cyan-700 font-black rounded-xl hover:bg-slate-50 hover:scale-105 transition-all shadow-md">
             Start Shopping Now
           </Link>
        </div>
      </div>
    </div>
  );
}