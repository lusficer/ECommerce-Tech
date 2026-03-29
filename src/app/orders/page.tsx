// ===== src/app/orders/page.tsx =====
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShoppingBag, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

import { getAuth } from '@/lib/auth';
import { getFirstImage } from '@/lib/format';
import { apiGet, apiPost } from '@/lib/api';
import { getLatestDispute, getEffectiveOrderStatus } from '@/lib/disputeHelpers';
import LoadingScreen from '@/components/ui/LoadingScreen';
import Modal from '@/components/ui/Modal';
import OrderCard from '@/components/orders/OrderCard';
import ReviewModal from '@/components/orders/ReviewModal';
import DisputeModal from '@/components/orders/DisputeModal';
import DisputeStatus from '@/components/orders/DisputeStatus';

const ORDER_TABS = [
  { id: 'ALL',       label: 'All Orders', statuses: [] },
  { id: 'PENDING',   label: 'Pending',    statuses: ['NEW', 'PENDING_VERIFICATION', 'PROCESSING', 'READY_TO_SHIP'] },
  { id: 'SHIPPING',  label: 'Shipping',   statuses: ['SHIPPING'] },
  { id: 'COMPLETED', label: 'Completed',  statuses: ['DELIVERED', 'COMPLETED'] },
  { id: 'DISPUTED',  label: 'Disputed',   statuses: ['DISPUTED'] },
  { id: 'CANCELLED', label: 'Cancelled',  statuses: ['CANCELLED', 'REJECTED', 'RETURNED', 'DELIVERY_FAILED'] },
];

