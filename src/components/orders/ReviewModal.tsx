// ===== src/components/orders/ReviewModal.tsx =====
'use client';

import React, { useState } from 'react';
import { X, Star, Loader2, Image as ImageIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import { getAuth } from '@/lib/auth';

interface ReviewTarget {
  orderId: string;
  productId: string;
  productName: string;
  productImage: string;
}

interface ReviewModalProps {
  target: ReviewTarget;
  onClose: () => void;
}

const RATING_LABELS: Record<number, string> = {
  5: 'Excellent!', 4: 'Very Good', 3: 'Good', 2: 'Poor', 1: 'Terrible',
};

export default function ReviewModal({ target, onClose }: ReviewModalProps) {
  const [rating, setRating]             = useState(5);
  const [hoverRating, setHoverRating]   = useState(0);
  const [comment, setComment]           = useState('');
  const [images, setImages]             = useState<string[]>([]);
  const [submitting, setSubmitting]     = useState(false);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);
    if (images.length + files.length > 5) {
      toast.error('You can only upload up to 5 images.'); return;
    }
    setImages((prev) => [...prev, ...files.map((f) => URL.createObjectURL(f))]);
  };

  const removeImage = (idx: number) =>
    setImages((prev) => prev.filter((_, i) => i !== idx));

  const handleSubmit = async () => {
    if (!rating) { toast.error('Please select a star rating'); return; }
    setSubmitting(true);
    const { token, userId } = getAuth();
    const userName = localStorage.getItem('fullName') || localStorage.getItem('username') || 'Valued Customer';

    try {
      const res = await fetch(`http://localhost:8083/api/products/${target.productId}/reviews`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          userId: userId || '',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ orderId: target.orderId, userName, rating, comment, images }),
      });

      if (res.ok) {
        toast.success('Thank you! Your review has been submitted.');
        onClose();
      } else {
        const err = await res.json();
        toast.error(err.message || 'Failed to submit review');
      }
    } catch {
      toast.error('Connection error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <h3 className="text-lg font-black text-slate-900">Rate Product</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 hover:bg-slate-200 p-1 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {/* Product preview */}
          <div className="flex items-center gap-4 mb-6 bg-slate-50 p-3 rounded-2xl border border-slate-100">
            <div className="w-16 h-16 bg-white rounded-xl border border-slate-200 p-1 flex shrink-0">
              <img src={target.productImage} alt="Product" className="w-full h-full object-contain" />
            </div>
            <p className="text-sm font-bold text-slate-900 line-clamp-2 flex-1 min-w-0">
              {target.productName}
            </p>
          </div>

          {/* Stars */}
          <div className="flex flex-col items-center mb-6">
            <p className="text-sm font-bold text-slate-600 mb-2">Product Quality</p>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setRating(star)}
                  className="focus:outline-none transition-transform hover:scale-110"
                >
                  <Star className={`w-10 h-10 transition-colors ${(hoverRating || rating) >= star ? 'fill-yellow-400 text-yellow-400' : 'fill-slate-100 text-slate-200'}`} />
                </button>
              ))}
            </div>
            <p className="text-xs font-bold text-orange-500 mt-2">{RATING_LABELS[rating] || ''}</p>
          </div>

          {/* Comment */}
          <div className="mb-4">
            <textarea
              rows={4}
              placeholder="Share more thoughts on the product to help other buyers..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:border-cyan-500 focus:bg-white transition-colors resize-none placeholder-slate-400"
            />
          </div>

          {/* Image upload */}
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              {images.map((url, i) => (
                <div key={i} className="relative w-16 h-16 rounded-xl border border-slate-200 overflow-hidden group">
                  <img src={url} alt="preview" className="w-full h-full object-cover" />
                  <button
                    onClick={() => removeImage(i)}
                    className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              {images.length < 5 && (
                <label className="w-16 h-16 rounded-xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 hover:border-cyan-500 hover:text-cyan-500 cursor-pointer transition-colors bg-slate-50 hover:bg-cyan-50/50">
                  <ImageIcon className="w-5 h-5 mb-0.5" />
                  <span className="text-[10px] font-bold">Add Photo</span>
                  <input type="file" accept="image/png,image/jpeg,image/jpg" multiple className="hidden" onChange={handleImageUpload} />
                </label>
              )}
            </div>
            <p className="text-[10px] text-slate-400 mt-2 font-medium">Upload up to 5 images (JPG, PNG).</p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 flex gap-3 bg-slate-50/50">
          <button
            onClick={onClose}
            disabled={submitting}
            className="flex-1 py-3 bg-white border border-slate-300 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex-1 py-3 bg-orange-500 text-white font-bold rounded-xl hover:bg-orange-600 transition-colors flex items-center justify-center disabled:opacity-70"
          >
            {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Submit'}
          </button>
        </div>
      </div>
    </div>
  );
}
