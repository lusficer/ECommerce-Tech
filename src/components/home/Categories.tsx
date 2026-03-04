import React from 'react';
import { Laptop, Smartphone, Tablet, Headphones, Watch, Monitor, Gamepad, Mouse, ArrowRight } from 'lucide-react';

const CATEGORIES = [
  { name: 'Laptops', icon: Laptop },
  { name: 'Phones', icon: Smartphone },
  { name: 'Tablets', icon: Tablet },
  { name: 'Audio', icon: Headphones },
  { name: 'Watches', icon: Watch },
  { name: 'Monitors', icon: Monitor },
  { name: 'Gaming', icon: Gamepad },
  { name: 'Accessories', icon: Mouse },
];

export default function Categories() {
  return (
    <section className="w-full mt-16">
      {/* Title & View All */}
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Tech Categories</h2>
        <button className="text-sm font-bold text-slate-600 hover:text-blue-600 flex items-center gap-1 transition-colors uppercase tracking-wide">
          View All <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Circular Icons Grid */}
      <div className="grid grid-cols-4 md:grid-cols-8 gap-4 mb-12">
        {CATEGORIES.map((category, index) => (
          <div key={index} className="flex flex-col items-center gap-3 group cursor-pointer">
            <div className="w-20 h-20 rounded-full bg-white border border-slate-200 shadow-sm flex items-center justify-center group-hover:border-blue-500 group-hover:shadow-md transition-all duration-300">
              <category.icon className="w-8 h-8 text-slate-600 group-hover:text-blue-600 transition-colors" strokeWidth={1.5} />
            </div>
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wide group-hover:text-blue-600 transition-colors">
              {category.name}
            </span>
          </div>
        ))}
      </div>

      {/* Trust Banner (12k+ active users) */}
      <div className="w-full bg-slate-100 rounded-2xl py-6 flex items-center justify-center border border-slate-200">
        <p className="text-lg font-medium text-slate-700">
          Over <span className="font-bold text-slate-900">50k+ active tech users</span> trust us everyday
        </p>
      </div>
    </section>
  );
}