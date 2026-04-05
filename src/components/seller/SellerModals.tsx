// Seller dashboard modals grouped in one file to keep imports simple.
// Export: ProductReviewModal, DiscountModal, RejectModal, DeleteConfirmModal

'use client';

import React from 'react';
import { X, Info, Loader2, Percent, AlertTriangle, Trash2, CheckCircle2 } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import { formatCurrency, getFirstImage } from '@/lib/format';

// Product review modal.
interface ProductReviewModalProps {
  product: any;
  saving: boolean;
  onClose: () => void;
  onApprove: (product: any) => void;
  onReject: (productId: string, productName: string) => void;
}

export function ProductReviewModal({ product, saving, onClose, onApprove, onReject }: ProductReviewModalProps) {
  if (!product) return null;
  const img = getFirstImage(product.imageUrl || product.mainImage, 'https://placehold.co/400x400?text=No+Image');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-5xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center p-6 md:p-8 border-b border-slate-100 bg-white shrink-0">
          <div>
            <h3 className="font-black text-slate-900 flex items-center gap-3 text-2xl">
              <Info className="w-7 h-7 text-blue-600 p-1.5 bg-blue-100 rounded-xl" /> Product Review
            </h3>
            <p className="text-sm text-slate-500 mt-1">Review submission details before making a decision</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 hover:bg-slate-100 p-2 rounded-full transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 md:p-8 overflow-y-auto flex flex-col md:flex-row gap-8">
          <div className="w-full md:w-64 shrink-0">
            <div className="aspect-square bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-center p-6 overflow-hidden">
              <img src={img} alt={product.name} className="w-full h-full object-contain" />
            </div>
            <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Price</span>
                <span className="font-black text-cyan-600">{formatCurrency(product.price)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Stock</span>
                <span className="font-bold text-slate-800">{product.stockQuantity ?? product.stock ?? 0} units</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Category</span>
                <span className="font-bold text-slate-800">{product.categoryId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Brand</span>
                <span className="font-bold text-slate-800">{product.brand || 'N/A'}</span>
              </div>
            </div>
          </div>

          <div className="flex-1 min-w-0 space-y-6">
            <div>
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Product Name</h4>
              <p className="text-2xl font-black text-slate-900">{product.name}</p>
            </div>
            {product.description && (
              <div>
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Description</h4>
                <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{product.description}</p>
              </div>
            )}
            {product.specifications && (
              <div>
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Specifications</h4>
                <pre className="text-xs bg-slate-50 border border-slate-200 rounded-xl p-4 overflow-x-auto text-slate-700 font-mono whitespace-pre-wrap">
                  {product.specifications}
                </pre>
              </div>
            )}
          </div>
        </div>

        <div className="p-5 md:p-6 bg-white border-t border-slate-100 flex justify-end gap-4 shrink-0">
          <button
            disabled={saving}
            onClick={() => { onReject(product.productId, product.name); onClose(); }}
            className="px-6 py-3.5 bg-white border-2 border-red-100 text-red-600 hover:bg-red-50 hover:border-red-200 font-black rounded-xl transition-all"
          >
            REJECT REQUEST
          </button>
          <button
            disabled={saving}
            onClick={() => onApprove(product)}
            className="px-8 py-3.5 bg-green-500 hover:bg-green-600 text-white font-black rounded-xl shadow-lg hover:shadow-green-500/30 transition-all flex items-center gap-2"
          >
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
            APPROVE PRODUCT
          </button>
        </div>
      </div>
    </div>
  );
}

// Discount modal.
interface DiscountModalProps {
  isOpen: boolean;
  productName: string;
  discount: number;
  saving: boolean;
  onClose: () => void;
  onDiscountChange: (val: number) => void;
  onSave: () => void;
}

export function DiscountModal({ isOpen, productName, discount, saving, onClose, onDiscountChange, onSave }: DiscountModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Set Product Discount"
      titleIcon={<Percent className="w-5 h-5 text-cyan-600" />}
      maxWidth="max-w-sm"
      footer={
        <>
          <button onClick={onClose} className="flex-1 py-3 bg-white border border-slate-200 font-bold rounded-xl text-slate-700">Cancel</button>
          <button onClick={onSave} disabled={saving} className="flex-1 py-3 bg-cyan-600 text-white font-bold rounded-xl flex items-center justify-center gap-2">
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Save Discount'}
          </button>
        </>
      }
    >
      <div className="space-y-6">
        <div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Product</p>
          <p className="font-bold text-slate-800 line-clamp-2">{productName}</p>
        </div>
        <div>
          <label className="flex justify-between items-center text-sm font-bold text-slate-700 mb-3">
            Discount Percentage
            <span className="text-2xl font-black text-cyan-600">{discount}%</span>
          </label>
          <input type="range" min="0" max="99" value={discount} onChange={(e) => onDiscountChange(parseInt(e.target.value))}
            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-cyan-600 mb-4" />
          <div className="relative">
            <input type="number" min="0" max="99" value={discount} onChange={(e) => onDiscountChange(parseInt(e.target.value))}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-cyan-500 outline-none bg-slate-50 text-lg font-bold text-center" />
            <Percent className="absolute right-4 top-3.5 w-5 h-5 text-slate-400" />
          </div>
        </div>
      </div>
    </Modal>
  );
}

// Reject modal.
interface RejectModalProps {
  isOpen: boolean;
  productName: string;
  reason: string;
  saving: boolean;
  onClose: () => void;
  onReasonChange: (val: string) => void;
  onConfirm: () => void;
}

export function RejectModal({ isOpen, productName, reason, saving, onClose, onReasonChange, onConfirm }: RejectModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Reject Product"
      headerClassName="bg-red-50"
      maxWidth="max-w-sm"
      footer={
        <>
          <button onClick={onClose} className="flex-1 py-3 bg-white border border-slate-200 font-bold rounded-xl text-slate-700">Cancel</button>
          <button onClick={onConfirm} disabled={saving} className="flex-1 py-3 bg-red-600 text-white font-bold rounded-xl flex items-center justify-center gap-2">
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Confirm Reject'}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Product</p>
          <p className="font-bold text-slate-800 line-clamp-2">{productName}</p>
        </div>
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">Reason for Rejection <span className="text-red-500">*</span></label>
          <textarea rows={3} placeholder="Tell the vendor what needs to be fixed..." value={reason} onChange={(e) => onReasonChange(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-red-500 outline-none bg-slate-50 text-sm" />
        </div>
      </div>
    </Modal>
  );
}

// Delete confirm modal.
interface DeleteConfirmModalProps {
  isOpen: boolean;
  saving: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function DeleteConfirmModal({ isOpen, saving, onClose, onConfirm }: DeleteConfirmModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Confirm Delete"
      titleIcon={<AlertTriangle className="w-5 h-5 text-red-500" />}
      headerClassName="bg-red-50"
      maxWidth="max-w-sm"
      footer={
        <>
          <button onClick={onClose} className="flex-1 px-4 py-3 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold rounded-xl transition-colors">Cancel</button>
          <button onClick={onConfirm} disabled={saving} className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-md transition-colors flex items-center justify-center gap-2">
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Yes, Delete'}
          </button>
        </>
      }
    >
      <div className="text-center">
        <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <Trash2 className="w-8 h-8" />
        </div>
        <p className="text-slate-800 font-bold mb-1">Are you absolutely sure?</p>
        <p className="text-sm text-slate-500">This product will be permanently removed. This action cannot be undone.</p>
      </div>
    </Modal>
  );
}
