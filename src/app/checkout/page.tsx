'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { 
  MapPin, CreditCard, ChevronLeft, Package, 
  Truck, ShieldCheck, Loader2, Store 
} from 'lucide-react';

import { logout } from '@/lib/auth';
import { apiDelete, apiGet, apiPost, getUserFacingErrorMessage, isApiError } from '@/lib/api';
import type { CartResponse } from '@/types';

export default function CheckoutPage() {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [shopNames, setShopNames] = useState<Record<string, string>>({}); 
  const [cartTotal, setCartTotal] = useState(0);
  const shippingFeePerShop = 5; 

  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    addressLine: '',
    city: '',
    district: '',
    ward: '',
    paymentMethod: 'COD'
  });

  useEffect(() => {
    setIsMounted(true);
    fetchCartData();
  }, []);

  const fetchCartData = async () => {
    const token = localStorage.getItem('accessToken');
    const userId = localStorage.getItem('userId');
    
    if (!token || !userId) {
      toast.error('You must be logged in to checkout!');
      router.push('/login');
      return;
    }

    try {
      const cartData = await apiGet<CartResponse>('cart', '/api/cart');
      const allCartItems = cartData.items || [];
        
        const selectedIdsStr = localStorage.getItem('selectedCheckoutItems');
        let filteredItems = allCartItems;

        if (selectedIdsStr) {
          try {
            const parsedData = JSON.parse(selectedIdsStr); 
            if (Array.isArray(parsedData) && parsedData.length > 0) {
               if (typeof parsedData[0] === 'object' && parsedData[0] !== null) {
                   const targetProductIds = parsedData.map((item: any) => item.productId);
                   filteredItems = allCartItems.filter((item: any) => targetProductIds.includes(item.productId));
               } else {
                   filteredItems = allCartItems.filter((item: any) => parsedData.includes(item.itemId));
               }
            }
          } catch (e) {
            console.error("Error parsing selected items", e);
          }
        }

        if (filteredItems.length === 0) {
          toast.error("No products available for checkout!");
          router.push('/cart');
          return;
        }

        setCartItems(filteredItems);
        const total = filteredItems.reduce((sum: number, item: any) => sum + (item.unitPrice * item.quantity), 0);
        setCartTotal(total);

        const uniqueShopIds = Array.from(new Set(filteredItems.map((item: any) => item.shopId)));
        const namesMap: Record<string, string> = {};
        await Promise.all(
          uniqueShopIds.map(async (shopIdStr) => {
            try {
               const shopData = await apiGet<any>('shop', `/api/shops/${shopIdStr}`, {
                 withUserId: false,
               });
               namesMap[shopIdStr as string] = shopData?.shopName || (shopIdStr as string);
            } catch (e) {
               namesMap[shopIdStr as string] = (shopIdStr as string);
            }
          })
        );
        setShopNames(namesMap);
    } catch (err) {
      if (isApiError(err) && (err.status === 401 || err.status === 403)) {
        logout();
        toast.error('Your session has expired. Please sign in again.');
        router.push('/login');
        return;
      }

      toast.error(
        getUserFacingErrorMessage(err, {
          defaultMessage: 'Unable to load checkout information.',
        })
      );
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const groupedItems = cartItems.reduce((acc, item) => {
    if (!acc[item.shopId]) acc[item.shopId] = [];
    acc[item.shopId].push(item);
    return acc;
  }, {} as Record<string, any[]>);

  const shopIds = Object.keys(groupedItems);
  const totalShippingFee = shopIds.length * shippingFeePerShop; 
  const grandTotal = cartTotal + totalShippingFee;

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cartItems.length === 0) return;

    // VNPay currently supports checkout from only one shop.
    if (formData.paymentMethod === 'VNPAY' && shopIds.length > 1) {
      toast.error('VNPay currently supports checking out from ONE shop at a time. Please select COD or checkout separately.');
      return;
    }

    setIsSubmitting(true);
    const token = localStorage.getItem('accessToken');
    const userId = localStorage.getItem('userId');
    
    try {
      let vnPayUrlToRedirect = null;
      let lastOrderId = null;

      // Create a separate order per shop.
      for (const shopId of shopIds) {
        const itemsForThisShop = groupedItems[shopId].map((item:any) => ({
          productId: item.productId,
          productName: item.productName,
          productImage: item.productImage,
          quantity: item.quantity,
          unitPrice: item.unitPrice
        }));

        const payload = {
          shopId: shopId,
          paymentMethod: formData.paymentMethod,
          address: {
            fullName: formData.fullName,
            phone: formData.phone,
            addressLine: formData.addressLine,
            city: formData.city,
            district: formData.district,
            ward: formData.ward
          },
          items: itemsForThisShop
        };

        const orderData = await apiPost<any>('order', '/api/user/orders/place', payload);
        lastOrderId = orderData.orderId;
        
        if (orderData.paymentUrl) {
           vnPayUrlToRedirect = orderData.paymentUrl;
        }
      }

      const itemIdsToRemove = cartItems.map(item => item.itemId);
      await apiDelete<CartResponse>('cart', '/api/cart/items', itemIdsToRemove);
      
      localStorage.removeItem('selectedCheckoutItems');
      window.dispatchEvent(new Event('cartUpdated')); 

      if (vnPayUrlToRedirect) {
         // Keep a hint for downstream pages if needed.
         if (lastOrderId) localStorage.setItem('justPlacedOrder', String(lastOrderId));
          window.location.href = vnPayUrlToRedirect; 
      } else {
          toast.success('Order placed successfully!');
          if (shopIds.length > 1) {
           const query = new URLSearchParams({
            shops: String(shopIds.length),
            payment: 'success',
           });
           router.push(`/checkout/success?${query.toString()}`);
          } else {
           if (lastOrderId) localStorage.setItem('justPlacedOrder', String(lastOrderId));
           const query = new URLSearchParams({
            orderId: String(lastOrderId || ''),
            shops: '1',
            payment: 'success',
           });
           router.push(`/checkout/success?${query.toString()}`);
          }
      }

    } catch (error: any) {
      if (isApiError(error) && (error.status === 401 || error.status === 403)) {
        logout();
        toast.error('Your session has expired. Please sign in again.');
        router.push('/login');
        return;
      }

      toast.error(
        getUserFacingErrorMessage(error, {
          defaultMessage: 'Failed to place your order.',
        })
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isMounted) return null;

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-7xl mx-auto">
        
        <div className="mb-8">
          <Link href="/cart" className="flex items-center text-sm font-bold text-slate-500 hover:text-cyan-600 transition-colors w-fit">
            <ChevronLeft className="w-4 h-4 mr-1" /> Back to Cart
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          <div className="lg:col-span-7 xl:col-span-8 space-y-6">
            <form onSubmit={handlePlaceOrder} id="checkout-form">
              <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-slate-100 mb-6">
                <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
                  <div className="bg-cyan-50 p-2 rounded-lg text-cyan-600"><MapPin className="w-6 h-6" /></div>
                  <h2 className="text-xl font-black text-slate-900">Shipping Information</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-slate-700 mb-2">Full Name</label>
                    <input required type="text" name="fullName" value={formData.fullName} onChange={handleInputChange} placeholder="Enter recipient's full name" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-cyan-500 outline-none" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-slate-700 mb-2">Phone Number</label>
                    <input required type="tel" name="phone" value={formData.phone} onChange={handleInputChange} placeholder="Enter phone number" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-cyan-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">City / Province</label>
                    <input required type="text" name="city" value={formData.city} onChange={handleInputChange} placeholder="Ex: Ho Chi Minh City" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-cyan-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">District</label>
                    <input required type="text" name="district" value={formData.district} onChange={handleInputChange} placeholder="Ex: District 1" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-cyan-500 outline-none" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-slate-700 mb-2">Ward</label>
                    <input required type="text" name="ward" value={formData.ward} onChange={handleInputChange} placeholder="Ex: Ben Nghe Ward" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-cyan-500 outline-none" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-slate-700 mb-2">Detailed Address</label>
                    <input required type="text" name="addressLine" value={formData.addressLine} onChange={handleInputChange} placeholder="Ex: 123 Nguyen Hue Street" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-cyan-500 outline-none" />
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-slate-100">
                <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
                  <div className="bg-cyan-50 p-2 rounded-lg text-cyan-600"><CreditCard className="w-6 h-6" /></div>
                  <h2 className="text-xl font-black text-slate-900">Payment Method</h2>
                </div>
                <div className="space-y-4">
                  <label className={`flex items-center justify-between p-4 border rounded-xl cursor-pointer transition-all ${formData.paymentMethod === 'COD' ? 'border-cyan-500 bg-cyan-50/30' : 'border-slate-200 hover:border-slate-300'}`}>
                    <div className="flex items-center gap-4">
                      <input type="radio" name="paymentMethod" value="COD" checked={formData.paymentMethod === 'COD'} onChange={handleInputChange} className="w-5 h-5 text-cyan-600" />
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-900">Cash on Delivery (COD)</span>
                        <span className="text-sm text-slate-500">Pay when you receive the order</span>
                      </div>
                    </div>
                    <Truck className="w-6 h-6 text-slate-400" />
                  </label>

                  <label className={`flex items-center justify-between p-4 border rounded-xl cursor-pointer transition-all ${formData.paymentMethod === 'VNPAY' ? 'border-cyan-500 bg-cyan-50/30' : 'border-slate-200 hover:border-slate-300'}`}>
                    <div className="flex items-center gap-4">
                      <input type="radio" name="paymentMethod" value="VNPAY" checked={formData.paymentMethod === 'VNPAY'} onChange={handleInputChange} className="w-5 h-5 text-cyan-600" />
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-900">Online Payment (VNPay)</span>
                        <span className="text-sm text-slate-500">Pay securely via VNPay gateway</span>
                        {shopIds.length > 1 && formData.paymentMethod === 'VNPAY' && (
                           <span className="text-xs text-red-500 font-bold mt-1">* Only supports checking out 1 shop at a time.</span>
                        )}
                      </div>
                    </div>
                    <ShieldCheck className="w-6 h-6 text-slate-400" />
                  </label>
                </div>
              </div>
            </form>
          </div>

          {/* Right Column: Order Summary gom theo Shop */}
          <div className="lg:col-span-5 xl:col-span-4">
            <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.05)] border border-slate-100 sticky top-24">
              <h2 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-2">
                <Package className="w-6 h-6 text-cyan-600" /> Order Summary
              </h2>

              <div className="max-h-[350px] overflow-y-auto pr-2 mb-6 scrollbar-thin">
                {shopIds.map((shopId) => (
                  <div key={shopId} className="mb-6 last:mb-0">
                    <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-100">
                      <Store className="w-4 h-4 text-slate-400" />
                      <span className="font-bold text-slate-800 text-sm">{shopNames[shopId] || 'Loading Shop...'}</span>
                    </div>
                    {groupedItems[shopId].map((item :any, idx:any) => {
                      const img = item.productImage ? item.productImage.split('|')[0] : 'https://placehold.co/100x100?text=No+Image';
                      return (
                        <div key={idx} className="flex gap-4 py-3">
                          <div className="w-14 h-14 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-center p-1.5 shrink-0">
                            <img src={img} alt={item.productName} className="w-full h-full object-contain mix-blend-multiply" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-slate-900 line-clamp-2">{item.productName}</p>
                            <p className="text-xs text-slate-500 mt-0.5">Qty: {item.quantity}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-sm font-black text-cyan-600">
                              {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(item.unitPrice * item.quantity)}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>

              <div className="space-y-3 pt-4 border-t border-slate-100">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500 font-medium">Subtotal</span>
                  <span className="font-bold text-slate-900">{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cartTotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500 font-medium">Shipping Fee ({shopIds.length} shop{shopIds.length > 1 ? 's' : ''})</span>
                  <span className="font-bold text-slate-900">{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(totalShippingFee)}</span>
                </div>
              </div>

              <div className="flex justify-between items-end pt-4 mt-4 border-t border-slate-100 mb-8">
                <span className="text-base font-bold text-slate-900">Grand Total</span>
                <span className="text-2xl font-black text-cyan-600">
                  {cartItems.length > 0 ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(grandTotal) : '$0.00'}
                </span>
              </div>

              <button 
                type="submit" 
                form="checkout-form"
                disabled={isSubmitting || cartItems.length === 0 || (formData.paymentMethod === 'VNPAY' && shopIds.length > 1)}
                className="w-full bg-slate-900 text-white font-bold py-4 rounded-xl hover:bg-cyan-600 transition-all shadow-md disabled:bg-slate-300 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isSubmitting ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Processing...</> : 'Place Order'}
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}