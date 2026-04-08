'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { apiGet, apiPut } from '@/lib/api';
import { loadManagedShops } from '@/lib/shop';
import type { VerificationContextDTO, RiskLevel } from '@/types';
import { 
  ClipboardList, Truck, CheckCircle2, XCircle, 
  Search, Loader2, AlertTriangle, Package, ChevronLeft, ShieldAlert,
  ShoppingBag
} from 'lucide-react';

export default function ManagerOrdersPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  
  const coerceTab = (value?: string | null): 'ALL' | 'PENDING' | 'SHIPPING' => {
    const v = String(value || '').trim().toUpperCase();
    if (v === 'ALL' || v === 'PENDING' || v === 'SHIPPING') return v;
    return 'PENDING';
  };

  const [activeTab, setActiveTab] = useState<'ALL' | 'PENDING' | 'SHIPPING'>('PENDING');
  
  const [allOrders, setAllOrders] = useState<any[]>([]);
  const [pendingOrders, setPendingOrders] = useState<any[]>([]);
  const [shippingOrders, setShippingOrders] = useState<any[]>([]);
  const [actionLoading, setActionLoading] = useState(false);

  const [managerId, setManagerId] = useState('');
  const [shopId, setShopId] = useState(''); 

  const [verifyModal, setVerifyModal] = useState({
    isOpen: false,
    orderId: '',
    isApprove: true,
    reason: ''
  });

  const [contextLoading, setContextLoading] = useState(false);
  const [verificationContext, setVerificationContext] = useState<VerificationContextDTO | null>(null);
  const [riskAcknowledged, setRiskAcknowledged] = useState(false);

  // Initialize/sync active tab with query string (e.g. /manager/orders?tab=ALL)
  useEffect(() => {
    const syncFromUrl = () => {
      const params = new URLSearchParams(window.location.search);
      const next = coerceTab(params.get('tab'));
      setActiveTab((prev) => (prev === next ? prev : next));
    };

    syncFromUrl();
    window.addEventListener('popstate', syncFromUrl);
    return () => window.removeEventListener('popstate', syncFromUrl);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    const storedUserId = localStorage.getItem('userId');

    if (!token || !storedUserId) {
      router.push('/login');
      return;
    }

    if (!storedUserId.startsWith('SHOP_MNG')) {
      toast.error('Access Denied. Managers only.');
      router.push('/');
      return;
    }

    setManagerId(storedUserId);

    const fetchShopAndOrders = async () => {
      setLoading(true);
      try {
        const shopData = await loadManagedShops(storedUserId, 'MANAGER');
        if (shopData && shopData.length > 0) {
          const currentShopId = shopData[0].shopId;
          setShopId(currentShopId);
          await fetchOrders(activeTab, currentShopId);
        } else {
          toast.error("You don't have a shop yet. Please create one first.");
          setLoading(false);
        }
      } catch (err) {
        toast.error('Cannot connect to services');
        setLoading(false);
      }
    };

    fetchShopAndOrders();
  }, [activeTab]);

  const fetchOrders = async (tab: string, currentShopId: string) => {
    setLoading(true);
    try {
      let endpoint = '';
      if (tab === 'ALL') endpoint = `all`;
      else if (tab === 'PENDING') endpoint = `pending-verification`;
      else if (tab === 'SHIPPING') endpoint = `shipping`;

      const data = await apiGet<any[]>('order', `/api/manager/orders/shop/${currentShopId}/${endpoint}`, { withUserId: false });
      if (tab === 'ALL') setAllOrders(data);
      else if (tab === 'PENDING') setPendingOrders(data);
      else setShippingOrders(data);
    } catch (err) {
      toast.error('Cannot fetch orders');
    } finally {
      setLoading(false);
    }
  };

  const loadVerificationContext = async (orderId: string) => {
    setContextLoading(true);
    setVerificationContext(null);
    try {
      const ctx = await apiGet<VerificationContextDTO>(
        'order',
        `/api/manager/orders/${orderId}/verification-context`,
        { withUserId: false, headers: { managerId } }
      );
      setVerificationContext(ctx);
    } catch (e: any) {
      toast.error(e?.message || 'Failed to load verification context');
    } finally {
      setContextLoading(false);
    }
  };

  const getRiskBadgeClasses = (risk?: RiskLevel) => {
    const level = String(risk || '').toUpperCase();
    if (level === 'LOW') return 'bg-green-50 text-green-700 border-green-200';
    if (level === 'MEDIUM') return 'bg-orange-50 text-orange-700 border-orange-200';
    if (level === 'HIGH') return 'bg-red-50 text-red-700 border-red-200';
    return 'bg-slate-50 text-slate-700 border-slate-200';
  };

  const getRiskBarClasses = (risk?: RiskLevel) => {
    const level = String(risk || '').toUpperCase();
    if (level === 'LOW') return 'bg-green-500';
    if (level === 'MEDIUM') return 'bg-orange-500';
    if (level === 'HIGH') return 'bg-red-500';
    return 'bg-slate-400';
  };

  const handleVerifySubmit = async () => {
    if (!verifyModal.isApprove && !verifyModal.reason.trim()) {
      toast.error('Please provide a reason for rejection.');
      return;
    }

    const isHighRisk = String(verificationContext?.riskLevel || '').toUpperCase() === 'HIGH';
    const riskAckRequired = verifyModal.isApprove && isHighRisk;
    if (riskAckRequired && !riskAcknowledged) {
      toast.error('Please acknowledge the risk to approve this order.');
      return;
    }

    setActionLoading(true);
    try {
      await apiPut(
        'order',
        `/api/manager/orders/${verifyModal.orderId}/verify`,
        {
          managerId,
          approved: verifyModal.isApprove,
          reason: verifyModal.isApprove ? 'Approved by Manager' : verifyModal.reason,
          ...(riskAckRequired ? { riskAcknowledged: true } : {}),
        },
        { withUserId: false, headers: { managerId } }
      );

      toast.success(verifyModal.isApprove ? 'Order Approved!' : 'Order Rejected!');
      setVerifyModal({ ...verifyModal, isOpen: false, reason: '' });
      setVerificationContext(null);
      setRiskAcknowledged(false);
      fetchOrders(activeTab, shopId);
    } catch (err: any) {
      toast.error(err?.message || 'Server connection error');
    } finally {
      setActionLoading(false);
    }
  };

  const openVerifyModal = (orderId: string, isApprove: boolean) => {
    setVerifyModal({ isOpen: true, orderId, isApprove, reason: '' });
    setRiskAcknowledged(false);
    loadVerificationContext(orderId);
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'NEW': return 'bg-blue-100 text-blue-700';
      case 'PENDING_VERIFICATION': return 'bg-orange-100 text-orange-700';
      case 'PROCESSING': return 'bg-yellow-100 text-yellow-700';
      case 'SHIPPING': return 'bg-purple-100 text-purple-700';
      case 'DELIVERED': return 'bg-teal-100 text-teal-700';
      case 'COMPLETED': return 'bg-green-100 text-green-700';
      case 'CANCELLED': 
      case 'REJECTED': 
      case 'RETURNED': return 'bg-red-100 text-red-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const renderOrderCard = (order: any) => {
    const isPending = order.orderStatus === 'PENDING_VERIFICATION';
    
    return (
      <div key={order.orderId} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col lg:flex-row">
        <div className="p-6 lg:w-1/3 border-b lg:border-b-0 lg:border-r border-slate-100 bg-slate-50/30">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-sm font-black text-slate-900">#{order.orderId}</span>
            <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${getStatusColor(order.orderStatus)}`}>
              {order.orderStatus.replace('_', ' ')}
            </span>
          </div>
          <div className="space-y-1.5 text-sm font-medium text-slate-600">
            <p><span className="text-slate-400">Date:</span> {new Date(order.createdAt).toLocaleString()}</p>
            <p><span className="text-slate-400">Buyer:</span> {order.userId}</p>
            <p><span className="text-slate-400">Shop:</span> <span className="text-cyan-600 font-bold">{order.shopId}</span></p>
            <p className="mt-2 pt-2 border-t border-slate-200">
              <span className="text-slate-400 block mb-1">Total Value:</span>
              <span className="text-2xl font-black text-cyan-600">
                {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(order.grandTotal)}
              </span>
            </p>
          </div>
        </div>

        <div className="p-6 lg:w-1/3 border-b lg:border-b-0 lg:border-r border-slate-100">
          <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Order Items</h4>
          <div className="space-y-3">
            {order.orderItems?.slice(0, 3).map((item: any, idx: number) => {
              const img = item.productImage ? item.productImage.split('|')[0] : 'https://placehold.co/50x50';
              return (
                <div key={idx} className="flex items-center gap-3">
                  <img src={img} alt="" className="w-10 h-10 rounded-lg border border-slate-100 object-contain p-1" />
                  <div className="flex-1 min-w-0 text-sm">
                    <p className="font-bold text-slate-800 line-clamp-1">{item.productName}</p>
                    <p className="text-xs text-slate-500">Qty: {item.quantity}</p>
                  </div>
                </div>
              );
            })}
            {order.orderItems?.length > 3 && (
              <p className="text-xs font-bold text-slate-400 italic">+{order.orderItems.length - 3} more items...</p>
            )}
          </div>
        </div>

        <div className="p-6 lg:w-1/3 flex flex-col justify-center bg-slate-50/50">
          {isPending ? (
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 bg-orange-50 text-orange-700 rounded-xl mb-4 border border-orange-100 text-sm">
                <ShieldAlert className="w-5 h-5 shrink-0" />
                <p>This order requires manual verification before processing.</p>
              </div>
              <button 
                onClick={() => openVerifyModal(order.orderId, true)}
                className="w-full py-3 bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl shadow-md transition-colors flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-5 h-5" /> Approve Order
              </button>
              <button 
                onClick={() => openVerifyModal(order.orderId, false)}
                className="w-full py-3 bg-white border-2 border-red-100 hover:bg-red-50 text-red-500 font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <XCircle className="w-5 h-5" /> Reject Order
              </button>
            </div>
          ) : order.orderStatus === 'SHIPPING' ? (
            <div className="text-center space-y-4">
              <Truck className="w-12 h-12 text-purple-400 mx-auto opacity-50" />
              <div>
                <p className="text-sm font-bold text-slate-900">In Transit</p>
                <p className="text-xs text-slate-500 mt-1">Order has been handed over to the carrier.</p>
              </div>
              <button className="px-4 py-2 bg-white border border-slate-200 text-slate-600 hover:text-cyan-600 font-bold rounded-lg text-sm transition-colors w-full shadow-sm">
                View Tracking History
              </button>
            </div>
          ) : (
            <div className="text-center space-y-3">
              <Package className="w-12 h-12 text-slate-300 mx-auto" />
              <p className="text-sm font-bold text-slate-700">Managed by Vendor</p>
              <p className="text-xs text-slate-500">Currently in {order.orderStatus.replace('_', ' ').toLowerCase()} state.</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  const getRenderData = () => {
    if (activeTab === 'ALL') return allOrders;
    if (activeTab === 'PENDING') return pendingOrders;
    return shippingOrders;
  };

  const displayOrders = getRenderData();

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-12">
      <div className="bg-slate-900 border-b border-slate-800 sticky top-0 z-30">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link href="/seller" className="inline-flex items-center text-xs font-bold text-slate-400 hover:text-cyan-400 mb-4 transition-colors">
            <ChevronLeft className="w-4 h-4 mr-1" /> Back to Dashboard
          </Link>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-black text-white flex items-center gap-2">
                <ClipboardList className="w-6 h-6 text-cyan-400" /> Manager Verification Center
              </h1>
              <p className="text-sm font-medium text-slate-400 mt-1">Monitor high-value transactions and shipments.</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-slate-800 px-4 py-2 rounded-lg border border-slate-700 text-sm text-slate-300">
                Shop ID: <span className="font-bold text-white">{shopId || 'Loading...'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <div className="flex overflow-x-auto gap-6 border-b border-slate-200 mb-8 scrollbar-hide">
          <button
            onClick={() => setActiveTab('ALL')}
            className={`pb-4 px-2 text-sm font-bold border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'ALL' ? 'border-cyan-600 text-cyan-600' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ShoppingBag className="w-4 h-4" /> All Shop Orders
          </button>
          <button
            onClick={() => setActiveTab('PENDING')}
            className={`pb-4 px-2 text-sm font-bold border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'PENDING' ? 'border-cyan-600 text-cyan-600' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ShieldAlert className="w-4 h-4" /> Pending Verification
          </button>
          <button
            onClick={() => setActiveTab('SHIPPING')}
            className={`pb-4 px-2 text-sm font-bold border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'SHIPPING' ? 'border-cyan-600 text-cyan-600' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Truck className="w-4 h-4" /> Active Shipments
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-10 h-10 animate-spin text-cyan-600" /></div>
        ) : (
          <div className="space-y-6">
            {displayOrders.length === 0 && (
              <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-300">
                <CheckCircle2 className="w-16 h-16 text-green-400 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-bold text-slate-700">No Orders Found!</h3>
                <p className="text-slate-500">There are no orders in this category right now.</p>
              </div>
            )}

            {displayOrders.map(order => renderOrderCard(order))}
          </div>
        )}
      </div>

      {verifyModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className={`p-6 border-b border-slate-100 ${verifyModal.isApprove ? 'bg-green-50' : 'bg-red-50'}`}>
              <h3 className={`font-black flex items-center gap-2 ${verifyModal.isApprove ? 'text-green-700' : 'text-red-700'}`}>
                {verifyModal.isApprove ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                {verifyModal.isApprove ? 'Confirm Approval' : 'Reject Order'}
              </h3>
            </div>
            
            <div className="p-6">
              <p className="text-sm text-slate-600 mb-6">
                You are about to {verifyModal.isApprove ? 'approve' : 'reject'} order <span className="font-bold text-slate-900">#{verifyModal.orderId}</span>.
                {verifyModal.isApprove && " This will move the order to NEW status for the vendor to process."}
              </p>

              <div className="mb-6">
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Verification Context</p>
                {contextLoading ? (
                  <div className="flex items-center gap-2 text-slate-500 text-sm">
                    <Loader2 className="w-4 h-4 animate-spin" /> Loading context...
                  </div>
                ) : verificationContext ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 rounded-xl border border-slate-200 bg-slate-50">
                        <p className="text-[11px] font-black text-slate-400 uppercase tracking-wider">Payment Status</p>
                        <p className="text-sm font-bold text-slate-800 mt-1">{verificationContext.paymentStatus || 'N/A'}</p>
                      </div>
                      <div className="p-3 rounded-xl border border-slate-200 bg-slate-50">
                        <p className="text-[11px] font-black text-slate-400 uppercase tracking-wider">Payment Method</p>
                        <p className="text-sm font-bold text-slate-800 mt-1">{verificationContext.paymentMethod || 'N/A'}</p>
                      </div>
                      <div className="p-3 rounded-xl border border-slate-200 bg-white col-span-2 flex items-center justify-between gap-3">
                        <div>
                          <p className="text-[11px] font-black text-slate-400 uppercase tracking-wider">Risk Level</p>
                          <div className="mt-1 flex items-center gap-2">
                            <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${getRiskBadgeClasses(verificationContext.riskLevel)}`}>
                              {String(verificationContext.riskLevel || 'N/A')}
                            </span>
                            <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${getRiskBadgeClasses(verificationContext.paymentRiskLevel)}`}>
                              Payment: {String(verificationContext.paymentRiskLevel || 'N/A')}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-[11px] font-black text-slate-400 uppercase tracking-wider">Fraud Score</p>
                          <p className="text-lg font-black text-slate-900 mt-1">{typeof verificationContext.fraudScore === 'number' ? verificationContext.fraudScore : 'N/A'}</p>
                        </div>
                      </div>
                    </div>

                    {typeof verificationContext.fraudScore === 'number' && (
                      <div className="w-full">
                        <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className={`h-2 ${getRiskBarClasses(verificationContext.riskLevel)} rounded-full`}
                            style={{ width: `${Math.max(0, Math.min(100, verificationContext.fraudScore))}%` }}
                          />
                        </div>
                        <p className="text-xs text-slate-500 mt-2">Score range: 0 (low) → 100 (high)</p>
                      </div>
                    )}

                    {verificationContext.fraudSignals && (
                      <div className="p-4 rounded-2xl border border-slate-200 bg-white">
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Fraud Signals</p>
                        <div className="space-y-2 text-sm">
                          {(
                            [
                              { key: 'isNewAccount', label: 'New account' },
                              { key: 'recentOrderCount', label: 'Recent order count' },
                              { key: 'recentCancelCount', label: 'Recent cancel count' },
                              { key: 'hasDisputeHistory', label: 'Has dispute history' },
                              { key: 'addressMismatch', label: 'Address mismatch' },
                            ] as const
                          ).map(({ key, label }) => {
                            const val = (verificationContext.fraudSignals as any)[key];
                            if (val === undefined || val === null) return null;

                            const isBoolean = typeof val === 'boolean';
                            const isNumber = typeof val === 'number';
                            const risky =
                              (isBoolean && val === true) ||
                              (key === 'recentCancelCount' && isNumber && val > 0) ||
                              (key === 'addressMismatch' && isBoolean && val === true) ||
                              (key === 'hasDisputeHistory' && isBoolean && val === true) ||
                              (key === 'isNewAccount' && isBoolean && val === true);

                            return (
                              <div key={key} className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-2 min-w-0">
                                  {risky ? (
                                    <AlertTriangle className="w-4 h-4 text-orange-600 shrink-0" />
                                  ) : (
                                    <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                                  )}
                                  <span className="font-bold text-slate-700 truncate">{label}</span>
                                </div>
                                <span className={`text-xs font-black px-2 py-1 rounded-lg border ${risky ? 'bg-orange-50 text-orange-700 border-orange-200' : 'bg-green-50 text-green-700 border-green-200'}`}>
                                  {isBoolean ? (val ? 'YES' : 'NO') : String(val)}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {String(verificationContext.riskLevel || '').toUpperCase() === 'HIGH' && (
                      <div className="p-4 rounded-2xl border border-red-200 bg-red-50">
                        <div className="flex items-start gap-3">
                          <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                          <div>
                            <p className="font-black text-red-700">High risk order</p>
                            <p className="text-sm text-red-700/80 mt-1">Extra caution is required before approving.</p>
                          </div>
                        </div>
                        {verifyModal.isApprove && (
                          <label className="mt-4 flex items-start gap-3 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={riskAcknowledged}
                              onChange={(e) => setRiskAcknowledged(e.target.checked)}
                              className="mt-1 h-4 w-4 rounded border-slate-300 accent-red-600"
                            />
                            <span className="text-sm font-bold text-red-700">I acknowledge the risk</span>
                          </label>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-sm text-slate-500">No context available.</div>
                )}
              </div>

              {!verifyModal.isApprove && (
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Reason for Rejection <span className="text-red-500">*</span>
                  </label>
                  <textarea 
                    rows={3} 
                    placeholder="E.g., Suspected fraud, invalid address..."
                    value={verifyModal.reason} 
                    onChange={(e) => setVerifyModal({...verifyModal, reason: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-red-500 outline-none bg-slate-50 focus:bg-white text-sm"
                  />
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-3">
              <button 
                onClick={() => setVerifyModal({ ...verifyModal, isOpen: false })}
                className="flex-1 px-4 py-3 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleVerifySubmit}
                disabled={
                  actionLoading ||
                  (verifyModal.isApprove && String(verificationContext?.riskLevel || '').toUpperCase() === 'HIGH' && !riskAcknowledged)
                }
                className={`flex-1 px-4 py-3 text-white font-bold rounded-xl shadow-md transition-colors flex items-center justify-center gap-2 ${
                  verifyModal.isApprove ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'
                }`}
              >
                {actionLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Confirm Action'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}