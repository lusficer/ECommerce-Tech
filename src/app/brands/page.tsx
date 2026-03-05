'use client';
import React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export default function BrandsPage() {
  const brands = [
    { name: 'Apple', desc: 'Think Different.', logo: 'https://placehold.co/200x100/f8fafc/0f172a?text=APPLE' },
    { name: 'Samsung', desc: 'Inspire the World.', logo: 'https://placehold.co/200x100/f8fafc/1d4ed8?text=SAMSUNG' },
    { name: 'Sony', desc: 'Be Moved.', logo: 'https://placehold.co/200x100/f8fafc/000000?text=SONY' },
    { name: 'Dell', desc: 'Power to do more.', logo: 'https://placehold.co/200x100/f8fafc/0284c7?text=DELL' },
    { name: 'Asus ROG', desc: 'Republic of Gamers.', logo: 'https://placehold.co/200x100/f8fafc/dc2626?text=ROG' },
    { name: 'Logitech', desc: 'Defy Logic.', logo: 'https://placehold.co/200x100/f8fafc/0ea5e9?text=LOGITECH' },
    { name: 'Google', desc: 'Pixel & Nest Hubs.', logo: 'https://placehold.co/200x100/f8fafc/16a34a?text=GOOGLE' },
    { name: 'Anker', desc: 'Charge Fast, Live More.', logo: 'https://placehold.co/200x100/f8fafc/2563eb?text=ANKER' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-20">
      
      {/* Header */}
      <div className="bg-white border-b border-slate-200 py-16 text-center px-4">
        <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-4">Our Trusted Partners</h1>
        <p className="text-slate-500 max-w-2xl mx-auto">We collaborate with the world's most innovative tech brands to bring you original, high-quality, and warranty-backed products.</p>
      </div>

      {/* Brands Grid */}
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {brands.map((brand, idx) => (
            <Link 
              href={`/products?keyword=${brand.name}`} 
              key={idx}
              className="group bg-white rounded-3xl border border-slate-200 p-8 flex flex-col items-center text-center hover:border-cyan-500 hover:shadow-xl transition-all"
            >
              <div className="w-full h-24 mb-6 flex items-center justify-center grayscale group-hover:grayscale-0 transition-all duration-300">
                <img src={brand.logo} alt={brand.name} className="max-h-full max-w-full object-contain" />
              </div>
              <h3 className="text-xl font-black text-slate-900 mb-1">{brand.name}</h3>
              <p className="text-xs text-slate-400 font-medium mb-4">{brand.desc}</p>
              
              <div className="mt-auto flex items-center gap-1 text-sm font-bold text-cyan-600 opacity-0 group-hover:opacity-100 transition-opacity">
                Shop Brand <ArrowRight className="w-4 h-4" />
              </div>
            </Link>
          ))}
        </div>
      </div>

    </div>
  );
}