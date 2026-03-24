// ===== src/components/seller/ProductForm.tsx =====
'use client';

import React from 'react';
import { Search, Loader2, CheckCircle2 } from 'lucide-react';

export interface ProductFormData {
  targetShopId: string;
  name: string;
  categoryId: string;
  price: number;
  discountPercentage: number;
  stockQuantity: number;
  imageUrl: string;
  description: string;
  brand: string;
  specifications: string;
}

interface ProductFormProps {
  isEditing: boolean;
  saving: boolean;
  formData: ProductFormData;
  shopSearchQuery: string;
  shopSearchResults: any[];
  isSearchingShop: boolean;
  showShopSearch: boolean; // true for VENDOR role
  onFormChange: (data: ProductFormData) => void;
  onShopSearch: (keyword: string) => void;
  onShopSelect: (shop: any) => void;
  onImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
  onBack: () => void;
}

export default function ProductForm({
  isEditing, saving, formData, shopSearchQuery, shopSearchResults,
  isSearchingShop, showShopSearch, onFormChange, onShopSearch,
  onShopSelect, onImageChange, onSubmit, onBack,
}: ProductFormProps) {
  const field = (key: keyof ProductFormData, value: string | number) =>
    onFormChange({ ...formData, [key]: value });

  return (
    <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm animate-in slide-in-from-right-8 duration-300">
      <button onClick={onBack} className="text-sm font-bold text-slate-500 hover:text-cyan-600 mb-6 flex items-center gap-1">
        ← Back to Products
      </button>
      <h3 className="text-xl font-black text-slate-900 mb-6">
        {isEditing ? 'Edit Product' : 'Create New Listing'}
      </h3>

      <form className="space-y-6" onSubmit={onSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Shop search — VENDOR only */}
          {showShopSearch && (
            <div className="md:col-span-2 bg-blue-50 p-5 rounded-2xl border border-blue-100 relative">
              <label className="block text-sm font-black text-blue-900 mb-2">
                Search Partner Shop <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Search className="absolute left-4 top-3.5 w-5 h-5 text-blue-400" />
                <input
                  type="text"
                  value={shopSearchQuery}
                  onChange={(e) => onShopSearch(e.target.value)}
                  placeholder="Type shop name..."
                  className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-blue-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none bg-white text-sm font-medium transition-all"
                />
                {isSearchingShop && <Loader2 className="absolute right-4 top-3.5 w-5 h-5 animate-spin text-blue-500" />}
              </div>
              {shopSearchResults.length > 0 && (
                <ul className="absolute z-20 left-5 right-5 mt-2 bg-white border border-blue-100 rounded-xl shadow-xl max-h-56 overflow-y-auto">
                  {shopSearchResults.map((shop) => (
                    <li
                      key={shop.shopId}
                      onClick={() => onShopSelect(shop)}
                      className="p-4 hover:bg-blue-50 cursor-pointer border-b border-slate-50 transition-colors"
                    >
                      <div className="font-bold text-sm text-slate-800">{shop.shopName}</div>
                      <div className="text-xs text-slate-400 mt-0.5">ID: {shop.shopId}</div>
                    </li>
                  ))}
                </ul>
              )}
              {formData.targetShopId && (
                <div className="mt-3 text-xs font-bold text-green-600 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" /> Selected: {formData.targetShopId}
                </div>
              )}
            </div>
          )}

          {/* Product name */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Product Name <span className="text-red-500">*</span></label>
            <input type="text" required value={formData.name} onChange={(e) => field('name', e.target.value)}
              className="w-full px-4 py-3.5 rounded-xl border border-slate-200 focus:border-cyan-500 outline-none bg-slate-50 focus:bg-white text-sm" />
          </div>

          {/* Price + Stock */}
          <div className="col-span-1 md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Regular Price ($) <span className="text-red-500">*</span></label>
              <input type="number" step="0.01" required value={formData.price} onChange={(e) => field('price', parseFloat(e.target.value))}
                className="w-full px-4 py-3.5 rounded-xl border border-slate-200 focus:border-cyan-500 outline-none bg-slate-50 focus:bg-white text-sm" />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Stock Quantity <span className="text-red-500">*</span></label>
              <input type="number" required value={formData.stockQuantity} onChange={(e) => field('stockQuantity', parseInt(e.target.value))}
                className="w-full px-4 py-3.5 rounded-xl border border-slate-200 focus:border-cyan-500 outline-none bg-slate-50 focus:bg-white text-sm" />
            </div>
          </div>

          {/* Category + Brand */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Category <span className="text-red-500">*</span></label>
            <select value={formData.categoryId} onChange={(e) => field('categoryId', e.target.value)}
              className="w-full px-4 py-3.5 rounded-xl border border-slate-200 focus:border-cyan-500 outline-none bg-slate-50 focus:bg-white text-sm">
              <option value="CAT_PHONE">Smartphones</option>
              <option value="CAT_LAPTOP">Laptops & PCs</option>
              <option value="CAT_TABLET">Tablets</option>
              <option value="CAT_ACCESSORY">Accessories</option>
              <option value="CAT_AUDIO">Audio</option>
              <option value="CAT_GAMING">Gaming Console</option>
              <option value="CAT_MONITOR">Monitors</option>
              <option value="CAT_ELEC">Electronics</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Brand <span className="text-red-500">*</span></label>
            <input type="text" required placeholder="e.g. Apple, Samsung..." value={formData.brand} onChange={(e) => field('brand', e.target.value)}
              className="w-full px-4 py-3.5 rounded-xl border border-slate-200 focus:border-cyan-500 outline-none bg-slate-50 focus:bg-white text-sm" />
          </div>
        </div>

        {/* Image */}
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">Product Image</label>
          <input type="file" onChange={onImageChange} accept="image/*"
            className="w-full text-sm file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-cyan-50 file:text-cyan-700 hover:file:bg-cyan-100 mb-3" />
          <input type="text" placeholder="Or paste an image URL here..." value={formData.imageUrl} onChange={(e) => field('imageUrl', e.target.value)}
            className="w-full px-4 py-3.5 rounded-xl border border-slate-200 focus:border-cyan-500 outline-none bg-slate-50 focus:bg-white text-sm text-slate-500" />
        </div>

        {/* Specifications */}
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">Specifications / Attributes</label>
          <textarea placeholder='e.g. {"Color": "Space Gray", "Storage": "256GB"}' value={formData.specifications} onChange={(e) => field('specifications', e.target.value)}
            className="w-full px-4 py-3.5 rounded-xl border border-slate-200 focus:border-cyan-500 outline-none bg-slate-50 focus:bg-white text-sm font-mono text-slate-700 min-h-[120px]" />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">Description</label>
          <textarea placeholder="Detail description of your product..." value={formData.description} onChange={(e) => field('description', e.target.value)}
            className="w-full px-4 py-3.5 rounded-xl border border-slate-200 focus:border-cyan-500 outline-none bg-slate-50 focus:bg-white text-sm text-slate-700 min-h-[160px]" />
        </div>

        <div className="pt-6 flex justify-end gap-4 border-t border-slate-100">
          <button type="submit" disabled={saving}
            className="px-8 py-3.5 bg-cyan-600 hover:bg-cyan-700 text-white font-bold rounded-xl shadow-md transition-colors flex items-center justify-center gap-2">
            {saving && <Loader2 className="w-5 h-5 animate-spin" />}
            {saving ? 'SAVING...' : isEditing ? 'UPDATE PRODUCT' : 'SUBMIT PRODUCT'}
          </button>
        </div>
      </form>
    </div>
  );
}