export default function OrdersPage() {
  const router = useRouter();

  const [orders, setOrders]           = useState<any[]>([]);
  const [loading, setLoading]         = useState(true);
  const [shopNames, setShopNames]     = useState<Record<string, string>>({});
  const [activeTab, setActiveTab]     = useState('ALL');
  const [visibleCount, setVisibleCount] = useState(4);

  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [cancelModal, setCancelModal] = useState({ isOpen: false, orderId: '' });

  const [reviewTarget, setReviewTarget] = useState<any>(null);
  const [disputeTarget, setDisputeTarget] = useState<any>(null);
  const [viewDisputeTarget, setViewDisputeTarget] = useState<any>(null);

  // ─── Fetch ───────────────────────────────────────────────────────────────────
  const fetchOrderHistory = async () => {
    const { token, userId } = getAuth();
    if (!token || !userId) {
      toast.error('Please login to view your orders');
      router.push('/login');
      return;
    }

    try {
      const res = await fetch('http://localhost:8086/api/user/orders/history', {
        headers: { Authorization: `Bearer ${token}`, userId },
      });

      if (res.ok) {
        const data = await res.json();

        let disputesByOrderId: Record<string, any[]> = {};
        try {
          const disputes = await apiGet<any[]>('dispute', '/api/user/disputes', {
            userIdHeader: 'X-User-Id',
          });

          disputesByOrderId = (disputes || []).reduce((accumulator: Record<string, any[]>, dispute: any) => {
            const orderDisputes = accumulator[dispute.orderId] || [];
            accumulator[dispute.orderId] = [...orderDisputes, dispute];
            return accumulator;
          }, {});
        } catch {
          disputesByOrderId = {};
        }

        const orderWithDisputes = data.map((order: any) => {
          const disputes = disputesByOrderId[order.orderId] || [];
          const latestDispute = getLatestDispute(disputes);
          return {
            ...order,
            disputes,
            latestDispute,
            disputeStatus: latestDispute?.status,
          };
        });

        setOrders(orderWithDisputes);

        // Fetch shop names in parallel
        const uniqueIds = Array.from(new Set<string>(data.map((o: any) => o.shopId)));
        const map: Record<string, string> = {};
        await Promise.all(
          uniqueIds.map(async (id) => {
            try {
              const r = await fetch(`http://localhost:8082/api/shops/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
              });
              map[id] = r.ok ? (await r.json()).shopName ?? id : id;
            } catch { map[id] = id; }
          })
        );
        setShopNames(map);
      } else {
        toast.error('Failed to load order history');
      }
    } catch {
      toast.error('Cannot connect to server!');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrderHistory(); }, []);

  // ─── Actions ─────────────────────────────────────────────────────────────────
  const handleConfirmReceipt = async (orderId: string) => {
    setActionLoadingId(orderId);
    const { token, userId } = getAuth();
    try {
      const res = await fetch(`http://localhost:8086/api/user/orders/${orderId}/complete`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, userId: userId || '' },
      });
      if (res.ok) { toast.success('Thank you! Order has been completed.'); fetchOrderHistory(); }
      else { const e = await res.json(); toast.error(e.message || 'Cannot complete order.'); }
    } catch { toast.error('Server connection error.'); }
    finally { setActionLoadingId(null); }
  };

  const executeCancelOrder = async () => {
    const { orderId } = cancelModal;
    setCancelModal({ isOpen: false, orderId: '' });
    setActionLoadingId(orderId);
    const { token, userId } = getAuth();
    try {
      const res = await fetch(`http://localhost:8086/api/user/orders/${orderId}/cancel`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, userId: userId || '' },
      });
      if (res.ok) { toast.success('Order has been cancelled successfully.'); fetchOrderHistory(); }
      else { const e = await res.json(); toast.error(e.message || 'Cannot cancel order.'); }
    } catch { toast.error('Server connection error.'); }
    finally { setActionLoadingId(null); }
  };

  // ─── Derived state ────────────────────────────────────────────────────────────
  const filteredOrders = orders.filter((o) => {
    if (activeTab === 'ALL') return true;
    if (activeTab === 'DISPUTED') return Boolean(o.latestDispute);

    const effectiveStatus = getEffectiveOrderStatus(o.orderStatus, o.disputeStatus);
    return ORDER_TABS.find((t) => t.id === activeTab)?.statuses.includes(effectiveStatus) ?? false;
  });
  const visibleOrders = filteredOrders.slice(0, visibleCount);

  const openReviewModal = (order: any, item: any) =>
    setReviewTarget({
      orderId: order.orderId,
      productId: item.productId,
      productName: item.productName,
      productImage: getFirstImage(item.productImage, 'https://placehold.co/100x100?text=No+Image'),
    });

  const submitDispute = async (payload: { reason: string; description: string; images: string[] }) => {
    if (!disputeTarget) return;
    try {
      await apiPost(
        'dispute',
        '/api/user/disputes',
        {
          orderId: disputeTarget.orderId,
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
          headers: { 'X-Shop-Id': disputeTarget.shopId || '' },
        }
      );
      toast.success('Dispute submitted successfully.');
      setDisputeTarget(null);
      await fetchOrderHistory();
    } catch (error: any) {
      toast.error(error?.message || 'Failed to submit dispute.');
      throw error;
    }
  };

  // ─── Render ──────────────────────────────────────────────────────────────────
  if (loading) return <LoadingScreen />;

  return (
    <div className="min-h-screen bg-slate-50 py-8 font-sans relative">
      <div className="max-w-[1000px] mx-auto px-4 sm:px-6 lg:px-8">

        <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-6">My Orders</h1>

        {/* Tab bar */}
        <div className="bg-white border-b border-slate-200 sticky top-16 z-30 mb-6 shadow-sm">
          <div className="flex overflow-x-auto">
            {ORDER_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); setVisibleCount(4); }}
                className={`flex-1 min-w-[120px] py-4 px-2 text-sm font-bold text-center transition-all whitespace-nowrap border-b-2
                  ${activeTab === tab.id ? 'border-cyan-600 text-cyan-600' : 'border-transparent text-slate-500 hover:text-cyan-600'}`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Empty state */}
        {filteredOrders.length === 0 ? (
          <div className="bg-white rounded-2xl py-16 flex flex-col items-center justify-center border border-slate-200 shadow-sm">
            <ShoppingBag className="w-16 h-16 text-slate-300 mb-4" />
            <h2 className="text-xl font-black text-slate-800 mb-2">No Orders Found</h2>
            <p className="text-slate-500 text-sm mb-6">You don't have any orders in this status.</p>
            <Link href="/products" className="px-6 py-2.5 bg-cyan-600 text-white font-bold rounded-lg hover:bg-cyan-700 transition-colors">
              Continue Shopping
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {visibleOrders.map((order) => (
              <OrderCard
                key={order.orderId}
                order={order}
                shopName={shopNames[order.shopId] || 'Loading...'}
                isActionLoading={actionLoadingId === order.orderId}
                onCancel={(id) => setCancelModal({ isOpen: true, orderId: id })}
                onConfirmReceipt={handleConfirmReceipt}
                onReview={openReviewModal}
                onDispute={(selectedOrder, mode) => {
                  if (mode === 'view') {
                    setViewDisputeTarget(selectedOrder.latestDispute || null);
                    return;
                  }
                  setDisputeTarget(selectedOrder);
                }}
              />
            ))}

            {visibleCount < filteredOrders.length && (
              <div className="flex justify-center pt-4 pb-8">
                <button
                  onClick={() => setVisibleCount((p) => p + 4)}
                  className="px-8 py-3 bg-white border border-cyan-200 text-cyan-700 font-bold rounded-full shadow-sm hover:bg-cyan-50 hover:border-cyan-300 transition-all"
                >
                  Load More Orders
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Cancel modal — uses shared Modal component */}
      <Modal
        isOpen={cancelModal.isOpen}
        onClose={() => setCancelModal({ isOpen: false, orderId: '' })}
        title="Cancel Order"
        titleIcon={<AlertTriangle className="w-5 h-5 text-red-500" />}
        headerClassName="bg-red-50"
        maxWidth="max-w-sm"
        footer={
          <>
            <button
              onClick={() => setCancelModal({ isOpen: false, orderId: '' })}
              className="flex-1 px-4 py-3 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold rounded-xl transition-colors"
            >
              Keep Order
            </button>
            <button
              onClick={executeCancelOrder}
              className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-md transition-colors"
            >
              Yes, Cancel
            </button>
          </>
        }
      >
        <p className="text-sm text-slate-700 mb-2">
          Are you sure you want to cancel order{' '}
          <span className="font-bold text-slate-900">#{cancelModal.orderId}</span>?
        </p>
        <p className="text-xs text-slate-500">
          This action cannot be undone. If you applied any discount codes, they might not be returned.
        </p>
      </Modal>

      {/* Review modal */}
      {reviewTarget && (
        <ReviewModal
          target={reviewTarget}
          onClose={() => setReviewTarget(null)}
        />
      )}

      {disputeTarget && (
        <DisputeModal
          isOpen={Boolean(disputeTarget)}
          orderId={disputeTarget.orderId}
          onClose={() => setDisputeTarget(null)}
          onSubmit={submitDispute}
        />
      )}

      <Modal
        isOpen={Boolean(viewDisputeTarget)}
        onClose={() => setViewDisputeTarget(null)}
        title="Dispute Details"
        headerClassName="bg-orange-50"
        maxWidth="max-w-lg"
      >
        {viewDisputeTarget && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-black text-slate-900">Dispute #{viewDisputeTarget.disputeId}</p>
              <DisputeStatus status={viewDisputeTarget.status} />
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase">Order</p>
                <p className="font-bold text-slate-800">#{viewDisputeTarget.orderId}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase">Created</p>
                <p className="font-bold text-slate-800">
                  {new Date(viewDisputeTarget.createdAt).toLocaleString('en-US', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}
                </p>
              </div>
            </div>

            <div>
              <p className="text-xs font-bold text-slate-400 uppercase mb-1">Reason</p>
              <p className="text-sm font-bold text-slate-800">{String(viewDisputeTarget.reason || '').replace(/_/g, ' ')}</p>
            </div>

            <div>
              <p className="text-xs font-bold text-slate-400 uppercase mb-1">Description</p>
              <p className="text-sm text-slate-700 bg-slate-50 border border-slate-200 rounded-xl p-3">
                {viewDisputeTarget.description || 'No description'}
              </p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
