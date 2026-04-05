'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { apiGet, apiPut, getUserFacingErrorMessage, isApiError } from '@/lib/api';
import { logout } from '@/lib/auth';
import { 
  Package, Truck, Clock, 
  Search, Filter, Loader2, Store, ChevronRight, ChevronDown,
  X, MapPin, User, Phone, Receipt
} from 'lucide-react';

const TABS = [
  { id: 'ALL', label: 'All Orders' },
  { id: 'NEW', label: 'New' },
  { id: 'PROCESSING', label: 'Processing' },
  { id: 'SHIPPING', label: 'Shipping' },
  { id: 'DELIVERED', label: 'Delivered' },
  { id: 'COMPLETED', label: 'Completed' },
  { id: 'CANCELLED', label: 'Cancelled' },
  { id: 'RETURNED', label: 'Returned' }
];

export default function VendorOrdersPage() {
  const router = useRouter();
  
  const [assignedShops, setAssignedShops] = useState<any[]>([]);
  const [selectedShopId, setSelectedShopId] = useState<string>('');
  const [isFetchingShops, setIsFetchingShops] = useState(true);

  const [orders, setOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [activeTab, setActiveTab] = useState('ALL');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const [detailModal, setDetailModal] = useState<{isOpen: boolean, order: any}>({
    isOpen: false,
    order: null
  });

  const vendorId = typeof window !== 'undefined' ? localStorage.getItem('userId') || '' : '';

  useEffect(() => {
    const fetchMyShops = async () => {
      const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      try {
        const data = await apiGet<any[]>('shop', `/api/shops/my-assigned-shops`, {
          withAuth: true,
          withUserId: true,
        });
        setAssignedShops(data);
        if (data.length > 0) {
          setSelectedShopId(data[0].shopId);
        } else {
          toast.error('You have not been assigned to manage any shops.');
        }
      } catch (err) {
        if (isApiError(err) && (err.status === 401 || err.status === 403)) {
          logout();
          toast.error('Your session has expired. Please sign in again.');
          router.push('/login');
          return;
        }
        console.error('Error fetching shop list:', err);
        toast.error(getUserFacingErrorMessage(err, { defaultMessage: 'Failed to load assigned shops.' }));
      } finally {
        setIsFetchingShops(false);
      }
    };

    fetchMyShops();
  }, [vendorId, router]);

  useEffect(() => {
    if (selectedShopId) {
      fetchVendorOrders(selectedShopId, activeTab);
    }
  }, [selectedShopId, activeTab]);

  const fetchVendorOrders = async (shopId: string, tab: string) => {
    setLoadingOrders(true);
    try {
      const qs = tab !== 'ALL' ? `?status=${encodeURIComponent(tab)}` : '';
      const data = await apiGet<any[]>(
        'order',
        `/api/vendor/orders/${encodeURIComponent(shopId)}${qs}`,
        { userIdHeader: 'Vendor_Id' }
      );
      setOrders(data);
    } catch (err) {
      if (isApiError(err) && (err.status === 401 || err.status === 403)) {
        logout();
        toast.error('Your session has expired. Please sign in again.');
        router.push('/login');
        return;
      }
      console.error('Error fetching vendor orders:', err);
      toast.error(getUserFacingErrorMessage(err, { defaultMessage: 'Failed to fetch order list.' }));
    } finally {
      setLoadingOrders(false);
    }
  };

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    setUpdatingId(orderId);

    try {
      await apiPut(
        'order',
        `/api/vendor/orders/${encodeURIComponent(orderId)}/status`,
        { shopId: selectedShopId, newStatus },
        { userIdHeader: 'Vendor_Id' }
      );
      toast.success(`Successfully updated order to ${newStatus.replace(/_/g, ' ')}!`);
      fetchVendorOrders(selectedShopId, activeTab);
    } catch (err) {
      if (isApiError(err) && (err.status === 401 || err.status === 403)) {
        logout();
        toast.error('Your session has expired. Please sign in again.');
        router.push('/login');
        return;
      }
      toast.error(getUserFacingErrorMessage(err, { defaultMessage: 'Failed to update status.' }));
    } finally {
      setUpdatingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'NEW': return { color: 'bg-blue-50 text-blue-600', label: 'New Order' };
      case 'PENDING_VERIFICATION': return { color: 'bg-orange-50 text-orange-600', label: 'Awaiting Manager' };
      case 'PROCESSING': return { color: 'bg-yellow-50 text-yellow-600', label: 'Processing' };
      case 'SHIPPING': return { color: 'bg-purple-50 text-purple-600', label: 'Shipping' };
      case 'DELIVERED': return { color: 'bg-green-50 text-green-600', label: 'Delivered' };
      case 'COMPLETED': return { color: 'bg-teal-50 text-teal-600', label: 'Completed' };
      case 'CANCELLED': return { color: 'bg-red-50 text-red-600', label: 'Cancelled' };
      case 'REJECTED': return { color: 'bg-red-50 text-red-800', label: 'Rejected' };
      case 'RETURNED': return { color: 'bg-gray-50 text-gray-600', label: 'Returned' };
      default: return { color: 'bg-slate-50 text-slate-600', label: status };
    }
  };

  if (isFetchingShops) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 className="w-10 h-10 animate-spin text-cyan-600" /></div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-12 relative">
      <div className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-cyan-50 rounded-xl flex items-center justify-center shrink-0">
                <Store className="w-6 h-6 text-cyan-600" />
              </div>
              <div>
                <h1 className="text-xl font-black text-slate-900 leading-tight">Order Management</h1>
                {assignedShops.length > 0 ? (
                  <div className="relative mt-1">
                    <select 
                      value={selectedShopId}
                      onChange={(e) => setSelectedShopId(e.target.value)}
                      className="appearance-none bg-slate-100 border border-slate-200 text-slate-700 text-sm font-bold py-1 pl-3 pr-8 rounded-lg outline-none focus:ring-2 focus:ring-cyan-500 cursor-pointer"
                    >
                      {assignedShops.map(shop => (
                        <option key={shop.shopId} value={shop.shopId}>
                          {shop.shopName} ({shop.shopId})
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-4 h-4 text-slate-500 absolute right-2 top-1.5 pointer-events-none" />
                  </div>
                ) : (
                  <p className="text-xs text-red-500 font-bold mt-1">No shop assigned</p>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="relative">
                <input 
                  type="text" placeholder="Search order ID..." 
                  className="pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:border-cyan-500 focus:ring-1 outline-none w-full sm:w-64"
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
              <button className="p-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors">
                <Filter className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex overflow-x-auto scrollbar-hide gap-1 pb-px">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-3 text-sm font-bold whitespace-nowrap border-b-2 transition-colors ${
                  activeTab === tab.id 
                    ? 'border-cyan-600 text-cyan-600' 
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        {!selectedShopId ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
            <Store className="w-16 h-16 text-slate-200 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-900">Please contact your Manager</h3>
            <p className="text-slate-500">You need to be assigned to a Shop to process orders.</p>
          </div>
        ) : loadingOrders ? (
          <div className="flex justify-center items-center py-20"><Loader2 className="w-8 h-8 animate-spin text-cyan-600" /></div>
        ) : orders.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center flex flex-col items-center justify-center">
            <Package className="w-16 h-16 text-slate-200 mb-4" />
            <h3 className="text-xl font-bold text-slate-900 mb-2">No orders found</h3>
            <p className="text-slate-500">This shop has no orders in this status.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const badge = getStatusBadge(order.orderStatus);
              const isUpdating = updatingId === order.orderId;
              
              return (
                <div key={order.orderId} className={`bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden transition-opacity ${isUpdating ? 'opacity-50 pointer-events-none' : ''}`}>
                  
                  <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <span className="text-sm font-black text-slate-900">#{order.orderId}</span>
                      <span className="text-xs font-medium text-slate-500">
                        {new Date(order.createdAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
                      </span>
                      <span className={`px-2.5 py-1 rounded-md text-xs font-bold ${badge.color}`}>
                        {badge.label}
                      </span>
                    </div>
                    <div className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      Buyer: <span className="text-cyan-600">{order.orderAddress?.fullName || 'Customer'}</span>
                    </div>
                  </div>

                  <div className="p-6 flex flex-col lg:flex-row gap-6 items-start justify-between">
                    
                    <div className="flex-1 space-y-3 w-full">
                      {order.orderItems?.map((item: any, idx: number) => {
                        const img = item.productImage ? item.productImage.split('|')[0] : 'https://placehold.co/50x50';
                        return (
                          <div key={idx} className="flex items-center gap-4">
                            <img src={img} alt={item.productName} className="w-12 h-12 rounded-lg border border-slate-100 object-contain p-1" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold text-slate-800 line-clamp-1">{item.productName}</p>
                              <p className="text-xs text-slate-500">Qty: {item.quantity}</p>
                            </div>
                            <div className="text-sm font-black text-slate-900">
                              {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(item.totalPrice)}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="w-full lg:w-72 shrink-0 border-t lg:border-t-0 lg:border-l border-slate-100 pt-4 lg:pt-0 lg:pl-6 flex flex-col justify-between">
                      <div className="mb-4">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Order Total</p>
                        <p className="text-2xl font-black text-cyan-600">
                          {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(order.grandTotal)}
                        </p>
                      </div>

                      <div className="space-y-2">
                        {order.orderStatus === 'NEW' && (
                          <button onClick={() => handleUpdateStatus(order.orderId, 'PROCESSING')} className="w-full py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white font-bold rounded-xl shadow-sm transition-colors text-sm flex items-center justify-center gap-2">
                            <Package className="w-4 h-4" /> Accept & Process
                          </button>
                        )}
                        {order.orderStatus === 'PROCESSING' && (
                          <button onClick={() => handleUpdateStatus(order.orderId, 'SHIPPING')} className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-sm transition-colors text-sm flex items-center justify-center gap-2">
                            <Truck className="w-4 h-4" /> Handover to Shipper
                          </button>
                        )}
                        {order.orderStatus === 'PENDING_VERIFICATION' && (
                          <div className="w-full py-2.5 bg-orange-50 text-orange-600 font-bold rounded-xl text-sm flex items-center justify-center gap-2 border border-orange-200 cursor-not-allowed">
                            <Clock className="w-4 h-4" /> Awaiting Manager Approval
                          </div>
                        )}
                        
                        <button 
                          onClick={() => setDetailModal({ isOpen: true, order: order })} 
                          className="w-full py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold rounded-xl border border-slate-200 transition-colors text-sm flex items-center justify-center gap-2"
                        >
                          View Details <ChevronRight className="w-4 h-4" />
                        </button>

                      </div>
                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {detailModal.isOpen && detailModal.order && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            
            <div className="flex justify-between items-center p-5 md:p-6 border-b border-slate-100 bg-slate-50 shrink-0">
              <h3 className="font-black text-slate-800 flex items-center gap-2 text-lg">
                <Receipt className="w-5 h-5 text-cyan-600" /> Order Details
              </h3>
              <button 
                onClick={() => setDetailModal({ isOpen: false, order: null })}
                className="text-slate-400 hover:text-slate-700 hover:bg-slate-200 p-1.5 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-5 md:p-8 overflow-y-auto bg-white space-y-8">
              
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-slate-50 p-5 rounded-2xl border border-slate-100">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Order ID</p>
                  <p className="text-xl font-black text-slate-900">#{detailModal.order.orderId}</p>
                </div>
                <div className={`px-5 py-2.5 rounded-xl text-sm font-bold w-fit shadow-sm ${getStatusBadge(detailModal.order.orderStatus).color}`}>
                  {getStatusBadge(detailModal.order.orderStatus).label}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                <div className="p-5 border border-slate-100 bg-slate-50/50 rounded-2xl">
                  <h4 className="text-sm font-black text-slate-900 mb-4 flex items-center gap-2">
                    <User className="w-5 h-5 text-cyan-600" /> Customer Information
                  </h4>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between items-start border-b border-slate-100 pb-3">
                      <span className="text-slate-500 font-medium">Full Name:</span>
                      <span className="font-bold text-slate-900 text-right">{detailModal.order.orderAddress?.fullName || detailModal.order.userId}</span>
                    </div>
                    <div className="flex justify-between items-start border-b border-slate-100 pb-3">
                      <span className="text-slate-500 font-medium">Phone Number:</span>
                      <span className="font-bold text-slate-900 text-right">{detailModal.order.orderAddress?.phone || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                <div className="p-5 border border-slate-100 bg-slate-50/50 rounded-2xl">
                  <h4 className="text-sm font-black text-slate-900 mb-4 flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-cyan-600" /> Delivery Address
                  </h4>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between items-start border-b border-slate-100 pb-3">
                      <span className="text-slate-500 font-medium whitespace-nowrap mr-4">Street / Building:</span>
                      <span className="font-bold text-slate-900 text-right">{detailModal.order.orderAddress?.addressLine || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between items-start border-b border-slate-100 pb-3">
                      <span className="text-slate-500 font-medium whitespace-nowrap mr-4">Ward / District:</span>
                      <span className="font-bold text-slate-900 text-right">{detailModal.order.orderAddress?.ward}, {detailModal.order.orderAddress?.district}</span>
                    </div>
                    <div className="flex justify-between items-start pt-1">
                      <span className="text-slate-500 font-medium whitespace-nowrap mr-4">City / Province:</span>
                      <span className="font-bold text-slate-900 text-right">{detailModal.order.orderAddress?.city || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-black text-slate-900 mb-4 flex items-center gap-2">
                  <Package className="w-5 h-5 text-cyan-600" /> Order Items ({detailModal.order.orderItems?.length || 0})
                </h4>
                <div className="space-y-3">
                  {detailModal.order.orderItems?.map((item: any, idx: number) => {
                    const img = item.productImage ? item.productImage.split('|')[0] : 'https://placehold.co/80x80';
                    return (
                      <div key={idx} className="flex gap-4 items-center p-4 border border-slate-100 rounded-xl bg-white hover:border-cyan-200 transition-colors shadow-sm">
                        <img src={img} alt={item.productName} className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl border border-slate-200 bg-white object-contain p-1.5 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm sm:text-base font-bold text-slate-800 line-clamp-2">{item.productName}</p>
                          <p className="text-xs sm:text-sm text-slate-500 mt-1.5">Quantity: <span className="font-bold text-slate-700">{item.quantity}</span></p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-xs sm:text-sm text-slate-400 line-through mb-0.5">
                            {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(item.unitPrice)}
                          </p>
                          <p className="text-base sm:text-lg font-black text-cyan-600">
                            {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(item.totalPrice)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="border-t border-slate-100 pt-6 flex flex-col items-end space-y-3">
                 <div className="flex justify-between w-full md:w-1/2 text-sm text-slate-500 px-4">
                   <span>Subtotal</span>
                   <span className="font-bold text-slate-700">{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(detailModal.order.subTotal || detailModal.order.grandTotal)}</span>
                 </div>
                 <div className="flex justify-between w-full md:w-1/2 text-lg sm:text-xl pt-4 border-t border-slate-100 px-4">
                   <span className="font-black text-slate-900">Grand Total</span>
                   <span className="font-black text-cyan-600 text-2xl">{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(detailModal.order.grandTotal)}</span>
                 </div>
              </div>

            </div>

            <div className="p-5 bg-slate-50 border-t border-slate-100 flex justify-end shrink-0">
              <button 
                onClick={() => setDetailModal({ isOpen: false, order: null })}
                className="px-8 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition-all shadow-md hover:-translate-y-0.5"
              >
                Close Details
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}