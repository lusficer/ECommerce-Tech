'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { 
  Package, Truck, CheckCircle2, XCircle, Clock, 
  MapPin, CreditCard, ArrowLeft, Loader2, AlertTriangle
} from 'lucide-react';

export default function OrderDetailsPage({ params }: { params: Promise<{ orderId: string }> }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const resolvedParams = React.use(params);
  const orderId = resolvedParams.orderId; 

  const [order, setOrder] = useState<any>(null);
  const [trackingLogs, setTrackingLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [isSuccessFromCheckout, setIsSuccessFromCheckout] = useState(false);

  useEffect(() => {
    const paymentStatusQuery = searchParams.get('payment');
    if (paymentStatusQuery === 'success') {
      toast.success("Payment successful! Your order has been placed.");
      window.history.replaceState(null, '', `/orders/${orderId}`);
    } else if (paymentStatusQuery === 'failed') {
      toast.error("Payment failed or you have canceled the transaction.");
      window.history.replaceState(null, '', `/orders/${orderId}`);
    }
  }, [searchParams, orderId]);

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

  const fetchOrderDetailsAndTracking = async () => {
    const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
    const userId = localStorage.getItem('userId');

    if (!token || !userId) {
      router.push('/login');
      return;
    }

    try {
      const historyRes = await fetch(`http://localhost:8086/api/user/orders/history`, {
        headers: { 'Authorization': `Bearer ${token}`, 'userId': userId }
      });
      
      if (historyRes.ok) {
        const historyData = await historyRes.json();
        const currentOrder = historyData.find((o: any) => o.orderId === orderId);
        
        if (!currentOrder) {
          toast.error("Order not found!");
          setLoading(false);
          return;
        }
        setOrder(currentOrder);
      }

      const trackRes = await fetch(`http://localhost:8086/api/user/orders/${orderId}/track`, {
        headers: { 'Authorization': `Bearer ${token}`, 'userId': userId }
      });

      if (trackRes.ok) {
        const trackData = await trackRes.json();
        setTrackingLogs(trackData);
      }
    } catch (err) {
      console.error("Error fetching order details:", err);
      toast.error("Cannot connect to the server");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!window.confirm("Are you sure you want to cancel this order?")) return;
    
    setActionLoading(true);
    const token = localStorage.getItem('accessToken');
    const userId = localStorage.getItem('userId');

    try {
      const res = await fetch(`http://localhost:8086/api/user/orders/${orderId}/cancel`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'userId': userId || '' }
      });

      if (res.ok) {
        toast.success("Order cancelled successfully!");
        fetchOrderDetailsAndTracking();
      } else {
        const err = await res.json();
        toast.error(err.message || "Cannot cancel order at this time");
      }
    } catch (err) {
      toast.error("Server connection error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCompleteOrder = async () => {
    if (!window.confirm("Confirm that you have received the items and they are intact?")) return;
    
    setActionLoading(true);
    const token = localStorage.getItem('accessToken');
    const userId = localStorage.getItem('userId');

    try {
      const res = await fetch(`http://localhost:8086/api/user/orders/${orderId}/complete`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'X-User-Id': userId || '' }
      });

      if (res.ok) {
        toast.success("Thank you for your purchase!");
        fetchOrderDetailsAndTracking();
      } else {
        const err = await res.json();
        toast.error(err.message || "Error confirming order");
      }
    } catch (err) {
      toast.error("Server connection error");
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'NEW':
      case 'PENDING_VERIFICATION': return { color: 'bg-blue-50 text-blue-600 border-blue-200', icon: Clock, label: 'Pending Verification' };
      case 'PROCESSING':
      case 'READY_TO_SHIP': return { color: 'bg-yellow-50 text-yellow-600 border-yellow-200', icon: Package, label: 'Processing' };
      case 'SHIPPING': return { color: 'bg-purple-50 text-purple-600 border-purple-200', icon: Truck, label: 'Shipping' };
      case 'DELIVERED': return { color: 'bg-green-50 text-green-600 border-green-200', icon: CheckCircle2, label: 'Delivered' };
      case 'COMPLETED': return { color: 'bg-teal-50 text-teal-600 border-teal-200', icon: CheckCircle2, label: 'Completed' };
      case 'CANCELLED':
      case 'REJECTED': return { color: 'bg-red-50 text-red-600 border-red-200', icon: XCircle, label: 'Cancelled' };
      default: return { color: 'bg-slate-50 text-slate-600 border-slate-200', icon: Package, label: status };
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 className="w-12 h-12 animate-spin text-cyan-600" /></div>;
  }

  if (!order) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <AlertTriangle className="w-16 h-16 text-slate-300 mb-4" />
        <h2 className="text-2xl font-black text-slate-900">Order Not Found</h2>
        <Link href="/orders" className="mt-4 text-cyan-600 hover:underline font-bold text-sm">Return to My Orders</Link>
      </div>
    );
  }

  const statusInfo = getStatusBadge(order.orderStatus);
  const StatusIcon = statusInfo.icon;
  const address = order.orderAddress || {};

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-6xl mx-auto">
        
        <Link href="/orders" className="inline-flex items-center text-sm font-bold text-slate-500 hover:text-cyan-600 transition-colors mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Orders
        </Link>

        {isSuccessFromCheckout && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-6 py-4 rounded-2xl flex items-center gap-3 mb-6 shadow-sm animate-in fade-in slide-in-from-top-4">
            <CheckCircle2 className="w-6 h-6 text-green-500 shrink-0" />
            <div>
              <p className="font-bold">Order Placed Successfully!</p>
              <p className="text-sm">We've received your order <span className="font-black">{orderId}</span> and are getting it ready.</p>
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
                  Placed on {new Date(order.createdAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
                </p>
              </div>
              <div className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold border ${statusInfo.color}`}>
                <StatusIcon className="w-4 h-4" /> {statusInfo.label}
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
              <h2 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2">
                <Truck className="w-5 h-5 text-cyan-600" /> Order Tracking
              </h2>
              
              {trackingLogs.length > 0 ? (
                <div className="relative border-l-2 border-slate-100 ml-3 md:ml-4 space-y-8">
                  {trackingLogs.map((log, index) => {
                    const isLatest = index === 0;
                    return (
                      <div key={log.trackingId} className="relative pl-6 sm:pl-8">
                        <div className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full border-2 bg-white ${isLatest ? 'border-cyan-500 shadow-[0_0_0_4px_rgba(6,182,212,0.1)]' : 'border-slate-300'}`}></div>
                        
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1">
                          <div>
                            <p className={`text-base font-bold ${isLatest ? 'text-slate-900' : 'text-slate-600'}`}>{log.displayStatus}</p>
                            <p className="text-sm font-medium text-slate-500 mt-1 leading-relaxed">{log.description}</p>
                            
                            {log.trackingNumber && (
                              <div className="mt-2 inline-flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-700">
                                <span>Carrier: <span className="text-cyan-600">{log.carrierName}</span></span>
                                <span className="text-slate-300">|</span>
                                <span>Code: <span className="text-cyan-600">{log.trackingNumber}</span></span>
                              </div>
                            )}
                          </div>
                          <div className="text-xs font-bold text-slate-400 mt-1 sm:mt-0 whitespace-nowrap">
                            {new Date(log.updatedAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
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
                  const img = item.productImage ? item.productImage.split('|')[0] : 'https://placehold.co/100x100?text=No+Image';
                  return (
                    <div key={idx} className="py-4 flex gap-4 first:pt-0 last:pb-0">
                      <div className="w-20 h-20 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-center p-2 shrink-0">
                        <img src={img} alt={item.productName} className="w-full h-full object-contain mix-blend-multiply" />
                      </div>
                      <div className="flex-1 min-w-0 flex flex-col justify-center">
                        <p className="text-sm md:text-base font-bold text-slate-900 line-clamp-2">{item.productName}</p>
                        <p className="text-xs font-medium text-slate-500 mt-1">Quantity: <span className="font-bold text-slate-700">{item.quantity}</span></p>
                      </div>
                      <div className="text-right shrink-0 flex flex-col justify-center">
                        <p className="text-base font-black text-cyan-600">
                          {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(item.totalPrice)}
                        </p>
                        <p className="text-xs font-medium text-slate-400 mt-1">
                          {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(item.unitPrice)} each
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

          <div className="lg:w-1/3 flex flex-col gap-6">
            
            {(order.orderStatus === 'NEW' || order.orderStatus === 'PENDING_VERIFICATION') && (
              <button 
                onClick={handleCancelOrder}
                disabled={actionLoading}
                className="w-full py-4 bg-white border-2 border-red-100 text-red-500 hover:bg-red-50 font-black rounded-2xl transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {actionLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <XCircle className="w-5 h-5" />}
                Cancel Order
              </button>
            )}

            {order.orderStatus === 'DELIVERED' && (
              <button 
                onClick={handleCompleteOrder}
                disabled={actionLoading}
                className="w-full py-4 bg-teal-500 hover:bg-teal-600 text-white font-black rounded-2xl transition-colors shadow-md shadow-teal-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {actionLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                Confirm Order Received
              </button>
            )}

            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
              <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <MapPin className="w-4 h-4" /> Shipping Details
              </h2>
              <div className="text-sm text-slate-700 space-y-1.5 font-medium leading-relaxed">
                <p className="font-bold text-slate-900 text-base">{address.fullName || 'N/A'}</p>
                <p>Phone: {address.phone || 'N/A'}</p>
                <p className="text-slate-500">{address.addressLine}</p>
                <p className="text-slate-500">{address.ward}, {address.district}</p>
                <p className="text-slate-500">{address.city}</p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
              <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <CreditCard className="w-4 h-4" /> Payment & Summary
              </h2>
              
              <div className="flex items-center gap-3 mb-6 p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div className="bg-white p-1.5 rounded-lg shadow-sm border border-slate-200">
                  <CreditCard className="w-5 h-5 text-slate-600" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500">Method & Status</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <p className="text-sm font-black text-slate-900">
                      {order.paymentMethod === 'COD' ? 'Cash on Delivery (COD)' : order.paymentMethod}
                    </p>
                    
                    {order.paymentStatus === 'PAID' && (
                      <span className="px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-black rounded uppercase">PAID</span>
                    )}
                    {order.paymentStatus === 'FAILED' && (
                      <span className="px-2 py-0.5 bg-red-100 text-red-700 text-[10px] font-black rounded uppercase">FAILED</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-3 pt-2 text-sm font-medium text-slate-500">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="text-slate-900">{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(order.subTotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping Fee</span>
                  <span className="text-slate-900">{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(order.shippingFee)}</span>
                </div>
                {order.discountAmount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span>
                    <span>-{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(order.discountAmount)}</span>
                  </div>
                )}
                
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
    </div>
  );
}