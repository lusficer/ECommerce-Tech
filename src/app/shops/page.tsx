'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Store, MapPin, ArrowRight, Loader2, Search, Filter } from 'lucide-react';

import { apiGet } from '@/lib/api';

export default function AllShopsPage() {
  const [shops, setShops] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
      const fetchShops = async () => {
        setLoading(true);
        try {
          const data = await apiGet<any[]>('shop', '/api/shops', { withAuth: false, withUserId: false });
          setShops(data ?? []);
        } catch (error) {
          console.error("Error fetching shops:", error);
        } finally {
          setLoading(false);
        }
      };
      fetchShops();
    }, []);

  const filteredShops = shops.filter(shop => 
    shop.shopName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
      <Loader2 className="animate-spin text-cyan-600 mb-4" size={48} />
      <p className="text-slate-500 font-bold animate-pulse">Loading Official Stores...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      
      <div className="bg-slate-900 text-white py-16 px-4">
        <div className="max-w-[1440px] mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-black mb-4 tracking-tight">EXPLORE OUR PARTNER SHOPS</h1>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            Connect directly with genuine distributors and reputable dealers nationwide.
          </p>
        </div>
      </div>

      <div className="max-w-[1440px] mx-auto px-4 -mt-8">
        <div className="bg-white rounded-3xl shadow-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 border border-slate-100">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input 
              type="text" 
              placeholder="Search store name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-cyan-500 transition-all"
            />
          </div>
          <div className="flex items-center gap-6 px-4">
            <div className="text-center">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Stores</p>
              <p className="text-xl font-black text-slate-900">{shops.length}</p>
            </div>
            <div className="h-8 w-px bg-slate-200"></div>
            <div className="text-center">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Status</p>
              <p className="text-xl font-black text-emerald-500">100%</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1440px] mx-auto px-4 py-16">
        {filteredShops.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-300">
            <Store className="mx-auto text-slate-200 mb-4" size={64} />
            <p className="text-slate-500 font-bold">No stores found matching your search.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredShops.map((shop) => (
              <div 
                key={shop.shopId} 
                className="bg-white rounded-[2.5rem] border border-slate-200 p-8 hover:shadow-2xl hover:border-cyan-500 transition-all group flex flex-col h-full"
              >
                
                <div className="flex items-start justify-between mb-6">
                  <div className="w-20 h-20 bg-slate-100 rounded-3xl flex items-center justify-center overflow-hidden border-4 border-slate-50">
                    {shop.logoUrl ? (
                      <img src={shop.logoUrl} alt={shop.shopName} className="object-cover w-full h-full" />
                    ) : (
                      <Store className="text-slate-300" size={32} />
                    )}
                  </div>
                  <div className="bg-cyan-50 text-cyan-600 text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest">
                    {shop.status || 'Verified'}
                  </div>
                </div>

                <div className="mb-6 flex-1">
                  <h3 className="text-2xl font-black text-slate-900 mb-3 group-hover:text-cyan-600 transition-colors">
                    {shop.shopName}
                  </h3>
                  <p className="text-slate-500 text-sm leading-relaxed line-clamp-3 mb-4 italic">
                    "{shop.description || 'No description available for this official partner store.'}"
                  </p>
                  <div className="flex items-center gap-2 text-slate-400 text-sm font-medium">
                    <MapPin size={16} className="text-cyan-500" />
                    <span className="truncate">{shop.address}</span>
                  </div>
                </div>

                <Link 
                  href={`/seller/${shop.shopId}`}
                  className="mt-4 w-full bg-slate-900 text-white py-4 rounded-2xl font-black flex items-center justify-center gap-2 group-hover:bg-cyan-600 transition-all shadow-lg shadow-slate-200 group-hover:shadow-cyan-200"
                >
                  VISIT STORE <ArrowRight size={20} />
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}