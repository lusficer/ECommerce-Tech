// ===== src/hooks/useWishlist.ts =====
// Reusable hook for wishlist state management

'use client';

import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { getAuth } from '@/lib/auth';

export interface UseWishlistReturn {
  wishlistedIds: Set<string>;
  toggleWishlist: (e: React.MouseEvent, productId: string) => Promise<void>;
  isWishlisted: (productId: string) => boolean;
}

/**
 * Loads the user's wishlist on mount, exposes a toggleWishlist function,
 * and keeps local state in sync with the server.
 * Also listens for / dispatches the 'wishlistUpdated' custom event so that
 * the Header counter stays in sync.
 */
export function useWishlist(): UseWishlistReturn {
  const [wishlistedIds, setWishlistedIds] = useState<Set<string>>(new Set());

  const fetchWishlist = useCallback(async () => {
    const { token, userId } = getAuth();
    if (!token || !userId) return;
    try {
      const res = await fetch(`http://localhost:8081/api/wishlists/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setWishlistedIds(new Set(data.map((item: any) => item.productId as string)));
      }
    } catch {
      // silently ignore
    }
  }, []);

  useEffect(() => {
    fetchWishlist();
    // Re-fetch whenever another component dispatches the event
    window.addEventListener('wishlistUpdated', fetchWishlist);
    return () => window.removeEventListener('wishlistUpdated', fetchWishlist);
  }, [fetchWishlist]);

  const toggleWishlist = useCallback(
    async (e: React.MouseEvent, productId: string) => {
      e.preventDefault();
      e.stopPropagation();

      const { token, userId } = getAuth();
      if (!token || !userId) {
        toast.error('Please log in to save products!');
        return;
      }

      try {
        const res = await fetch(
          `http://localhost:8081/api/wishlists/${userId}/${productId}`,
          { method: 'POST', headers: { Authorization: `Bearer ${token}` } }
        );

        if (res.ok) {
          const isNowWishlisted = !wishlistedIds.has(productId);
          toast.success(isNowWishlisted ? 'Added to Wishlist!' : 'Removed from Wishlist!');
          setWishlistedIds((prev) => {
            const next = new Set(prev);
            if (isNowWishlisted) next.add(productId);
            else next.delete(productId);
            return next;
          });
          // Notify Header and other listeners
          window.dispatchEvent(new Event('wishlistUpdated'));
        }
      } catch {
        toast.error('Connection error.');
      }
    },
    [wishlistedIds]
  );

  const isWishlisted = useCallback(
    (productId: string) => wishlistedIds.has(productId),
    [wishlistedIds]
  );

  return { wishlistedIds, toggleWishlist, isWishlisted };
}
