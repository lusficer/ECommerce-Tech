'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { apiGet, apiPut } from '@/lib/api';
import type { ShipperAvailableOrderDTO, OrderAddress } from '@/types';
import { 
  Truck, MapPin, Phone, User, CheckCircle2, 
  XCircle, Loader2, ChevronLeft, Package, Clock, Navigation, X
} from 'lucide-react';

export default function ShipperOrdersPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<any[]>([]);
  const [shipperId, setShipperId] = useState('');
  
  const [activeTab, setActiveTab] = useState<'AVAILABLE' | 'SHIPPING' | 'DELIVERED'>('AVAILABLE');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  
  const [updateModal, setUpdateModal] = useState({
    isOpen: false,
    orderId: '',
    status: 'DELIVERED', 
    note: ''
  });

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    const storedUserId = localStorage.getItem('userId');

    if (!token || !storedUserId) {
      router.push('/login');
      return;
    }

    if (!storedUserId.startsWith('SHIPPER')) {
      toast.error('Access Denied. Shippers only.');
      router.push('/');
      return;
    }

    setShipperId(storedUserId);
    fetchOrders(storedUserId, activeTab);
  }, [activeTab, router]);

  const fetchOrders = async (sId: string, tab: string) => {
    setLoading(true);
    try {
      if (tab === 'AVAILABLE') {
        const data = await apiGet<ShipperAvailableOrderDTO[]>('order', '/api/shipper/orders/available', {
          withUserId: true,
          headers: { userId: sId },
        });
        setOrders(data);
      } else {
        const data = await apiGet<any[]>('order', `/api/shipper/orders/my-deliveries?status=${tab}`, {
          withUserId: true,
          headers: { userId: sId },
        });
        setOrders(data);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Cannot fetch orders';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptOrder = async (orderId: string) => {
    setActionLoadingId(orderId);
    try {
      await apiPut('order', `/api/shipper/orders/${orderId}/accept`, undefined, {
        withUserId: true,
        headers: { userId: shipperId },
      });
      toast.success('Successfully accepted the order!');
      // Immediately remove from the current list and switch to My Deliveries.
      setOrders((prev) => prev.filter((o) => o?.orderId !== orderId));
      setActiveTab('SHIPPING');
    } catch (err: any) {
      toast.error(err?.message || 'Cannot accept this order.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleUpdateSubmit = async () => {
    if (updateModal.status !== 'DELIVERED' && !updateModal.note.trim()) {
      toast.error('Please enter a reason note (e.g., Customer did not answer).');
      return;
    }

    setActionLoadingId(updateModal.orderId);
    try {
      await apiPut(
        'order',
        `/api/shipper/orders/${updateModal.orderId}/status`,
        { status: updateModal.status, note: updateModal.note || 'Delivered successfully' },
        { withUserId: true, headers: { userId: shipperId } }
      );

      toast.success('Order status updated successfully!');
      setUpdateModal({ isOpen: false, orderId: '', status: 'DELIVERED', note: '' });
      fetchOrders(shipperId, activeTab);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update status.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const openUpdateModal = (orderId: string) => {
    setUpdateModal({ isOpen: true, orderId, status: 'DELIVERED', note: '' });
  };

  const formatAddressText = (a?: Partial<OrderAddress> | null) => {
    if (!a) return 'N/A';
    const parts = [a.addressLine, a.ward, a.district, a.city].filter(Boolean);
    return parts.length ? parts.join(', ') : 'N/A';
  };

  const buildAddress = (addr: Partial<OrderAddress> | undefined) => ({
    addressLine: addr?.addressLine || '',
    ward: addr?.ward || '',
    district: addr?.district || '',
    city: addr?.city || '',
    phone: (addr as any)?.phone || '',
    fullName: (addr as any)?.fullName || '',
  });

  const extractPickupDelivery = (order: any) => {
    const deliveryObj: Partial<OrderAddress> | undefined =
      order.deliveryAddress && typeof order.deliveryAddress === 'object'
        ? order.deliveryAddress
        : (order.orderAddress || order.shippingAddress);

    const delivery = buildAddress(deliveryObj);
    if (!delivery.phone) delivery.phone = order.deliveryPhone || '';
    if (!delivery.addressLine) delivery.addressLine = order.deliveryAddress || '';
    if (!delivery.city) delivery.city = order.deliveryCity || '';
    if (!delivery.district) delivery.district = order.deliveryDistrict || '';
    if (!delivery.ward) delivery.ward = order.deliveryWard || '';

    const pickup: Partial<OrderAddress> = {
      addressLine: order.pickupAddress || '',
      city: order.pickupCity || '',
      district: order.pickupDistrict || '',
      ward: order.pickupWard || '',
      phone: order.pickupPhone || '',
    };

    return { pickup, delivery };
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-12">
      <div className="bg-slate-900 border-b border-slate-800 sticky top-0 z-30">
        <div className="max-w-[1000px] mx-auto px-4 sm:px-6 py-6">
          <Link href="/seller" className="inline-flex items-center text-xs font-bold text-slate-400 hover:text-cyan-400 mb-4 transition-colors">
            <ChevronLeft className="w-4 h-4 mr-1" /> Back to Staff Portal
          </Link>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-black text-white flex items-center gap-2">
                <Truck className="w-6 h-6 text-purple-400" /> Delivery Partner
              </h1>
              <p className="text-sm font-medium text-slate-400 mt-1">Manage your deliveries and routes.</p>
            </div>
            <div className="bg-slate-800 px-4 py-2 rounded-lg border border-slate-700 text-sm text-slate-300">
              Shipper ID: <span className="font-bold text-white">{shipperId || 'Loading...'}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1000px] mx-auto px-4 sm:px-6 mt-8">
        <div className="flex overflow-x-auto gap-4 border-b border-slate-200 mb-6 scrollbar-hide">
          <button onClick={() => setActiveTab('AVAILABLE')} className={`pb-4 px-2 text-sm font-bold border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${activeTab === 'AVAILABLE' ? 'border-purple-600 text-purple-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>
            <Package className="w-4 h-4" /> Available to Pick
          </button>
          <button onClick={() => setActiveTab('SHIPPING')} className={`pb-4 px-2 text-sm font-bold border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${activeTab === 'SHIPPING' ? 'border-purple-600 text-purple-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>
            <Truck className="w-4 h-4" /> My Deliveries
          </button>
          <button onClick={() => setActiveTab('DELIVERED')} className={`pb-4 px-2 text-sm font-bold border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${activeTab === 'DELIVERED' ? 'border-purple-600 text-purple-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>
            <CheckCircle2 className="w-4 h-4" /> Completed
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-10 h-10 animate-spin text-purple-600" /></div>
        ) : orders.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-300">
            <Truck className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-700">No orders found</h3>
            <p className="text-slate-500 mt-2">You don't have any orders in this section.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => {
              const legacyAddress = (order.orderAddress || order.shippingAddress || {}) as Partial<OrderAddress>;
              const { pickup, delivery } = extractPickupDelivery(order);
              const isActionLoading = actionLoadingId === order.orderId;

              const recipientName = (legacyAddress as any).fullName || order.userId || 'Customer';
              const recipientPhone = (legacyAddress as any).phone || (delivery as any).phone || order.deliveryPhone || 'No phone';

              return (
                <div key={order.orderId} className={`bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden ${isActionLoading ? 'opacity-50 pointer-events-none' : ''}`}>
                  
                  <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                    <div className="flex flex-col">
                      <span className="font-black text-slate-900">#{order.orderId}</span>
                      <span className="text-xs font-bold text-purple-600 uppercase tracking-wider">{order.shopId}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-slate-500 block mb-1">COD Amount</span>
                      <span className="text-xl font-black text-slate-900">
                        {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(order.grandTotal)}
                      </span>
                    </div>
                  </div>

                  <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <User className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-bold text-slate-900">{recipientName}</p>
                          <p className="text-sm text-slate-500 flex items-center gap-1 mt-1">
                            <Phone className="w-3.5 h-3.5" /> {recipientPhone}
                          </p>
                        </div>
                      </div>
                      {activeTab === 'AVAILABLE' ? (
                        <div className="space-y-3">
                          <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50">
                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">📦 Pickup at:</p>
                            <p className="text-sm text-slate-700 font-medium leading-relaxed">{formatAddressText(pickup)}</p>
                            {(pickup as any).phone && (
                              <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
                                <Phone className="w-3.5 h-3.5" /> {(pickup as any).phone}
                              </p>
                            )}
                          </div>

                          <div className="flex items-start gap-3">
                            <MapPin className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
                            <div className="flex-1">
                              <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">📍 Deliver to:</p>
                              <p className="text-sm text-slate-700 font-medium leading-relaxed">{formatAddressText(delivery)}</p>
                            </div>
                            <a
                              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(formatAddressText(delivery))}`}
                              target="_blank"
                              rel="noreferrer"
                              className="p-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 shrink-0 transition-colors"
                              title="Open in Google Maps"
                            >
                              <Navigation className="w-5 h-5" />
                            </a>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start gap-3">
                          <MapPin className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <p className="text-sm text-slate-700 font-medium leading-relaxed">
                              {formatAddressText(legacyAddress as any)}
                            </p>
                          </div>
                          <a
                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(formatAddressText(legacyAddress as any))}`}
                            target="_blank" rel="noreferrer"
                            className="p-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 shrink-0 transition-colors"
                            title="Open in Google Maps"
                          >
                            <Navigation className="w-5 h-5" />
                          </a>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col justify-end gap-3 border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6">
                      {activeTab === 'AVAILABLE' && (
                        <button 
                          onClick={() => handleAcceptOrder(order.orderId)}
                          className="w-full py-3.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-md transition-colors flex items-center justify-center gap-2"
                        >
                          {isActionLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Truck className="w-5 h-5" />} Pick Up Order
                        </button>
                      )}

                      {activeTab === 'SHIPPING' && (
                        <button 
                          onClick={() => openUpdateModal(order.orderId)}
                          className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-md transition-colors flex items-center justify-center gap-2"
                        >
                          Update Status
                        </button>
                      )}

                      {activeTab === 'DELIVERED' && (
                        <div className="w-full py-3.5 bg-green-50 text-green-600 font-bold rounded-xl flex items-center justify-center gap-2 border border-green-100">
                          <CheckCircle2 className="w-5 h-5" /> Delivered Successfully
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {updateModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in slide-in-from-bottom-10 sm:zoom-in-95 duration-300">
            <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50">
              <h3 className="font-black text-slate-800 text-lg">Update Order #{updateModal.orderId}</h3>
              <button onClick={() => setUpdateModal({ ...updateModal, isOpen: false })} className="text-slate-400 hover:bg-slate-200 p-1.5 rounded-full"><X className="w-5 h-5" /></button>
            </div>
            
            <div className="p-6">
              <p className="text-sm font-bold text-slate-700 mb-3">Delivery Result:</p>
              
              <div className="grid grid-cols-1 gap-3 mb-6">
                <label className={`flex items-start p-4 border-2 rounded-xl cursor-pointer transition-all ${updateModal.status === 'DELIVERED' ? 'bg-green-50 border-green-500 shadow-sm' : 'bg-white border-slate-200 hover:border-slate-300'}`}>
                  <input type="radio" name="status" value="DELIVERED" checked={updateModal.status === 'DELIVERED'} onChange={() => setUpdateModal({...updateModal, status: 'DELIVERED'})} className="hidden" />
                  <CheckCircle2 className={`w-5 h-5 mt-0.5 mr-3 shrink-0 ${updateModal.status === 'DELIVERED' ? 'text-green-600' : 'text-slate-300'}`} />
                  <div>
                     <p className={`font-bold mb-0.5 ${updateModal.status === 'DELIVERED' ? 'text-green-700' : 'text-slate-700'}`}>Delivered Successfully</p>
                     <p className="text-xs text-slate-500 leading-relaxed">COD collected (if applicable). Shipping journey completed.</p>
                  </div>
                </label>

                <label className={`flex items-start p-4 border-2 rounded-xl cursor-pointer transition-all ${updateModal.status === 'FAILED' ? 'bg-orange-50 border-orange-500 shadow-sm' : 'bg-white border-slate-200 hover:border-slate-300'}`}>
                  <input type="radio" name="status" value="FAILED" checked={updateModal.status === 'FAILED'} onChange={() => setUpdateModal({...updateModal, status: 'FAILED'})} className="hidden" />
                  <Clock className={`w-5 h-5 mt-0.5 mr-3 shrink-0 ${updateModal.status === 'FAILED' ? 'text-orange-600' : 'text-slate-300'}`} />
                  <div>
                     <p className={`font-bold mb-0.5 ${updateModal.status === 'FAILED' ? 'text-orange-700' : 'text-slate-700'}`}>Delivery Failed (Reschedule)</p>
                     <p className="text-xs text-slate-500 leading-relaxed">Customer unavailable, unreachable. Order stays in queue for next attempt.</p>
                  </div>
                </label>

                <label className={`flex items-start p-4 border-2 rounded-xl cursor-pointer transition-all ${updateModal.status === 'RETURNED' ? 'bg-red-50 border-red-500 shadow-sm' : 'bg-white border-slate-200 hover:border-slate-300'}`}>
                  <input type="radio" name="status" value="RETURNED" checked={updateModal.status === 'RETURNED'} onChange={() => setUpdateModal({...updateModal, status: 'RETURNED'})} className="hidden" />
                  <XCircle className={`w-5 h-5 mt-0.5 mr-3 shrink-0 ${updateModal.status === 'RETURNED' ? 'text-red-600' : 'text-slate-300'}`} />
                  <div>
                     <p className={`font-bold mb-0.5 ${updateModal.status === 'RETURNED' ? 'text-red-700' : 'text-slate-700'}`}>Delivery Failed (Return to Sender)</p>
                     <p className="text-xs text-slate-500 leading-relaxed">Customer refused, wrong address. Order will be returned to the shop.</p>
                  </div>
                </label>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Detailed Note {updateModal.status !== 'DELIVERED' && <span className="text-red-500">*</span>}
                </label>
                <textarea 
                  rows={2}
                  placeholder={
                    updateModal.status === 'DELIVERED' ? "Left at reception, in mailbox..." : 
                    updateModal.status === 'FAILED' ? "Customer didn't pick up..." : 
                    "Customer refused to receive..."
                  }
                  value={updateModal.note} 
                  onChange={(e) => setUpdateModal({...updateModal, note: e.target.value})}
                  className={`w-full px-4 py-3 rounded-xl border-2 outline-none text-sm transition-colors ${
                    updateModal.status === 'DELIVERED' ? 'border-slate-200 focus:border-green-500 bg-slate-50 focus:bg-white' :
                    updateModal.status === 'FAILED' ? 'border-slate-200 focus:border-orange-500 bg-slate-50 focus:bg-white' :
                    'border-slate-200 focus:border-red-500 bg-slate-50 focus:bg-white'
                  }`}
                />
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-3">
              <button 
                onClick={() => setUpdateModal({ ...updateModal, isOpen: false })}
                className="flex-1 px-4 py-3 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleUpdateSubmit}
                disabled={actionLoadingId === updateModal.orderId}
                className={`flex-1 px-4 py-3 text-white font-bold rounded-xl shadow-md transition-colors flex items-center justify-center gap-2 ${
                  updateModal.status === 'DELIVERED' ? 'bg-green-600 hover:bg-green-700' : 
                  updateModal.status === 'FAILED' ? 'bg-orange-500 hover:bg-orange-600' :
                  'bg-red-600 hover:bg-red-700'
                }`}
              >
                {actionLoadingId === updateModal.orderId ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}