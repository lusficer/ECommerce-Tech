import React from 'react';

export default function ShopProfileSkeleton() {
  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-20 animate-pulse">
      <div className="w-full bg-white border-b border-slate-200">
        <div className="max-w-[1200px] mx-auto">
          <div className="h-48 md:h-72 w-full bg-slate-200 rounded-b-3xl"></div>

          <div className="px-4 sm:px-8 relative -mt-16 sm:-mt-24 pb-8">
            <div className="bg-white rounded-3xl p-6 shadow-xl border border-slate-100 flex flex-col md:flex-row items-center md:items-start gap-6">
              <div className="w-24 h-24 sm:w-32 sm:h-32 bg-slate-200 rounded-full shrink-0 -mt-12 sm:-mt-16 border-4 border-white shadow-sm"></div>

              <div className="flex-1 w-full text-center md:text-left flex flex-col items-center md:items-start">
                <div className="h-8 bg-slate-200 rounded-lg w-3/4 md:w-1/2 mb-3"></div>
                <div className="h-4 bg-slate-200 rounded w-full md:w-2/3 mb-6"></div>
                <div className="flex items-center gap-3">
                  <div className="w-28 h-10 bg-slate-200 rounded-xl"></div>
                  <div className="w-24 h-10 bg-slate-200 rounded-xl"></div>
                </div>
              </div>

              <div className="w-full md:w-auto grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 pt-6 md:pt-0 border-t md:border-t-0 border-slate-100 md:border-l pl-0 md:pl-8">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex flex-col items-center md:items-start">
                    <div className="h-3 w-16 bg-slate-200 rounded mb-2"></div>
                    <div className="h-6 w-12 bg-slate-200 rounded"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-200 bg-white">
          <div className="max-w-[1200px] mx-auto px-4 sm:px-8 py-5">
            <div className="flex gap-8 overflow-hidden">
              <div className="w-24 h-5 bg-slate-200 rounded-full"></div>
              <div className="w-32 h-5 bg-slate-200 rounded-full"></div>
              <div className="w-20 h-5 bg-slate-200 rounded-full"></div>
              <div className="w-28 h-5 bg-slate-200 rounded-full hidden sm:block"></div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-4 sm:px-8 pt-8">
        <div className="h-6 w-48 bg-slate-200 rounded mb-6"></div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-white border border-slate-100 rounded-2xl p-4 flex flex-col h-full shadow-sm">
              <div className="w-full aspect-square bg-slate-200 rounded-xl mb-4"></div>
              <div className="h-4 bg-slate-200 rounded w-full mb-2"></div>
              <div className="h-4 bg-slate-200 rounded w-3/4 mb-4"></div>
              <div className="h-6 bg-slate-200 rounded w-1/3 mb-4"></div>
              <div className="mt-auto w-full h-9 bg-slate-200 rounded-xl"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}