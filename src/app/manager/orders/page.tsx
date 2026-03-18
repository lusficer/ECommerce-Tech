'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { 
  ClipboardList, Truck, CheckCircle2, XCircle, 
  Search, Loader2, AlertTriangle, Package, ChevronLeft, ShieldAlert,
  ShoppingBag
} from 'lucide-react';

export default function ManagerOrdersPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  
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
        const shopRes = await fetch(`http://localhost:8082/api/shops/owner/${storedUserId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (shopRes.ok) {
          const shopData = await shopRes.json();
          if (shopData && shopData.length > 0) {
            const currentShopId = shopData[0].shopId;
            setShopId(currentShopId);
            await fetchOrders(activeTab, currentShopId, token);
          } else {
            toast.error("You don't have a shop yet. Please create one first.");
            setLoading(false);
          }
        }
      } catch (err) {
        toast.error('Cannot connect to services');
        setLoading(false);
      }
    };

    fetchShopAndOrders();
  }, [activeTab]);

  const fetchOrders = async (tab: string, currentShopId: string, token: string) => {
    setLoading(true);
    try {
      let endpoint = '';
      if (tab === 'ALL') endpoint = `all`;
      else if (tab === 'PENDING') endpoint = `pending-verification`;
      else if (tab === 'SHIPPING') endpoint = `shipping`;

      const res = await fetch(`http://localhost:8086/api/manager/orders/shop/${currentShopId}/${endpoint}`, {
        headers: { 
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (res.ok) {
        const data = await res.json();
        if (tab === 'ALL') setAllOrders(data);
        else if (tab === 'PENDING') setPendingOrders(data);
        else setShippingOrders(data);
      }
    } catch (err) {
      toast.error('Cannot fetch orders');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifySubmit = async () => {
    if (!verifyModal.isApprove && !verifyModal.reason.trim()) {
      toast.error('Please provide a reason for rejection.');
      return;
    }

    setActionLoading(true);
    const token = localStorage.getItem('accessToken');

    try {
      const res = await fetch(`http://localhost:8086/api/manager/orders/${verifyModal.orderId}/verify`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'managerId': managerId
        },
        body: JSON.stringify({
          managerId: managerId,
          approved: verifyModal.isApprove,
          reason: verifyModal.isApprove ? 'Approved by Manager' : verifyModal.reason
        })
      });

      if (res.ok) {
        toast.success(verifyModal.isApprove ? 'Order Approved!' : 'Order Rejected!');
        setVerifyModal({ ...verifyModal, isOpen: false, reason: '' });
        fetchOrders(activeTab, shopId, token!); 
      } else {
        const err = await res.json();
        toast.error(err.message || 'Verification failed');
      }
    } catch (err) {
      toast.error('Server connection error');
    } finally {
      setActionLoading(false);
    }
  };

  const openVerifyModal = (orderId: string, isApprove: boolean) => {
    setVerifyModal({ isOpen: true, orderId, isApprove, reason: '' });
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

  // Render danh sách đơn hàng
  const renderOrderCard = (order: any) => {
    const isPending = order.orderStatus === 'PENDING_VERIFICATION';
    
    return (
      <div key={order.orderId} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col lg:flex-row">
        {/* Header Info */}
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

        {/* Items Preview */}
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

        {/* Actions / Tracking Info */}
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
                disabled={actionLoading}
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