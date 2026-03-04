// src/components/home/NewsletterStrip.tsx
import React from 'react';

export default function NewsletterStrip() {
  return (
    <section className="w-full mt-6 bg-white border border-slate-200 rounded-full p-4 md:p-6 flex flex-col md:flex-row items-center justify-between shadow-sm">
      <div className="mb-4 md:mb-0 text-center md:text-left">
        <h3 className="text-lg font-black text-slate-900">Newsletter</h3>
        <p className="text-sm text-slate-500">40% offer on the way</p>
      </div>
      
      <div className="flex w-full md:w-auto max-w-md gap-2">
        <input 
          type="email" 
          placeholder="Enter your email address" 
          className="flex-1 bg-slate-50 border border-slate-200 rounded-full px-4 py-2 text-sm focus:outline-none focus:border-orange-500"
        />
        <button className="bg-slate-900 hover:bg-slate-800 text-white font-bold py-2 px-6 rounded-full text-sm transition-colors">
          SUBSCRIBE
        </button>
      </div>
    </section>
  );
}