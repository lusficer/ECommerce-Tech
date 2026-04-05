'use client';

import React from 'react';
import { ShieldCheck, Package, Eye } from 'lucide-react';

interface ApprovalTabProps {
  queue: any[];
  onReview: (product: any) => void;
}

export default function ApprovalTab({ queue, onReview }: ApprovalTabProps) {
  return (
    <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm min-h-[600px] animate-in fade-in">
      <h3 className="text-xl font-black text-slate-900 mb-2">Pending Approvals</h3>
      <p className="text-sm text-slate-500 mb-8">Review product submissions from vendors.</p>

      {queue.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl">
          <ShieldCheck className="w-16 h-16 mb-4 opacity-50 text-green-500" />
          <p className="font-bold text-lg text-slate-500">All caught up!</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-sm font-bold text-slate-400">
                <th className="pb-3">Product Info</th>
                <th className="pb-3">Price</th>
                <th className="pb-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="text-sm font-medium text-slate-700">
              {queue.map((item) => (
                <tr key={item.productId} className="border-b border-slate-50 hover:bg-slate-50">
                  <td className="py-4 flex items-center gap-3">
                    <div className="w-12 h-12 bg-slate-100 rounded-lg overflow-hidden shrink-0">
                      {item.imageUrl
                        ? <img src={item.imageUrl} alt="" className="w-full h-full object-cover" />
                        : <Package className="w-6 h-6 m-3 text-slate-400" />}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 line-clamp-1">{item.name}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">Vendor Request</p>
                    </div>
                  </td>
                  <td className="py-4 font-bold text-cyan-600">${item.price}</td>
                  <td className="py-4 text-right">
                    <button
                      onClick={() => onReview(item)}
                      className="px-5 py-2.5 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded-xl transition-colors font-bold text-xs flex items-center gap-1.5 shadow-sm ml-auto"
                    >
                      <Eye className="w-3.5 h-3.5" /> Review Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
