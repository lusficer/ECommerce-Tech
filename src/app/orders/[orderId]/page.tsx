'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import {
  Package,
  Truck,
  CheckCircle2,
  XCircle,
  Clock,
  MapPin,
  CreditCard,
  ArrowLeft,
  Loader2,
  AlertTriangle,
  Scale,
} from 'lucide-react';

import { getAuth } from '@/lib/auth';
import { apiGet, apiPost, apiPut, getUserFacingErrorMessage } from '@/lib/api';
import {
  canFileDispute,
  getDisputeLabel,
  getEffectiveOrderStatus,
  getLatestDispute,
} from '@/lib/disputeHelpers';
import DisputeModal from '@/components/orders/DisputeModal';
import DisputeStatus from '@/components/orders/DisputeStatus';

export default function OrderDetailsPage({ params }: { params: Promise<{ orderId: string }> }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const resolvedParams = React.use(params);
  const orderId = resolvedParams.orderId;

  const [order, setOrder] = useState<any>(null);
  const [trackingLogs, setTrackingLogs] = useState<any[]>([]);
  const [currentDispute, setCurrentDispute] = useState<any>(null);

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [isSuccessFromCheckout, setIsSuccessFromCheckout] = useState(false);

  const formatStatusLabel = (value?: string) => String(value || '').replace(/_/g, ' ').trim();

  const getShippingStatus = () =>
    String(order?.shippingStatus || order?.shipStatus || order?.deliveryStatus || '')
      .trim()
      .toUpperCase();

  const getLatestTrackingStatus = () =>
    String(trackingLogs?.[0]?.displayStatus || trackingLogs?.[0]?.status || '')
      .trim()
      .toUpperCase();

  const resolveDisplayStatus = () => {
    const shippingStatus = getShippingStatus();
    const trackingStatus = getLatestTrackingStatus();

    if (shippingStatus === 'DELIVERED' || trackingStatus.includes('DELIVERED')) return 'DELIVERED';
    if (shippingStatus === 'RETURNED' || trackingStatus.includes('RETURNED')) return 'RETURNED';
    if (shippingStatus === 'FAILED' || shippingStatus === 'DELIVERY_FAILED' || trackingStatus.includes('FAILED')) return 'FAILED';
    if (shippingStatus === 'PICKING_UP') return 'PICKING_UP';
    if (shippingStatus === 'IN_TRANSIT') return 'IN_TRANSIT';
    if (shippingStatus === 'SHIPPING') return 'SHIPPING';
    return order?.orderStatus || '';
  };

  useEffect(() => {
    if (!orderId) return;

    const paymentStatusQuery = searchParams.get('payment');
    if (paymentStatusQuery === 'success') {
      const query = new URLSearchParams({
        orderId,
        shops: '1',
        payment: 'success',
      });
      router.replace(`/checkout/success?${query.toString()}`);
    } else if (paymentStatusQuery === 'failed') {
      const query = new URLSearchParams({
        orderId,
        shops: '1',
        payment: 'failed',
      });
      router.replace(`/checkout/success?${query.toString()}`);
    }
  }, [searchParams, orderId, router]);

  const fetchOrderDetailsAndTracking = async () => {
    const { token, userId } = getAuth();
    if (!token || !userId) {
      router.push('/login');
      return;
    }

    try {
      const historyData = await apiGet<any[]>('order', '/api/user/orders/history');
      const currentOrder = historyData.find((historyOrder: any) => historyOrder.orderId === orderId);

      if (!currentOrder) {
        toast.error('Order not found!');
        setLoading(false);
        return;
      }

      setOrder(currentOrder);

      try {
        const tracks = await apiGet<any[]>('order', `/api/user/orders/${orderId}/track`);
        setTrackingLogs(tracks || []);
      } catch {
        setTrackingLogs([]);
      }

      try {
        const disputes = await apiGet<any[]>('dispute', '/api/user/disputes', {
          userIdHeader: 'X-User-Id',
        });
        const orderDisputes = (disputes || []).filter((dispute) => dispute.orderId === orderId);
        const latestDispute = getLatestDispute(orderDisputes);
        setCurrentDispute(latestDispute);
      } catch {
        setCurrentDispute(null);
      }
    } catch (error) {
      console.error('Error fetching order details:', error);
      toast.error('Cannot connect to the server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!orderId) return;

    const isJustCheckout = localStorage.getItem('justPlacedOrder');
    if (isJustCheckout === orderId) {
      setIsSuccessFromCheckout(true);
      localStorage.removeItem('justPlacedOrder');
      localStorage.removeItem('selectedCheckoutItems');
      window.dispatchEvent(new Event('cartUpdated'));
    }

    fetchOrderDetailsAndTracking();
  }, [orderId]);

  const handleCancelOrder = async () => {
    if (!window.confirm('Are you sure you want to cancel this order?')) return;

    setActionLoading(true);
    try {
      await apiPut('order', `/api/user/orders/${orderId}/cancel`);
      toast.success('Order cancelled successfully!');
      await fetchOrderDetailsAndTracking();
    } catch (error: any) {
      toast.error(error?.message || 'Cannot cancel order at this time');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCompleteOrder = async () => {
    setActionLoading(true);
    try {
      await apiPut('order', `/api/user/orders/${orderId}/complete`);
      toast.success('Thank you! Order has been completed.');
      await fetchOrderDetailsAndTracking();
    } catch (err) {
      toast.error(
        getUserFacingErrorMessage(err, {
          defaultMessage: 'Cannot complete order.',
        })
      );
    } finally {
      setActionLoading(false);
    }
  };

  const submitDispute = async (payload: { reason: string; description: string; images: string[] }) => {
    await apiPost(
      'dispute',
      '/api/user/disputes',
      {
        orderId,
        reason: payload.reason,
        description: payload.description,
        initialEvidence: payload.images.map((image, index) => ({
          fileUrl: image,
          fileType: 'IMAGE',
          description: `Evidence ${index + 1}`,
        })),
      },
      {
        userIdHeader: 'X-User-Id',
        headers: { 'X-Shop-Id': order?.shopId || '' },
      }
    );
    toast.success('Dispute submitted successfully!');
    await fetchOrderDetailsAndTracking();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'NEW':
      case 'PENDING_VERIFICATION':
        return { color: 'bg-blue-50 text-blue-600 border-blue-200', icon: Clock, label: 'Pending Verification' };
      case 'PROCESSING':
      case 'READY_TO_SHIP':
        return { color: 'bg-yellow-50 text-yellow-600 border-yellow-200', icon: Package, label: 'Processing' };
      case 'PICKING_UP':
        return { color: 'bg-sky-50 text-sky-600 border-sky-200', icon: Package, label: 'Picking Up' };
      case 'IN_TRANSIT':
        return { color: 'bg-indigo-50 text-indigo-600 border-indigo-200', icon: Truck, label: 'In Transit' };
      case 'SHIPPING':
        return { color: 'bg-purple-50 text-purple-600 border-purple-200', icon: Truck, label: 'Shipping' };
      case 'DELIVERED':
        return { color: 'bg-green-50 text-green-600 border-green-200', icon: CheckCircle2, label: 'Delivered' };
      case 'COMPLETED':
        return { color: 'bg-teal-50 text-teal-600 border-teal-200', icon: CheckCircle2, label: 'Complete' };
      case 'DISPUTED':
        return { color: 'bg-orange-50 text-orange-600 border-orange-200', icon: Scale, label: 'Disputed' };
      case 'FAILED':
        return { color: 'bg-red-50 text-red-600 border-red-200', icon: XCircle, label: 'Failed' };
      case 'RETURNED':
        return { color: 'bg-amber-50 text-amber-700 border-amber-200', icon: Truck, label: 'Returned' };
      case 'CANCELLED':
      case 'REJECTED':
        return { color: 'bg-red-50 text-red-600 border-red-200', icon: XCircle, label: 'Cancelled' };
      default:
        return { color: 'bg-slate-50 text-slate-600 border-slate-200', icon: Package, label: status };
    }
  };

  const effectiveStatus = getEffectiveOrderStatus(resolveDisplayStatus(), currentDispute?.status);
  const statusInfo = getStatusBadge(effectiveStatus);
  const StatusIcon = statusInfo.icon;

  const allTrackingLogs = useMemo(() => {
    const merged = [...trackingLogs];

    if (currentDispute) {
      merged.unshift({
        trackingId: `dispute-${currentDispute.disputeId}`,
        displayStatus: 'Dispute Filed',
        description: `${getDisputeLabel(currentDispute.status)} • ${String(currentDispute.reason || 'No reason').replace(/_/g, ' ')}`,
        updatedAt: currentDispute.updatedAt || currentDispute.createdAt,
      });
    }

    return merged.sort(
      (left, right) =>
        new Date(right.updatedAt || right.createdAt || 0).getTime() -
        new Date(left.updatedAt || left.createdAt || 0).getTime()
    );
  }, [trackingLogs, currentDispute]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-12 h-12 animate-spin text-cyan-600" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <AlertTriangle className="w-16 h-16 text-slate-300 mb-4" />
        <h2 className="text-2xl font-black text-slate-900">Order Not Found</h2>
        <Link href="/orders" className="mt-4 text-cyan-600 hover:underline font-bold text-sm">
          Return to My Orders
        </Link>
      </div>
    );
  }

  const address = order.orderAddress || {};
  const currentDisplayStatus = resolveDisplayStatus();
  const canCancel = order.orderStatus === 'NEW' || order.orderStatus === 'PENDING_VERIFICATION';
  const canConfirm = currentDisplayStatus === 'DELIVERED';
  const canDispute = canFileDispute(currentDisplayStatus, currentDispute);
  const hasDispute = Boolean(currentDispute);

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8 font-sans relative">
      <div className="max-w-6xl mx-auto">
        <Link
          href="/orders"
          className="inline-flex items-center text-sm font-bold text-slate-500 hover:text-cyan-600 transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Orders
        </Link>

        {isSuccessFromCheckout && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-6 py-4 rounded-2xl flex items-center gap-3 mb-6 shadow-sm">
            <CheckCircle2 className="w-6 h-6 text-green-500 shrink-0" />
            <div>
              <p className="font-bold">Order Placed Successfully!</p>
              <p className="text-sm">
                We&apos;ve received your order <span className="font-black">{orderId}</span>.
              </p>
            </div>
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-8">
          <div className="lg:w-2/3 flex flex-col gap-6">
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-2xl font-black text-slate-900 mb-1 flex items-center gap-2">
                  Order <span className="text-cyan-600">#{order.orderId}</span>
                </h1>
                <p className="text-sm font-medium text-slate-500">
                  Placed on{' '}
                  {new Date(order.createdAt).toLocaleString('en-US', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}
                </p>
                {currentDispute?.status && <div className="mt-3"><DisputeStatus status={currentDispute.status} /></div>}
              </div>
              <div className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold border ${statusInfo.color}`}>
                <StatusIcon className="w-4 h-4" /> {formatStatusLabel(statusInfo.label)}
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
              <h2 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2">
                <Truck className="w-5 h-5 text-cyan-600" /> Order Tracking
              </h2>
              {allTrackingLogs.length > 0 ? (
                <div className="relative border-l-2 border-slate-100 ml-3 md:ml-4 space-y-8">
                  {allTrackingLogs.map((log, index) => {
                    const isLatest = index === 0;
                    return (
                      <div key={log.trackingId || `${log.updatedAt}-${index}`} className="relative pl-6 sm:pl-8">
                        <div
                          className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full border-2 bg-white ${
                            isLatest
                              ? 'border-cyan-500 shadow-[0_0_0_4px_rgba(6,182,212,0.1)]'
                              : 'border-slate-300'
                          }`}
                        ></div>
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1">
                          <div>
                            <p className={`text-base font-bold ${isLatest ? 'text-slate-900' : 'text-slate-600'}`}>
                              {formatStatusLabel(log.displayStatus) || 'Status Updated'}
                            </p>
                            <p className="text-sm font-medium text-slate-500 mt-1 leading-relaxed">
                              {log.description || 'No details'}
                            </p>
                          </div>
                          <div className="text-xs font-bold text-slate-400 mt-1 sm:mt-0 whitespace-nowrap">
                            {new Date(log.updatedAt || log.createdAt).toLocaleString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-slate-500 text-center py-4">No tracking information available.</p>
              )}
            </div>

            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
              <h2 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2">
                <Package className="w-5 h-5 text-cyan-600" /> Items in Order
              </h2>
              <div className="divide-y divide-slate-100">
                {order.orderItems?.map((item: any, idx: number) => {
                  const img = item.productImage
                    ? item.productImage.split('|')[0]
                    : 'https://placehold.co/100x100?text=No+Image';
                  return (
                    <div key={idx} className="py-4 flex gap-4 first:pt-0 last:pb-0">
                      <div className="w-20 h-20 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-center p-2 shrink-0">
                        <img
                          src={img}
                          alt={item.productName}
                          className="w-full h-full object-contain mix-blend-multiply"
                        />
                      </div>
                      <div className="flex-1 min-w-0 flex flex-col justify-center">
                        <p className="text-sm md:text-base font-bold text-slate-900 line-clamp-2">
                          {item.productName}
                        </p>
                        <p className="text-xs font-medium text-slate-500 mt-1">
                          Quantity: <span className="font-bold text-slate-700">{item.quantity}</span>
                        </p>
                      </div>
                      <div className="text-right shrink-0 flex flex-col justify-center">
                        <p className="text-base font-black text-cyan-600">
                          {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(
                            item.totalPrice
                          )}
                        </p>
                        <p className="text-xs font-medium text-slate-400 mt-1">
                          {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(
                            item.unitPrice
                          )}{' '}
                          each
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="lg:w-1/3 flex flex-col gap-6">
            {canCancel && (
              <button
                onClick={handleCancelOrder}
                disabled={actionLoading}
                className="w-full py-4 bg-white border-2 border-red-100 text-red-500 hover:bg-red-50 font-black rounded-2xl transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {actionLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <XCircle className="w-5 h-5" />
                )}
                Cancel Order
              </button>
            )}

            {(canConfirm || canDispute || currentDispute) && (
              <div className="flex flex-col gap-3">
                {canConfirm && (
                  <button
                    onClick={handleCompleteOrder}
                    disabled={actionLoading}
                    className="w-full py-4 bg-green-600 hover:bg-green-700 text-white font-black rounded-2xl transition-colors shadow-md shadow-green-500/20 disabled:opacity-50 flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                  >
                    {actionLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-5 h-5" />
                    )}
                    Confirm Receipt
                  </button>
                )}

                {!hasDispute && canDispute && (
                  <button
                    onClick={() => setShowDisputeModal(true)}
                    disabled={actionLoading}
                    className="w-full py-4 bg-white border-2 border-orange-200 text-orange-500 hover:bg-orange-50 font-black rounded-2xl transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <Scale className="w-5 h-5" />
                    File Dispute
                  </button>
                )}

                {currentDispute && (
                  <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-black text-slate-900">Current Dispute</p>
                      <DisputeStatus status={currentDispute.status} />
                    </div>
                    <p className="text-xs text-slate-500 font-medium">
                      Created{' '}
                      {new Date(currentDispute.createdAt).toLocaleString('en-US', {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })}
                    </p>
                    <p className="text-sm text-slate-700">{currentDispute.description}</p>
                  </div>
                )}
              </div>
            )}

            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
              <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <MapPin className="w-4 h-4" /> Shipping Details
              </h2>
              <div className="text-sm text-slate-700 space-y-1.5 font-medium leading-relaxed">
                <p className="font-bold text-slate-900 text-base">{address.fullName || 'N/A'}</p>
                <p>Phone: {address.phone || 'N/A'}</p>
                <p className="text-slate-500">{address.addressLine}</p>
                <p className="text-slate-500">
                  {address.ward}, {address.district}
                </p>
                <p className="text-slate-500">{address.city}</p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
              <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <CreditCard className="w-4 h-4" /> Payment & Summary
              </h2>
              <div className="space-y-3 text-sm font-medium text-slate-500">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="text-slate-900">
                    {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(order.subTotal)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping Fee</span>
                  <span className="text-slate-900">
                    {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(
                      order.shippingFee
                    )}
                  </span>
                </div>
                <div className="border-t border-slate-100 pt-3 mt-3 flex justify-between items-end">
                  <span className="font-bold text-slate-900 text-base">Grand Total</span>
                  <span className="text-2xl font-black text-cyan-600">
                    {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(order.grandTotal)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <DisputeModal
        isOpen={showDisputeModal}
        orderId={order.orderId}
        onClose={() => setShowDisputeModal(false)}
        onSubmit={submitDispute}
      />
    </div>
  );
}
