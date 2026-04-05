'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ShoppingCart, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

import { CartItemResponse, CartResponse } from '@/types';
import { getAuth, logout } from '@/lib/auth';
import { apiFetch, apiGet, apiPut, getUserFacingErrorMessage, isApiError } from '@/lib/api';
import LoadingScreen from '@/components/ui/LoadingScreen';
import EmptyState from '@/components/ui/EmptyState';
import CartShopGroup from '@/components/cart/CartShopGroup';
import OrderSummary from '@/components/cart/OrderSummary';

export default function CartPage() {
  const router = useRouter();
  const [cart, setCart] = useState<CartResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
  const [shopNames, setShopNames] = useState<Record<string, string>>({});

  // Fetch cart data and shop names so items can be grouped by shop.
  const fetchCart = async () => {
    const { token, userId } = getAuth();
    if (!token || !userId) { setLoading(false); return; }

    try {
      const cartData = await apiGet<CartResponse>('cart', '/api/cart');
      setCart(cartData);

      // Fetch shop names in parallel
      const uniqueShopIds = Array.from(new Set(cartData.items.map((i) => i.shopId)));
      const namesMap: Record<string, string> = {};
      await Promise.all(
        uniqueShopIds.map(async (shopId) => {
          try {
            const shop = await apiGet<any>('shop', `/api/shops/${shopId}`, { withUserId: false });
            namesMap[shopId] = shop?.shopName ?? shopId;
          } catch {
            namesMap[shopId] = shopId;
          }
        })
      );
      setShopNames(namesMap);
    } catch (err) {
      if (isApiError(err) && (err.status === 401 || err.status === 403)) {
        logout();
        toast.error('Your session has expired. Please sign in again.');
        setCart(null);
        return;
      }

      toast.error(
        getUserFacingErrorMessage(err, {
          defaultMessage: 'Unable to load your cart right now.',
        })
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCart(); }, []);

  // Mutations: quantity updates and bulk delete.
  const updateQuantity = async (itemId: number, newQty: number) => {
    const { token, userId } = getAuth();
    if (!token || !userId) return;
    setUpdatingId(itemId);
    try {
      const updated = await apiPut<CartResponse>('cart', `/api/cart/items/${itemId}`, { quantity: newQty });
      setCart(updated);
      window.dispatchEvent(new Event('cartUpdated'));
      if (newQty <= 0) {
        toast.success('Item removed from cart!');
        setSelectedItems((prev) => {
          const s = new Set(prev);
          s.delete(itemId);
          return s;
        });
      }
    } catch (err) {
      toast.error(
        getUserFacingErrorMessage(err, {
          defaultMessage: 'Failed to update cart item.',
        })
      );
    } finally {
      setUpdatingId(null);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedItems.size === 0) return;
    const { token, userId } = getAuth();
    if (!token || !userId) return;
    const ids = Array.from(selectedItems);
    try {
      const updated = await apiFetch<CartResponse>('cart', '/api/cart/items', {
        method: 'DELETE',
        body: JSON.stringify(ids),
      });
      setCart(updated);
      setSelectedItems(new Set());
      window.dispatchEvent(new Event('cartUpdated'));
      toast.success(`Successfully removed ${ids.length} items from cart.`);
    } catch (err) {
      toast.error(
        getUserFacingErrorMessage(err, {
          defaultMessage: 'Failed to remove selected items from cart.',
        })
      );
    }
  };

  // Selection helpers for bulk actions.
  const handleSelectItem = (itemId: number) =>
    setSelectedItems((prev) => {
      const s = new Set(prev);
      s.has(itemId) ? s.delete(itemId) : s.add(itemId);
      return s;
    });

  const handleSelectAll = () => {
    if (!cart) return;
    setSelectedItems(
      selectedItems.size === cart.items.length
        ? new Set()
        : new Set(cart.items.map((i) => i.itemId))
    );
  };

  const handleSelectShop = (shopItems: CartItemResponse[]) => {
    const ids = shopItems.map((i) => i.itemId);
    const allSelected = ids.every((id) => selectedItems.has(id));
    setSelectedItems((prev) => {
      const s = new Set(prev);
      allSelected ? ids.forEach((id) => s.delete(id)) : ids.forEach((id) => s.add(id));
      return s;
    });
  };

  const handleProceedToCheckout = () => {
    if (selectedItems.size === 0) { toast.error('Please select items to checkout'); return; }
    localStorage.setItem('selectedCheckoutItems', JSON.stringify(Array.from(selectedItems)));
    router.push('/checkout');
  };

  if (loading) return <LoadingScreen />;

  if (!cart || cart.items.length === 0) {
    return (
      <EmptyState
        icon={ShoppingCart}
        title="Your Cart is Empty"
        ctaLabel="Start Shopping"
        ctaHref="/products"
      />
    );
  }

  const isAllSelected = cart.items.length > 0 && selectedItems.size === cart.items.length;
  const groupedItems = cart.items.reduce<Record<string, CartItemResponse[]>>((acc, item) => {
    (acc[item.shopId] ??= []).push(item);
    return acc;
  }, {});
  const selectedTotal = cart.items
    .filter((i) => selectedItems.has(i.itemId))
    .reduce((sum, i) => sum + i.subTotal, 0);

  return (
    <div className="min-h-screen bg-slate-50 py-10 font-sans">
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900 md:text-4xl">
              Shopping Cart
            </h1>
            <p className="mt-1 font-medium text-slate-500">
              You have{' '}
              <span className="font-bold text-cyan-600">{cart.totalItems} items</span> in your cart
            </p>
          </div>
        </div>

        <div className="flex flex-col items-start gap-8 lg:flex-row">
          <div className="flex w-full flex-col gap-6 lg:w-2/3">
            <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <label className="flex cursor-pointer select-none items-center gap-3">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  onChange={handleSelectAll}
                  className="h-5 w-5 cursor-pointer rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
                />
                <span className="font-bold text-slate-700">Select All ({cart.items.length} items)</span>
              </label>

              {selectedItems.size > 0 && (
                <button
                  onClick={handleBulkDelete}
                  className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold text-red-500 transition-colors hover:bg-red-500 hover:text-white"
                >
                  <Trash2 className="h-4 w-4" /> Delete Selected ({selectedItems.size})
                </button>
              )}
            </div>

            {Object.entries(groupedItems).map(([shopId, shopItems]) => (
              <CartShopGroup
                key={shopId}
                shopId={shopId}
                shopName={shopNames[shopId] ?? shopId}
                items={shopItems}
                selectedItems={selectedItems}
                updatingId={updatingId}
                onSelectShop={handleSelectShop}
                onSelectItem={handleSelectItem}
                onUpdateQuantity={updateQuantity}
              />
            ))}
          </div>

          <div className="w-full lg:w-1/3">
            <OrderSummary
              selectedCount={selectedItems.size}
              selectedTotal={selectedTotal}
              onCheckout={handleProceedToCheckout}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
