// page.tsx (Trang Brands)
'use client';
import React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export default function BrandsPage() {
  const brands = [
    { name: 'Acer', desc: 'Explore Beyond.', logo: 'https://upload.wikimedia.org/wikipedia/commons/8/8b/Acer-logo.svg' },
    { name: 'Apple', desc: 'Think Different.', logo: 'https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg' },
    { name: 'Asus', desc: 'In Search of Incredible.', logo: 'https://upload.wikimedia.org/wikipedia/commons/2/2e/ASUS_Logo.svg' },
    { name: 'Belkin', desc: 'Be Ready.', logo: 'https://upload.wikimedia.org/wikipedia/commons/1/1d/Belkin_logo.svg' },
    { name: 'Bose', desc: 'Better Sound Through Research.', logo: 'https://upload.wikimedia.org/wikipedia/commons/3/37/Bose_logo.svg' },
    { name: 'Canon', desc: 'Delighting You Always.', logo: 'https://upload.wikimedia.org/wikipedia/commons/b/bd/Canon_logo.svg' },
    { name: 'Dell', desc: 'Power to do more.', logo: 'https://upload.wikimedia.org/wikipedia/commons/1/18/Dell_logo_2016.svg' },
    { name: 'HP', desc: 'Keep Reinventing.', logo: 'https://upload.wikimedia.org/wikipedia/commons/a/ad/HP_logo_2012.svg' },
    { name: 'JBL', desc: 'Dare to Listen.', logo: 'https://upload.wikimedia.org/wikipedia/commons/2/22/JBL_logo.svg' },
    { name: 'LG', desc: "Life's Good.", logo: 'https://upload.wikimedia.org/wikipedia/commons/b/bf/LG_logo_%282015%29.svg' },
    { name: 'Lenovo', desc: 'Smarter technology for all.', logo: 'https://upload.wikimedia.org/wikipedia/commons/b/b8/Lenovo_logo_2015.svg' },
    { name: 'Logitech', desc: 'Defy Logic.', logo: 'https://upload.wikimedia.org/wikipedia/commons/1/17/Logitech_logo.svg' },
    { name: 'Motorola', desc: 'Hello Moto.', logo: 'https://upload.wikimedia.org/wikipedia/commons/e/e0/Motorola_Logo.svg' },
    { name: 'Nikon', desc: 'At the heart of the image.', logo: 'https://upload.wikimedia.org/wikipedia/commons/d/da/Nikon_logo.svg' },
    { name: 'Nintendo', desc: "There's no play like it.", logo: 'https://upload.wikimedia.org/wikipedia/commons/0/0d/Nintendo.svg' },
    { name: 'OnePlus', desc: 'Never Settle.', logo: 'https://upload.wikimedia.org/wikipedia/commons/7/7b/OnePlus_logo.svg' },
    { name: 'Panasonic', desc: 'A Better Life, A Better World.', logo: 'https://upload.wikimedia.org/wikipedia/commons/d/de/Panasonic_logo.svg' },
    { name: 'Samsung', desc: 'Inspire the World.', logo: 'https://upload.wikimedia.org/wikipedia/commons/2/24/Samsung_Logo.svg' },
    { name: 'Sony', desc: 'Be Moved.', logo: 'https://upload.wikimedia.org/wikipedia/commons/c/ca/Sony_logo.svg' },
    { name: 'Toshiba', desc: 'Leading Innovation.', logo: 'https://upload.wikimedia.org/wikipedia/commons/b/b3/Toshiba_logo.svg' },
    { name: 'Xiaomi', desc: 'Innovation for everyone.', logo: 'https://upload.wikimedia.org/wikipedia/commons/a/ae/Xiaomi_logo_%282021-%29.svg' }
  ];

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <div className="bg-slate-900 text-white py-20 px-4 text-center">
        <h1 className="text-4xl md:text-6xl font-black mb-4">Official Partners</h1>
        <p className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto">
          View our extensive network of official brands and their latest products. Shop with confidence knowing you're getting authentic items from trusted manufacturers.
        </p>
      </div>

      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {brands.map((brand, idx) => (
            <Link 
              href={`/products?brand=${brand.name}`} 
              key={idx}
              className="group bg-white rounded-3xl border border-slate-200 p-8 flex flex-col items-center text-center hover:border-cyan-500 hover:shadow-2xl transition-all duration-300"
            >
              <div className="w-full h-20 mb-8 flex items-center justify-center grayscale group-hover:grayscale-0 transition-all duration-300">
                <img 
                  src={brand.logo} 
                  alt={brand.name} 
                  className="max-h-full max-w-full object-contain mix-blend-multiply" 
                />
              </div>
              <h3 className="text-xl font-black text-slate-900 mb-2 group-hover:text-cyan-600 transition-colors">{brand.name}</h3>
              <p className="text-xs text-slate-400 font-medium mb-6">{brand.desc}</p>
              <div className="mt-auto flex items-center gap-1.5 text-sm font-bold text-slate-400 group-hover:text-cyan-600 transition-colors">
                View all Products <ArrowRight size={16} className="transform group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}