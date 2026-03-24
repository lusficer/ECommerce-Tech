// ===== src/components/seller/ProductsTab.tsx =====
'use client';

import React from 'react';
import { Plus, Package, Percent, Edit, Trash2 } from 'lucide-react';
import StatusBadge from '@/components/ui/StatusBadge';

type Role = 'VENDOR' | 'MANAGER' | 'SHIPPER';

interface ProductsTabProps {
  role: Role;
  products: any[];
  onAddProduct: () => void;
  onEditProduct: (product: any) => void;
  onDeleteProduct: (productId: string) => void;
  onSetDiscount: (product: any) => void;
}

export default function ProductsTab({
  role, products, onAddProduct, onEditProduct, onDeleteProduct, onSetDiscount,
}: ProductsTabProps) {
  return (
    <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm min-h-[600px] animate-in fade-in">
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-xl font-black text-slate-900">
          {role === 'MANAGER' ? 'Shop Inventory' : 'My Product Listings'}
        </h3>
        {role === 'VENDOR' && (
          <button
            onClick={onAddProduct}
            className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white font-bold rounded-xl transition-all shadow-md flex items-center gap-2 text-sm"
          >
            <Plus className="w-4 h-4" /> ADD PRODUCT
          </button>
        )}
      </div>

      <div className="overflow-x-auto pb-4">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead>
            <tr className="border-b border-slate-100 text-sm font-bold text-slate-400">
              <th className="pb-3 px-4 w-1/3">Product</th>
              <th className="pb-3 px-4 whitespace-nowrap">Price</th>
              <th className="pb-3 px-4 whitespace-nowrap">Stock</th>
              <th className="pb-3 px-4 whitespace-nowrap">Discount</th>
              <th className="pb-3 px-4 whitespace-nowrap">Status</th>
              <th className="pb-3 px-2 text-right whitespace-nowrap">Actions</th>
            </tr>
          </thead>
          <tbody className="text-sm font-medium text-slate-700">
            {products.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center py-10 text-slate-400">No products found.</td>
              </tr>
            )}
            {products.map((p) => (
              <tr key={p.productId} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                {/* Product name + image */}
                <td className="py-4 px-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-100 rounded-lg overflow-hidden shrink-0 border border-slate-200">
                      {p.imageUrl
                        ? <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                        : <Package className="w-5 h-5 m-2.5 text-slate-400" />}
                    </div>
                    <span className="font-bold line-clamp-2 text-slate-800">{p.name}</span>
                  </div>
                </td>

                <td className="py-4 px-4 font-black text-cyan-600">${p.price}</td>

                <td className="py-4 px-4 font-bold text-slate-700 whitespace-nowrap">
                  {p.stockQuantity || 0} <span className="text-xs font-medium text-slate-400 ml-0.5">units</span>
                </td>

                <td className="py-4 px-4 whitespace-nowrap">
                  {p.discountPercentage > 0 ? (
                    <span className="text-green-700 bg-green-100 border border-green-200 px-2 py-1 rounded-md text-xs">
                      {p.discountPercentage}%
                    </span>
                  ) : (
                    <span className="text-slate-400">0%</span>
                  )}
                </td>

                <td className="py-4 px-4 whitespace-nowrap">
                  <StatusBadge status={p.approvalStatus || 'PENDING'} type="approval" />
                </td>

                <td className="py-4 px-2 text-right">
                  <div className="flex justify-end gap-1.5 items-center">
                    {role === 'MANAGER' && p.approvalStatus === 'APPROVED' && (
                      <button
                        onClick={() => onSetDiscount(p)}
                        className="p-2 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="Set Discount"
                      >
                        <Percent className="w-4 h-4" />
                      </button>
                    )}
                    {role === 'VENDOR' && (
                      <button
                        onClick={() => onEditProduct(p)}
                        className="p-2 text-slate-400 hover:text-cyan-600 hover:bg-cyan-50 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => onDeleteProduct(p.productId)}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
