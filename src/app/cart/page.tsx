// ===== src/app/cart/page.tsx =====
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ShoppingCart, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

import { CartItemResponse, CartResponse } from '@/types';
import { getAuth } from '@/lib/auth';
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

  // ─── Data fetching ──────────────────────────────────────────────────────────
  const fetchCart = async () => {
    const { token, userId } = getAuth();
    if (!token || !userId) { setLoading(false); return; }

    try {
      const res = await fetch('http://localhost:8088/api/cart', {
        headers: { Authorization: `Bearer ${token}`, userId },
      });
      if (res.ok) {
        const cartData: CartResponse = await res.json();
        setCart(cartData);

        // Fetch shop names in parallel
        const uniqueShopIds = Array.from(new Set(cartData.items.map((i) => i.shopId)));
        const namesMap: Record<string, string> = {};
        await Promise.all(
          uniqueShopIds.map(async (shopId) => {
            try {
              const shopRes = await fetch(`http://localhost:8082/api/shops/${shopId}`, {
                headers: { Authorization: `Bearer ${token}` },
              });
              namesMap[shopId] = shopRes.ok
                ? ((await shopRes.json()).shopName ?? shopId)
                : shopId;
            } catch {
              namesMap[shopId] = shopId;
            }
          })
        );
        setShopNames(namesMap);
      }
    } catch {
      toast.error('Cannot load cart data. Please try again!');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCart(); }, []);

  // ─── Cart mutations ─────────────────────────────────────────────────────────
  const updateQuantity = async (itemId: number, newQty: number) => {
    const { token, userId } = getAuth();
    if (!token || !userId) return;
    setUpdatingId(itemId);
    try {
      const res = await fetch(`http://localhost:8088/api/cart/items/${itemId}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, userId, 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity: newQty }),
      });
      if (res.ok) {
        setCart(await res.json());
        window.dispatchEvent(new Event('cartUpdated'));
        if (newQty <= 0) {
          toast.success('Item removed from cart!');
          setSelectedItems((prev) => { const s = new Set(prev); s.delete(itemId); return s; });
        }
      }
    } catch {
      toast.error('Cannot connect to cart server!');
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
      const res = await fetch('http://localhost:8088/api/cart/items', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}`, userId, 'Content-Type': 'application/json' },
        body: JSON.stringify(ids),
      });
      if (res.ok) {
        setCart(await res.json());
        setSelectedItems(new Set());
        window.dispatchEvent(new Event('cartUpdated'));
        toast.success(`Successfully removed ${ids.length} items from cart.`);
      } else {
        toast.error('Error occurred while removing items from cart!');
      }
    } catch {
      toast.error('Cannot connect to cart server!');
    }
  };

  // ─── Selection helpers ──────────────────────────────────────────────────────
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

  // ─── Render ─────────────────────────────────────────────────────────────────
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
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">

        {/* Page header */}
        <div className="flex items-end justify-between mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">Shopping Cart</h1>
            <p className="text-slate-500 mt-1 font-medium">
              You have <span className="font-bold text-cyan-600">{cart.totalItems} items</span> in your cart
            </p>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 items-start">

          {/* Left column */}
          <div className="w-full lg:w-2/3 flex flex-col gap-6">

            {/* Select-all / bulk-delete bar */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex items-center justify-between">
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  onChange={handleSelectAll}
                  className="w-5 h-5 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500 cursor-pointer"
                />
                <span className="font-bold text-slate-700">Select All ({cart.items.length} items)</span>
              </label>

              {selectedItems.size > 0 && (
                <button
                  onClick={handleBulkDelete}
                  className="flex items-center gap-2 text-red-500 hover:text-white hover:bg-red-500 font-bold px-4 py-2 rounded-lg transition-colors text-sm"
                >
                  <Trash2 className="w-4 h-4" /> Delete Selected ({selectedItems.size})
                </button>
              )}
            </div>

            {/* Shop groups */}
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

          {/* Right column */}
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
