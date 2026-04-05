// Reusable hook for adding products to cart

'use client';

import { useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { getAuth } from '@/lib/auth';
import { apiPost, getUserFacingErrorMessage } from '@/lib/api';

export interface UseAddToCartReturn {
  addingIds: Set<string>;
  addToCart: (
    e: React.MouseEvent,
    productId: string,
    quantity?: number,
    trackBehavior?: boolean
  ) => Promise<void>;
}

// Dispatches a custom event so the header badge stays in sync.
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
        await apiPost('cart', '/api/cart/add', { productId, quantity });
        toast.success('Added to cart!');
        window.dispatchEvent(new Event('cartUpdated'));

        if (trackBehavior) {
          // Fire-and-forget – don't block UI on this
          apiPost(
            'recommendation',
            '/api/recommendations/track',
            { productId, actionType: 'ADD_TO_CART' },
            { withUserId: false }
          ).catch(() => {});
        }
      } catch (err) {
        toast.error(
          getUserFacingErrorMessage(err, {
            defaultMessage: 'Failed to add to cart.',
          })
        );
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

