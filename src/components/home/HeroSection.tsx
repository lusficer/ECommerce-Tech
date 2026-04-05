'use client';

import React from 'react';
import { ArrowRight, Zap } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function HeroSection() {
  const router = useRouter();

  return (
    <section className="w-full font-sans mb-12">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 md:h-[520px]">
        <div 
          onClick={() => router.push('/products?category=CAT_LAPTOP')}
          className="md:col-span-8 relative rounded-3xl overflow-hidden bg-slate-900 group h-[400px] md:h-full flex flex-col justify-center p-8 md:p-14 cursor-pointer border border-slate-200 hover:shadow-2xl transition-all duration-500"
        >
          <img 
            src="https://images.unsplash.com/photo-1603302576837-37561b2e2302?q=80&w=2068&auto=format&fit=crop" 
            alt="Premium Laptops" 
            className="absolute inset-0 w-full h-full object-cover object-right group-hover:scale-105 transition-transform duration-700"
          />
          
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-900/80 to-transparent"></div>

          <div className="relative z-10 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/80 border border-slate-700 backdrop-blur-md mb-6">
              <Zap className="w-4 h-4 text-cyan-400 fill-cyan-400" />
              <span className="text-xs font-bold text-cyan-300 uppercase tracking-widest">Next-Gen Performance</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white mb-6 tracking-tight leading-[1.1]">
              Unleash <br/> Ultimate Power.
            </h1>
            
            <p className="text-slate-300 text-lg mb-8 font-medium max-w-md leading-relaxed">
              Experience the cutting-edge architecture engineered for heavy workloads and ultra-fast processing.
            </p>
            
            <button className="bg-cyan-600 text-white px-8 py-3.5 rounded-xl font-black hover:bg-cyan-500 transition-colors shadow-lg shadow-cyan-600/30 flex items-center gap-2 w-fit">
              Shop Laptops <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
        <div className="md:col-span-4 flex flex-col gap-5">
          <div 
            onClick={() => router.push('/products?category=CAT_PHONE')}
            className="flex-1 relative rounded-3xl overflow-hidden bg-slate-100 shadow-sm border border-slate-200 group p-8 cursor-pointer flex flex-col justify-end hover:shadow-xl transition-all"
          >
            <img 
              src="https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?q=80&w=2070&auto=format&fit=crop" 
              alt="Smartphones" 
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-transparent"></div>
            
            <div className="relative z-10">
              <span className="text-[10px] font-black text-cyan-400 uppercase tracking-widest mb-1 block drop-shadow-md">Flagship Series</span>
              <h2 className="text-2xl font-black text-white mb-2 drop-shadow-md">Smartphones</h2>
              <p className="text-slate-200 text-sm mb-5 font-medium max-w-[200px] drop-shadow-md">The world at your fingertips. Capture and connect.</p>
            </div>
          </div>

          <div 
            onClick={() => router.push('/products?category=CAT_ACCESSORY')}
            className="flex-1 relative rounded-3xl overflow-hidden bg-slate-900 shadow-sm border border-slate-200 group p-8 cursor-pointer flex flex-col justify-end hover:shadow-xl transition-all"
          >
            <img 
              src="https://images.unsplash.com/photo-1595225476474-87563907a212?q=80&w=2071&auto=format&fit=crop" 
              alt="Accessories" 
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-transparent"></div>

            <div className="relative z-10">
              <span className="text-[10px] font-black text-cyan-400 uppercase tracking-widest mb-1 block drop-shadow-md">Setup Essentials</span>
              <h2 className="text-2xl font-black text-white mb-2 drop-shadow-md">Tactile Mastery</h2>
              <p className="text-slate-200 text-sm mb-5 font-medium max-w-[220px] drop-shadow-md">Premium mechanical keyboards and desk accessories.</p>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}