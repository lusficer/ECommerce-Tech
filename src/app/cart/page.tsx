'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation'; 
import { ShoppingCart, Trash2, ArrowRight, ShieldCheck, Loader2, Store } from 'lucide-react';
import toast from 'react-hot-toast';

interface CartItemResponse {
  itemId: number;
  productId: string;
  shopId: string;
  productName: string;
  productImage: string;
  unitPrice: number;
  quantity: number;
  subTotal: number;
  discountPercentage?: number; 
}

interface CartResponse {
  cartId: number;
  userId: string;
  totalItems: number;
  totalPrice: number;
  items: CartItemResponse[];
}

export default function CartPage() {
  const router = useRouter(); // [MỚI] Khởi tạo router
  const [cart, setCart] = useState<CartResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
  
  const [shopNames, setShopNames] = useState<Record<string, string>>({});

  const fetchCart = async () => {
    const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
    const userId = localStorage.getItem('userId');
    if (!token || !userId) { setLoading(false); return; }

    try {
      const res = await fetch(`http://localhost:8088/api/cart`, {
        headers: { 'Authorization': `Bearer ${token}`, 'userId': userId }
      });
      if (res.ok) {
        const cartData = await res.json();
        setCart(cartData);

        const uniqueShopIds = Array.from(new Set(cartData.items.map((item: any) => item.shopId)));
        const namesMap: Record<string, string> = {};

        await Promise.all(
          uniqueShopIds.map(async (shopId) => {
            try {
               const shopRes = await fetch(`http://localhost:8082/api/shops/${shopId}`, {
                 headers: { 'Authorization': `Bearer ${token}` }
               });
               if (shopRes.ok) {
                 const shopData = await shopRes.json();
                 namesMap[shopId as string] = shopData.shopName || shopData.name || (shopId as string);
               } else {
                 namesMap[shopId as string] = (shopId as string);
               }
            } catch (e) {
               namesMap[shopId as string] = (shopId as string);
            }
          })
        );
        setShopNames(namesMap);
      }
    } catch (err) {
      toast.error("Cannot load cart data. Please try again!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCart(); }, []);

  const updateQuantity = async (itemId: number, newQty: number) => {
    const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
    const userId = localStorage.getItem('userId');
    if (!token || !userId) return;

    setUpdatingId(itemId);
    try {
      const res = await fetch(`http://localhost:8088/api/cart/items/${itemId}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'userId': userId, 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity: newQty })
      });

      if (res.ok) {
        setCart(await res.json());
        window.dispatchEvent(new Event('cartUpdated')); 
        if (newQty <= 0) {
           toast.success("Item removed from cart!");
           setSelectedItems(prev => {
             const newSet = new Set(prev);
             newSet.delete(itemId);
             return newSet;
           });
        }
      }
    } catch (err) {
      toast.error("Cannot connect to cart server!");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedItems.size === 0) return;
    const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
    const userId = localStorage.getItem('userId');
    if (!token || !userId) return;

    const itemIdsToDelete = Array.from(selectedItems);

    try {
      const res = await fetch(`http://localhost:8088/api/cart/items`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}`, 'userId': userId, 'Content-Type': 'application/json' },
        body: JSON.stringify(itemIdsToDelete)
      });

      if (res.ok) {
        setCart(await res.json());
        setSelectedItems(new Set()); 
        window.dispatchEvent(new Event('cartUpdated')); 
        toast.success(`Successfully removed ${itemIdsToDelete.length} items from cart.`);
      } else {
        toast.error("Error occurred while removing items from cart!");
      }
    } catch (err) {
      toast.error("Cannot connect to cart server!");
    }
  };

  const handleSelectItem = (itemId: number) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) newSet.delete(itemId);
      else newSet.add(itemId);
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (!cart) return;
    if (selectedItems.size === cart.items.length) {
      setSelectedItems(new Set()); 
    } else {
      setSelectedItems(new Set(cart.items.map(item => item.itemId))); 
    }
  };

  const handleSelectShop = (shopItems: CartItemResponse[]) => {
    const shopItemIds = shopItems.map(item => item.itemId);
    const isAllShopSelected = shopItemIds.every(id => selectedItems.has(id));

    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (isAllShopSelected) {
        shopItemIds.forEach(id => newSet.delete(id));
      } else {
        shopItemIds.forEach(id => newSet.add(id));
      }
      return newSet;
    });
  };

  const handleProceedToCheckout = () => {
    if (selectedItems.size === 0) {
      toast.error("Please select items to checkout");
      return;
    }
    const selectedIdsArray = Array.from(selectedItems);
    localStorage.setItem('selectedCheckoutItems', JSON.stringify(selectedIdsArray));
    
    router.push('/checkout');
  };

  if (loading) return <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50"><Loader2 className="w-12 h-12 animate-spin text-cyan-600 mb-4" /></div>;

  if (!cart || cart.items.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 py-12 flex flex-col items-center justify-center font-sans">
        <div className="w-32 h-32 bg-slate-200 rounded-full flex items-center justify-center mb-6"><ShoppingCart className="w-16 h-16 text-slate-400" /></div>
        <h2 className="text-3xl font-black text-slate-900 mb-3 tracking-tight">Your Cart is Empty</h2>
        <Link href="/products" className="px-8 py-3.5 mt-4 bg-slate-900 text-white font-black rounded-xl hover:bg-cyan-600 transition-all shadow-md flex items-center gap-2">Start Shopping <ArrowRight className="w-5 h-5" /></Link>
      </div>
    );
  }

  const isAllSelected = cart.items.length > 0 && selectedItems.size === cart.items.length;

  const groupedItems = cart.items.reduce((acc, item) => {
    if (!acc[item.shopId]) acc[item.shopId] = [];
    acc[item.shopId].push(item);
    return acc;
  }, {} as Record<string, CartItemResponse[]>);

  const selectedCartItems = cart.items.filter(item => selectedItems.has(item.itemId));
  const selectedTotalPrice = selectedCartItems.reduce((sum, item) => sum + item.subTotal, 0);

  return (
    <div className="min-h-screen bg-slate-50 py-10 font-sans">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="flex items-end justify-between mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">Shopping Cart</h1>
            <p className="text-slate-500 mt-1 font-medium">You have <span className="font-bold text-cyan-600">{cart.totalItems} items</span> in your cart</p>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 items-start">
          
          <div className="w-full lg:w-2/3 flex flex-col gap-6">
            
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

            {Object.entries(groupedItems).map(([shopId, shopItems]) => {
              const isShopAllSelected = shopItems.every(item => selectedItems.has(item.itemId));
              
              return (
                <div key={shopId} className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                  
                  <div className="px-5 py-4 border-b border-slate-100 bg-slate-50 flex items-center gap-3">
                    <input 
                      type="checkbox" 
                      checked={isShopAllSelected}
                      onChange={() => handleSelectShop(shopItems)}
                      className="w-5 h-5 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500 cursor-pointer" 
                    />
                    <Store className="w-5 h-5 text-cyan-600" />
                    <Link href={`/seller/${shopId}`} className="font-black text-slate-800 tracking-wide hover:text-cyan-600 transition-colors">
                      {shopNames[shopId]} 
                    </Link>
                  </div>

                  <div className="flex flex-col divide-y divide-slate-100">
                    {shopItems.map((item) => {
                      const img = item.productImage ? item.productImage.split('|')[0] : 'https://placehold.co/200x200?text=No+Image';
                      const isUpdating = updatingId === item.itemId;
                      const isSelected = selectedItems.has(item.itemId);

                      const hasDiscount = item.discountPercentage && item.discountPercentage > 0;
                      const originalPrice = hasDiscount 
                        ? item.unitPrice / (1 - (item.discountPercentage as number) / 100) 
                        : item.unitPrice;

                      return (
                        <div key={item.itemId} className={`p-5 flex flex-col sm:flex-row gap-6 items-center sm:items-start transition-all relative ${isUpdating ? 'opacity-50 pointer-events-none' : ''} ${isSelected ? 'bg-cyan-50/30' : 'hover:bg-slate-50'}`}>
                          
                          <div className="absolute top-5 left-5 sm:static sm:mt-12 shrink-0">
                            <input 
                              type="checkbox" 
                              checked={isSelected}
                              onChange={() => handleSelectItem(item.itemId)}
                              className="w-5 h-5 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500 cursor-pointer" 
                            />
                          </div>

                          <Link href={`/products/${item.productId}`} className="w-24 h-24 sm:w-28 sm:h-28 shrink-0 bg-white rounded-xl border border-slate-200 flex items-center justify-center p-2 group mt-6 sm:mt-0">
                            <img src={img} alt={item.productName} className="w-full h-full object-contain mix-blend-multiply group-hover:scale-110 transition-transform duration-500" />
                          </Link>

                          <div className="flex-1 flex flex-col w-full">
                            <div className="pr-10 mb-2">
                              <Link href={`/products/${item.productId}`}>
                                <h3 className="text-base font-bold text-slate-900 leading-snug hover:text-cyan-600 transition-colors line-clamp-2">{item.productName}</h3>
                              </Link>
                            </div>

                            <div className="flex flex-wrap items-center gap-2 mb-4">
                              <span className="text-lg font-black text-cyan-600">
                                {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(item.unitPrice)}
                              </span>
                              
                              {hasDiscount && (
                                <>
                                  <span className="text-sm font-medium text-slate-400 line-through">
                                    {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(originalPrice)}
                                  </span>
                                  <span className="bg-yellow-400 text-slate-900 text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider">
                                    -{item.discountPercentage}%
                                  </span>
                                </>
                              )}
                            </div>

                            <div className="mt-auto flex items-center justify-between">
                              <div className="flex items-center bg-white border border-slate-200 rounded-xl p-1 w-28">
                                <button onClick={() => updateQuantity(item.itemId, item.quantity - 1)} className="w-8 h-8 flex items-center justify-center text-slate-600 hover:bg-slate-100 rounded-lg transition-colors font-black">-</button>
                                <input 
                                type="number" 
                                value={item.quantity} 
                                readOnly 
                                className="flex-1 w-8 text-center font-bold text-slate-900 bg-transparent border-none p-0 focus:ring-0 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none -moz-appearance-none" 
                                />
                                <button onClick={() => updateQuantity(item.itemId, item.quantity + 1)} className="w-8 h-8 flex items-center justify-center text-slate-600 hover:bg-slate-100 rounded-lg transition-colors font-black">+</button>
                              </div>

                              <div className="text-right">
                                <span className="text-xs font-bold text-slate-400 block">Subtotal</span>
                                <span className="text-base font-black text-slate-900">
                                  {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(item.subTotal)}
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          <button onClick={() => updateQuantity(item.itemId, 0)} className="absolute top-4 right-4 p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors" title="Remove item">
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>

                </div>
              );
            })}
          </div>

          <div className="w-full lg:w-1/3">
            <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-sm sticky top-28">
              <h2 className="text-xl font-black text-slate-900 mb-6">Order Summary</h2>
              
              <div className="space-y-4 text-sm font-medium text-slate-600 border-b border-slate-100 pb-6 mb-6">
                <div className="flex justify-between items-center">
                  <span>Selected ({selectedItems.size} items)</span>
                  <span className="font-bold text-slate-900">{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(selectedTotalPrice)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Shipping</span><span className="font-bold text-green-600">Calculated at checkout</span>
                </div>
              </div>
              
              <div className="flex justify-between items-end mb-8">
                <span className="text-lg font-bold text-slate-900">Total</span>
                <span className="text-4xl font-black text-cyan-600 tracking-tight">
                  {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(selectedTotalPrice)}
                </span>
              </div>
              
              <button 
                onClick={handleProceedToCheckout}
                disabled={selectedItems.size === 0}
                className={`w-full py-4 font-black text-lg rounded-xl transition-all flex items-center justify-center gap-2 mb-4 group ${selectedItems.size > 0 ? 'bg-slate-900 text-white hover:bg-cyan-600 hover:-translate-y-0.5 shadow-md' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
              >
                Proceed to Checkout <ArrowRight className={`w-5 h-5 ${selectedItems.size > 0 ? 'group-hover:translate-x-1 transition-transform' : ''}`} />
              </button>
              
              <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100">
                <ShieldCheck className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                <p className="text-xs text-slate-600 font-medium leading-relaxed">
                  Secure checkout. We use state-of-the-art encryption to protect your financial information.
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}