// Reusable hook for wishlist state management

'use client';

import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { getAuth } from '@/lib/auth';
import { apiGet, apiPost, getUserFacingErrorMessage } from '@/lib/api';

export interface UseWishlistReturn {
  wishlistedIds: Set<string>;
  toggleWishlist: (e: React.MouseEvent, productId: string) => Promise<void>;
  isWishlisted: (productId: string) => boolean;
}

// Uses a custom event so the header badge stays in sync across pages.
export function useWishlist(): UseWishlistReturn {
  const [wishlistedIds, setWishlistedIds] = useState<Set<string>>(new Set());

  const fetchWishlist = useCallback(async () => {
    const { token, userId } = getAuth();
    if (!token || !userId) {
      setWishlistedIds(new Set());
      return;
    }
    try {
      const data = await apiGet<any[]>(
        'user',
        `/api/wishlists/${userId}`,
        { withUserId: false }
      );
      setWishlistedIds(new Set((data || []).map((item: any) => item.productId as string)));
    } catch {
        // Wishlist is optional; ignore transient network errors.
    }
  }, []);

  useEffect(() => {
    fetchWishlist();
    // Keep local state in sync when other pages update the wishlist.
    window.addEventListener('wishlistUpdated', fetchWishlist);
    window.addEventListener('authUpdated', fetchWishlist);
    window.addEventListener('storage', fetchWishlist);
    return () => {
      window.removeEventListener('wishlistUpdated', fetchWishlist);
      window.removeEventListener('authUpdated', fetchWishlist);
      window.removeEventListener('storage', fetchWishlist);
    };
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
        await apiPost(
          'user',
          `/api/wishlists/${userId}/${productId}`,
          undefined,
          { withUserId: false }
        );

        const isNowWishlisted = !wishlistedIds.has(productId);
        toast.success(isNowWishlisted ? 'Added to Wishlist!' : 'Removed from Wishlist!');
        setWishlistedIds((prev) => {
          const next = new Set(prev);
          if (isNowWishlisted) next.add(productId);
          else next.delete(productId);
          return next;
        });
        // Keep header badge and other listeners in sync.
        window.dispatchEvent(new Event('wishlistUpdated'));
      } catch (err) {
        toast.error(
          getUserFacingErrorMessage(err, {
            defaultMessage: 'Failed to update wishlist.',
          })
        );
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

