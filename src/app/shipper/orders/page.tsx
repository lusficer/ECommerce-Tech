'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { apiFetch, apiGet, apiPut } from '@/lib/api';
import type { DeliveryPhotoType, ShipperAvailableOrderDTO, OrderAddress, ShipperStatusDTO } from '@/types';
import { 
  Truck, MapPin, Phone, User, CheckCircle2, 
  XCircle, Loader2, ChevronLeft, Package, Clock, Navigation, X
} from 'lucide-react';

export default function ShipperOrdersPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<any[]>([]);
  const [shipperId, setShipperId] = useState('');
  const [shipperStatus, setShipperStatus] = useState<ShipperStatusDTO | null>(null);
  const [statusDraft, setStatusDraft] = useState<'AVAILABLE' | 'UNAVAILABLE' | 'ON_DELIVERY'>('AVAILABLE');
  const [statusReason, setStatusReason] = useState('');
  const [updatingShipperStatus, setUpdatingShipperStatus] = useState(false);
  
  const [activeTab, setActiveTab] = useState<'AVAILABLE' | 'SHIPPING' | 'DELIVERED'>('AVAILABLE');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  
  const [updateModal, setUpdateModal] = useState({
    isOpen: false,
    orderId: '',
    currentShippingStatus: '',
    status: 'IN_TRANSIT', 
    note: '',
    photoFile: null as File | null,
    photoType: '' as DeliveryPhotoType | '',
    reschedule: true,
    nextAttempt: '',
  });

  const isShipperOnDelivery = String(shipperStatus?.status || '').toUpperCase() === 'ON_DELIVERY';
  const formatEnumLabel = (value?: string) => String(value || '').replace(/_/g, ' ').trim();

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
    fetchOrders(activeTab);
    fetchShipperStatus();
  }, [activeTab, router]);

  const fetchOrders = async (tab: string) => {
    setLoading(true);
    try {
      if (tab === 'AVAILABLE') {
        const data = await apiGet<ShipperAvailableOrderDTO[]>('order', '/api/shipper/orders/available', {
          withUserId: false,
        });
        setOrders(data);
      } else {
        const data = await apiGet<any[]>('order', `/api/shipper/orders/my-deliveries?status=${tab}`, {
          withUserId: false,
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

  const fetchShipperStatus = async () => {
    try {
      const data = await apiGet<ShipperStatusDTO>('order', '/api/shipper/orders/status', {
        withUserId: false,
      });
      setShipperStatus(data);
      const status = String(data?.status || 'AVAILABLE').toUpperCase();
      if (status === 'AVAILABLE' || status === 'UNAVAILABLE' || status === 'ON_DELIVERY') {
        setStatusDraft(status as 'AVAILABLE' | 'UNAVAILABLE' | 'ON_DELIVERY');
      }
      setStatusReason(data?.unavailableReason || '');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Cannot fetch shipper status';
      toast.error(message);
    }
  };

  const handleUpdateShipperStatus = async () => {
    if (statusDraft === 'UNAVAILABLE' && !statusReason.trim()) {
      toast.error('Unavailable reason is required.');
      return;
    }
    setUpdatingShipperStatus(true);
    try {
      const payload: Record<string, string> = { status: statusDraft };
      if (statusDraft === 'UNAVAILABLE') {
        payload.unavailableReason = statusReason.trim();
      }
      await apiPut('order', '/api/shipper/orders/status', payload, { withUserId: false });
      toast.success('Shipper status updated.');
      await fetchShipperStatus();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update shipper status';
      toast.error(message);
    } finally {
      setUpdatingShipperStatus(false);
    }
  };

  const handleAcceptOrder = async (orderId: string) => {
    setActionLoadingId(orderId);
    try {
      await apiPut('order', `/api/shipper/orders/${orderId}/accept`, undefined, {
        withUserId: false,
      });
      toast.success('Successfully accepted the order!');
      // Immediately remove from the current list and switch to My Deliveries.
      setOrders((prev) => prev.filter((o) => o?.orderId !== orderId));
      setActiveTab('SHIPPING');
      fetchShipperStatus();
    } catch (err: any) {
      toast.error(err?.message || 'Cannot accept this order.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const resolvePhotoTypeForShippingStatus = (shippingStatus: string): DeliveryPhotoType | '' => {
    const normalized = String(shippingStatus || '').toUpperCase();
    if (normalized === 'PICKING_UP') return 'PICKING_UP';
    if (normalized === 'DELIVERED') return 'DELIVERED';
    if (normalized === 'FAILED' || normalized === 'DELIVERY_FAILED') return 'FAILED';
    if (normalized === 'RETURNED') return 'RETURNED';
    return '';
  };

  const handleUploadPhoto = async () => {
    if (!isShipperOnDelivery) {
      toast.error('You can upload delivery photo only when your status is ON DELIVERY.');
      return;
    }

    if (!updateModal.photoFile) {
      toast.error('Please select an image file.');
      return;
    }

    const expectedType = resolvePhotoTypeForShippingStatus(updateModal.currentShippingStatus || updateModal.status);
    if (!expectedType) {
      toast.error('Current shipping status does not allow photo upload.');
      return;
    }

    if (updateModal.photoType !== expectedType) {
      toast.error(`Photo type must match current shipping status: ${expectedType}.`);
      return;
    }

    setActionLoadingId(updateModal.orderId);
    try {
      const formData = new FormData();
      formData.append('file', updateModal.photoFile);
      formData.append('photoType', updateModal.photoType);

      await apiFetch(
        'order',
        `/api/shipper/orders/${updateModal.orderId}/photos`,
        {
          method: 'POST',
          body: formData,
          withUserId: false,
        }
      );
      toast.success('Photo uploaded successfully.');
      setUpdateModal((prev) => ({ ...prev, photoFile: null }));
    } catch (err: any) {
      toast.error(err?.message || 'Failed to upload photo.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleUpdateSubmit = async () => {
    if (!isShipperOnDelivery) {
      toast.error('You can update order status only when your shipper status is ON DELIVERY.');
      return;
    }

    if (updateModal.status === 'FAILED' && !updateModal.note.trim()) {
      toast.error('Please enter a reason note (e.g., Customer did not answer).');
      return;
    }

    if (updateModal.status === 'FAILED' && updateModal.reschedule && !updateModal.nextAttempt) {
      toast.error('Please choose next delivery attempt time for reschedule.');
      return;
    }

    setActionLoadingId(updateModal.orderId);
    try {
      const baseNote =
        updateModal.note || (updateModal.status === 'DELIVERED' ? 'Delivered successfully' : '');

      const failureSuffix =
        updateModal.status === 'FAILED'
          ? [
              updateModal.reschedule ? 'Failure handling: RESCHEDULE' : 'Failure handling: CLOSE',
              updateModal.reschedule && updateModal.nextAttempt
                ? `Next attempt: ${updateModal.nextAttempt}`
                : '',
            ]
              .filter(Boolean)
              .join(' | ')
          : '';

      const finalNote = [baseNote.trim(), failureSuffix].filter(Boolean).join(' | ');

      await apiPut(
        'order',
        `/api/shipper/orders/${updateModal.orderId}/status`,
        {
          status: updateModal.status,
          note: finalNote,
        },
        { withUserId: false }
      );

      toast.success('Order status updated successfully!');
      setUpdateModal({
        isOpen: false,
        orderId: '',
        currentShippingStatus: '',
        status: 'IN_TRANSIT',
        note: '',
        photoFile: null,
        photoType: '',
        reschedule: true,
        nextAttempt: '',
      });
      fetchOrders(activeTab);
      fetchShipperStatus();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update status.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const openUpdateModal = (order: any) => {
    if (!isShipperOnDelivery) {
      toast.error('Set your availability to ON DELIVERY before updating order status.');
      return;
    }

    const currentShippingStatus =
      order?.shippingStatus ||
      order?.shipStatus ||
      order?.deliveryStatus ||
      order?.status ||
      '';
    const defaultPhotoType = resolvePhotoTypeForShippingStatus(currentShippingStatus);

    setUpdateModal({
      isOpen: true,
      orderId: order.orderId,
      currentShippingStatus,
      status: 'IN_TRANSIT',
      note: '',
      photoFile: null,
      photoType: defaultPhotoType,
      reschedule: true,
      nextAttempt: '',
    });
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
        <div className="mb-6 bg-white rounded-2xl border border-slate-200 p-4 sm:p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black text-slate-400 uppercase tracking-wider">Current Availability</p>
              <p className="text-lg font-black text-slate-900 mt-1">
                {shipperStatus?.status ? formatEnumLabel(shipperStatus.status) : 'N/A'}
              </p>
              {shipperStatus?.status === 'UNAVAILABLE' && shipperStatus?.unavailableReason && (
                <p className="text-sm text-slate-500 mt-1">Reason: {shipperStatus.unavailableReason}</p>
              )}
            </div>
            <button
              onClick={fetchShipperStatus}
              className="px-3 py-2 rounded-lg border border-slate-200 text-sm font-bold text-slate-700 hover:bg-slate-50"
            >
              Refresh Status
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
            <button
              onClick={() => setStatusDraft('AVAILABLE')}
              className={`px-3 py-2.5 rounded-xl text-sm font-bold border ${statusDraft === 'AVAILABLE' ? 'bg-green-600 text-white border-green-600' : 'bg-white text-slate-700 border-slate-200'}`}
            >
              AVAILABLE
            </button>
            <button
              onClick={() => setStatusDraft('ON_DELIVERY')}
              className={`px-3 py-2.5 rounded-xl text-sm font-bold border ${statusDraft === 'ON_DELIVERY' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-700 border-slate-200'}`}
            >
              ON DELIVERY
            </button>
            <button
              onClick={() => setStatusDraft('UNAVAILABLE')}
              className={`px-3 py-2.5 rounded-xl text-sm font-bold border ${statusDraft === 'UNAVAILABLE' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-700 border-slate-200'}`}
            >
              UNAVAILABLE
            </button>
          </div>

          {statusDraft === 'UNAVAILABLE' && (
            <div className="mt-3">
              <label className="text-xs font-black text-slate-500 uppercase tracking-wider block mb-1.5">
                Unavailable reason *
              </label>
              <input
                value={statusReason}
                onChange={(e) => setStatusReason(e.target.value)}
                placeholder="Vehicle issue, break, emergency..."
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-cyan-500"
              />
            </div>
          )}

          <div className="mt-4">
            <button
              onClick={handleUpdateShipperStatus}
              disabled={updatingShipperStatus}
              className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white text-sm font-bold"
            >
              {updatingShipperStatus ? 'Updating...' : 'Update My Status'}
            </button>
          </div>
        </div>

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
                          onClick={() => openUpdateModal(order)}
                          disabled={!isShipperOnDelivery}
                          className={`w-full py-3.5 text-white font-bold rounded-xl shadow-md transition-colors flex items-center justify-center gap-2 ${
                            isShipperOnDelivery
                              ? 'bg-slate-900 hover:bg-slate-800'
                              : 'bg-slate-300 cursor-not-allowed'
                          }`}
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
              {updateModal.currentShippingStatus && (
                <p className="text-xs font-bold text-slate-500 mb-3">
                  Current shipping status: <span className="text-slate-700">{formatEnumLabel(updateModal.currentShippingStatus)}</span>
                </p>
              )}
              
              <div className="grid grid-cols-1 gap-3 mb-6">
                <label className={`flex items-start p-4 border-2 rounded-xl cursor-pointer transition-all ${updateModal.status === 'PICKING_UP' ? 'bg-blue-50 border-blue-500 shadow-sm' : 'bg-white border-slate-200 hover:border-slate-300'}`}>
                  <input type="radio" name="status" value="PICKING_UP" checked={updateModal.status === 'PICKING_UP'} onChange={() => setUpdateModal({...updateModal, status: 'PICKING_UP'})} className="hidden" />
                  <Package className={`w-5 h-5 mt-0.5 mr-3 shrink-0 ${updateModal.status === 'PICKING_UP' ? 'text-blue-600' : 'text-slate-300'}`} />
                  <div>
                    <p className={`font-bold mb-0.5 ${updateModal.status === 'PICKING_UP' ? 'text-blue-700' : 'text-slate-700'}`}>Picking Up</p>
                     <p className="text-xs text-slate-500 leading-relaxed">Package collected from pickup point.</p>
                  </div>
                </label>

                <label className={`flex items-start p-4 border-2 rounded-xl cursor-pointer transition-all ${updateModal.status === 'IN_TRANSIT' ? 'bg-cyan-50 border-cyan-500 shadow-sm' : 'bg-white border-slate-200 hover:border-slate-300'}`}>
                  <input type="radio" name="status" value="IN_TRANSIT" checked={updateModal.status === 'IN_TRANSIT'} onChange={() => setUpdateModal({...updateModal, status: 'IN_TRANSIT'})} className="hidden" />
                  <Truck className={`w-5 h-5 mt-0.5 mr-3 shrink-0 ${updateModal.status === 'IN_TRANSIT' ? 'text-cyan-600' : 'text-slate-300'}`} />
                  <div>
                     <p className={`font-bold mb-0.5 ${updateModal.status === 'IN_TRANSIT' ? 'text-cyan-700' : 'text-slate-700'}`}>In Transit</p>
                     <p className="text-xs text-slate-500 leading-relaxed">Package is on the way to delivery area.</p>
                  </div>
                </label>

                 <label className={`flex items-start p-4 border-2 rounded-xl cursor-pointer transition-all ${updateModal.status === 'DELIVERED' ? 'bg-green-50 border-green-500 shadow-sm' : 'bg-white border-slate-200 hover:border-slate-300'}`}>
                  <input type="radio" name="status" value="DELIVERED" checked={updateModal.status === 'DELIVERED'} onChange={() => setUpdateModal({...updateModal, status: 'DELIVERED'})} className="hidden" />
                  <CheckCircle2 className={`w-5 h-5 mt-0.5 mr-3 shrink-0 ${updateModal.status === 'DELIVERED' ? 'text-green-600' : 'text-slate-300'}`} />
                  <div>
                    <p className={`font-bold mb-0.5 ${updateModal.status === 'DELIVERED' ? 'text-green-700' : 'text-slate-700'}`}>Delivered</p>
                    <p className="text-xs text-slate-500 leading-relaxed">Delivery completed successfully.</p>
                  </div>
                </label>

                 <label className={`flex items-start p-4 border-2 rounded-xl cursor-pointer transition-all ${updateModal.status === 'FAILED' ? 'bg-red-50 border-red-500 shadow-sm' : 'bg-white border-slate-200 hover:border-slate-300'}`}>
                  <input type="radio" name="status" value="FAILED" checked={updateModal.status === 'FAILED'} onChange={() => setUpdateModal({...updateModal, status: 'FAILED'})} className="hidden" />
                  <XCircle className={`w-5 h-5 mt-0.5 mr-3 shrink-0 ${updateModal.status === 'FAILED' ? 'text-red-600' : 'text-slate-300'}`} />
                  <div>
                    <p className={`font-bold mb-0.5 ${updateModal.status === 'FAILED' ? 'text-red-700' : 'text-slate-700'}`}>Failed</p>
                    <p className="text-xs text-slate-500 leading-relaxed">Delivery failed. Please provide reason in note.</p>
                  </div>
                </label>

                 <label className={`flex items-start p-4 border-2 rounded-xl cursor-pointer transition-all ${updateModal.status === 'RETURNED' ? 'bg-orange-50 border-orange-500 shadow-sm' : 'bg-white border-slate-200 hover:border-slate-300'}`}>
                  <input type="radio" name="status" value="RETURNED" checked={updateModal.status === 'RETURNED'} onChange={() => setUpdateModal({...updateModal, status: 'RETURNED'})} className="hidden" />
                  <Truck className={`w-5 h-5 mt-0.5 mr-3 shrink-0 ${updateModal.status === 'RETURNED' ? 'text-orange-600' : 'text-slate-300'}`} />
                  <div>
                    <p className={`font-bold mb-0.5 ${updateModal.status === 'RETURNED' ? 'text-orange-700' : 'text-slate-700'}`}>Returned</p>
                    <p className="text-xs text-slate-500 leading-relaxed">Order is returned to the shop.</p>
                  </div>
                </label>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Detailed Note {updateModal.status === 'FAILED' && <span className="text-red-500">*</span>}
                </label>
                <textarea 
                  rows={2}
                  placeholder={
                    updateModal.status === 'FAILED'
                      ? "Customer unavailable / wrong address / cannot deliver..."
                      : "Optional note..."
                  }
                  value={updateModal.note} 
                  onChange={(e) => setUpdateModal({...updateModal, note: e.target.value})}
                  className={`w-full px-4 py-3 rounded-xl border-2 outline-none text-sm transition-colors ${
                    updateModal.status === 'FAILED'
                      ? 'border-slate-200 focus:border-red-500 bg-slate-50 focus:bg-white'
                      : 'border-slate-200 focus:border-cyan-500 bg-slate-50 focus:bg-white'
                  }`}
                />
              </div>

              <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
                <p className="text-sm font-bold text-slate-700">Upload Delivery Photo</p>
                <p className="text-xs text-slate-500">
                  Allowed photoType must match current shipping status.
                </p>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) =>
                    setUpdateModal({
                      ...updateModal,
                      photoFile: e.target.files?.[0] || null,
                    })
                  }
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-200 bg-white text-sm outline-none focus:border-cyan-500"
                />
                {updateModal.photoFile && (
                  <p className="text-xs text-slate-500">Selected file: {updateModal.photoFile.name}</p>
                )}
                <select
                  value={updateModal.photoType}
                  onChange={(e) => setUpdateModal({ ...updateModal, photoType: e.target.value as DeliveryPhotoType })}
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-200 bg-white text-sm outline-none focus:border-cyan-500"
                >
                  <option value="">Select photo type</option>
                  <option value="PICKING_UP">PICKING_UP</option>
                  <option value="DELIVERED">DELIVERED</option>
                  <option value="FAILED">FAILED</option>
                  <option value="RETURNED">RETURNED</option>
                </select>
                <button
                  type="button"
                  onClick={handleUploadPhoto}
                  disabled={actionLoadingId === updateModal.orderId}
                  className="px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white text-sm font-bold"
                >
                  Upload Photo
                </button>
              </div>

              {updateModal.status === 'FAILED' && (
                <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
                  <p className="text-sm font-bold text-slate-700">After failed delivery</p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setUpdateModal({ ...updateModal, reschedule: true })}
                      className={`px-3 py-2 rounded-lg text-sm font-bold border transition-colors ${
                        updateModal.reschedule
                          ? 'bg-cyan-600 text-white border-cyan-600'
                          : 'bg-white text-slate-700 border-slate-200 hover:border-cyan-300'
                      }`}
                    >
                      Reschedule delivery
                    </button>
                    <button
                      type="button"
                      onClick={() => setUpdateModal({ ...updateModal, reschedule: false, nextAttempt: '' })}
                      className={`px-3 py-2 rounded-lg text-sm font-bold border transition-colors ${
                        !updateModal.reschedule
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      Mark as failed (no retry)
                    </button>
                  </div>

                  {updateModal.reschedule && (
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">
                        Next attempt time
                      </label>
                      <input
                        type="datetime-local"
                        value={updateModal.nextAttempt}
                        onChange={(e) => setUpdateModal({ ...updateModal, nextAttempt: e.target.value })}
                        className="w-full px-3 py-2.5 rounded-lg border border-slate-200 bg-white text-sm outline-none focus:border-cyan-500"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-3">
              <button 
                onClick={() =>
                  setUpdateModal({
                    isOpen: false,
                    orderId: '',
                    status: 'IN_TRANSIT',
                    note: '',
                    currentShippingStatus: '',
                    photoFile: null,
                    photoType: '',
                    reschedule: true,
                    nextAttempt: '',
                  })
                }
                className="flex-1 px-4 py-3 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleUpdateSubmit}
                disabled={actionLoadingId === updateModal.orderId}
                className={`flex-1 px-4 py-3 text-white font-bold rounded-xl shadow-md transition-colors flex items-center justify-center gap-2 ${
                  updateModal.status === 'DELIVERED'
                    ? 'bg-green-600 hover:bg-green-700'
                    : updateModal.status === 'FAILED'
                      ? 'bg-red-600 hover:bg-red-700'
                      : 'bg-cyan-600 hover:bg-cyan-700'
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