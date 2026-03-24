// ===== src/hooks/useAddToCart.ts =====
// Reusable hook for adding products to cart

'use client';

import { useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { getAuth } from '@/lib/auth';

export interface UseAddToCartReturn {
  addingIds: Set<string>;
  addToCart: (
    e: React.MouseEvent,
    productId: string,
    quantity?: number,
    trackBehavior?: boolean
  ) => Promise<void>;
}

/**
 * Provides an addToCart function that:
 * 1. POSTs to the cart service
 * 2. Dispatches 'cartUpdated' so Header counter updates
 * 3. Optionally fires a behavior-tracking event to the recommendation service
 * 4. Tracks per-product loading state via the addingIds Set
 */
export function useAddToCart(): UseAddToCartReturn {
  const [addingIds, setAddingIds] = useState<Set<string>>(new Set());

  const addToCart = useCallback(
    async (
      e: React.MouseEvent,
      productId: string,
      quantity = 1,
      trackBehavior = false
    ) => {
      e.preventDefault();
      e.stopPropagation();

      const { token, userId } = getAuth();
      if (!token || !userId) {
        toast.error('Please log in to add to cart!');
        return;
      }

      setAddingIds((prev) => new Set(prev).add(productId));

      try {
        const res = await fetch('http://localhost:8088/api/cart/add', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            userId,
          },
          body: JSON.stringify({ productId, quantity }),
        });

        if (!res.ok) {
          const text = await res.text().catch(() => '');
          toast.error(text || 'Error adding to cart!');
          return;
        }

        toast.success('Added to cart!');
        window.dispatchEvent(new Event('cartUpdated'));

        if (trackBehavior) {
          // Fire-and-forget – don't block UI on this
          fetch('http://localhost:8090/api/recommendations/track', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ productId, actionType: 'ADD_TO_CART' }),
          }).catch(() => {});
        }
      } catch {
        toast.error('Cannot connect to cart server.');
      } finally {
        setAddingIds((prev) => {
          const next = new Set(prev);
          next.delete(productId);
          return next;
        });
      }
    },
    []
  );

  return { addingIds, addToCart };
}
