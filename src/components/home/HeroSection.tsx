import React from 'react';
import { ArrowRight } from 'lucide-react';

export default function HeroSection() {
  return (
    <section className="w-full">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 md:h-[500px]">
        
        <div className="md:col-span-8 relative rounded-3xl overflow-hidden bg-white shadow-sm border border-slate-200 group h-[400px] md:h-full flex flex-col justify-center p-8 md:p-12 cursor-pointer hover:shadow-md transition-shadow">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-50 to-slate-100 z-0"></div>
          
          <div className="relative z-10 max-w-lg">
            <p className="text-blue-600 font-bold mb-3 tracking-wider text-xs uppercase">Pro Performance</p>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-slate-900 mb-4 tracking-tight leading-tight">
              Powerful <br/> Laptops.
            </h1>
            <p className="text-slate-600 text-lg mb-8">
              Experience cutting-edge performance with the latest M3 architecture. Light, strong, and impossibly fast.
            </p>
            <button className="bg-slate-900 text-white px-8 py-3.5 rounded-full font-semibold hover:bg-blue-600 transition-colors flex items-center gap-2 group-hover:scale-105 duration-300 w-fit shadow-lg shadow-slate-900/20">
              Shop Now <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Right: Stacked Banners (Takes 4 columns) */}
        <div className="md:col-span-4 flex flex-col gap-5 h-[500px] md:h-full">
          
          {/* Top Small Banner */}
          <div className="flex-1 relative rounded-3xl overflow-hidden bg-white shadow-sm border border-slate-200 group p-8 cursor-pointer flex flex-col justify-center hover:shadow-md transition-shadow">
            <div className="absolute inset-0 bg-gradient-to-tr from-slate-100 to-slate-50 z-0"></div>
            <div className="relative z-10">
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Smartphones</h2>
              <p className="text-slate-600 text-sm mb-4">Connect and capture every moment beautifully.</p>
              <span className="text-sm font-bold text-blue-600 group-hover:text-blue-700 flex items-center gap-1">
                View Deals <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
              </span>
            </div>
          </div>

          {/* Bottom Small Banner */}
          <div className="flex-1 relative rounded-3xl overflow-hidden bg-white shadow-sm border border-slate-200 group p-8 cursor-pointer flex flex-col justify-center hover:shadow-md transition-shadow">
             <div className="absolute inset-0 bg-gradient-to-br from-slate-100 to-slate-50 z-0"></div>
            <div className="relative z-10">
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Accessories</h2>
              <p className="text-slate-600 text-sm mb-4">Enhance your daily tech ecosystem.</p>
              <span className="text-sm font-bold text-blue-600 group-hover:text-blue-700 flex items-center gap-1">
                Explore Now <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
              </span>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}