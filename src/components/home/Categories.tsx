'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Laptop, Smartphone, Tablet, Headphones, Watch, 
  Monitor, Gamepad, Mouse, ArrowRight, Package, Loader2 
} from 'lucide-react';

import { apiGet } from '@/lib/api';

// The API doesn't ship icons, so we map known category IDs to UI icons.
const ICON_MAP: Record<string, React.ElementType> = {
  'CAT_LAPTOP': Laptop,
  'CAT_PHONE': Smartphone,
  'CAT_TABLET': Tablet,
  'CAT_AUDIO': Headphones,
  'CAT_ACCESSORY': Watch,
  'CAT_MONITOR': Monitor,
  'CAT_GAMING': Gamepad,
  'CAT_ELEC': Mouse,
};

interface CategoryDto {
  categoryId: string;
  name: string;
}

export default function Categories() {
  const router = useRouter();
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Categories come from the product service.
    const fetchCategories = async () => {
      try {
        const data = await apiGet<CategoryDto[]>('product', '/api/categories', { withUserId: false });
        setCategories((data ?? []).slice(0, 8));
      } catch (error) {
        console.error('Failed to load categories:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  const handleCategoryClick = (categoryId: string) => {
    router.push(`/products?category=${categoryId}`);
  };

  return (
    <section className="w-full mt-16 font-sans">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Tech Categories</h2>
        <button 
          onClick={() => router.push('/products')}
          className="text-sm font-bold text-cyan-600 hover:text-cyan-700 flex items-center gap-1 transition-colors uppercase tracking-wide"
        >
          View All <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-32">
          <Loader2 className="w-8 h-8 animate-spin text-cyan-600" />
        </div>
      ) : (
        <div className="grid grid-cols-4 md:grid-cols-8 gap-4 mb-12">
          {categories.map((category) => {
            const IconComponent = ICON_MAP[category.categoryId] || Package; // Fallback icon
            
            return (
              <div 
                key={category.categoryId} 
                onClick={() => handleCategoryClick(category.categoryId)}
                className="flex flex-col items-center gap-3 group cursor-pointer"
              >
                <div className="w-20 h-20 rounded-full bg-white border border-slate-200 shadow-sm flex items-center justify-center group-hover:border-cyan-500 group-hover:shadow-md transition-all duration-300 group-hover:-translate-y-1">
                  <IconComponent className="w-8 h-8 text-slate-600 group-hover:text-cyan-600 transition-colors" strokeWidth={1.5} />
                </div>
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wide group-hover:text-cyan-600 transition-colors text-center">
                  {category.name}
                </span>
              </div>
            );
          })}
        </div>
      )}

      <div className="w-full bg-slate-100 rounded-2xl py-6 flex items-center justify-center border border-slate-200 shadow-inner">
         <p className="text-sm font-bold text-slate-600">
           Trusted by <span className="text-cyan-600">12,000+</span> active users globally.
         </p>
      </div>
    </section>
  );
}