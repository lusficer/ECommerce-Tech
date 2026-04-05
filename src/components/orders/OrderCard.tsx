'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Store, Clock, Package, Truck, CheckCircle2, XCircle, Loader2, Star, Scale,
} from 'lucide-react';
import { formatCurrency, getFirstImage } from '@/lib/format';
import DisputeStatus from '@/components/orders/DisputeStatus';
import { canFileDispute, getEffectiveOrderStatus } from '@/lib/disputeHelpers';

interface OrderCardProps {
  order: any;
  shopName: string;
  isActionLoading: boolean;
  onCancel: (orderId: string) => void;
  onConfirmReceipt: (orderId: string) => void;
  onReview: (order: any, item: any) => void;
  onDispute: (order: any, mode: 'create' | 'view') => void;
}

function getStatusInfo(status: string) {
  switch (status) {
    case 'NEW':
    case 'PENDING_VERIFICATION':
      return { color: 'text-blue-600', icon: Clock, label: 'Pending' };
    case 'PROCESSING':
    case 'READY_TO_SHIP':
      return { color: 'text-yellow-600', icon: Package, label: 'Processing' };
    case 'SHIPPING':
      return { color: 'text-purple-600', icon: Truck, label: 'Shipping' };
    case 'DELIVERED':
      return { color: 'text-green-600', icon: CheckCircle2, label: 'Delivered' };
    case 'COMPLETED':
      return { color: 'text-teal-600', icon: CheckCircle2, label: 'Complete' };
    case 'DISPUTED':
      return { color: 'text-orange-600', icon: Scale, label: 'Disputed' };
    case 'CANCELLED':
    case 'REJECTED':
    case 'RETURNED':
    case 'DELIVERY_FAILED':
      return { color: 'text-red-600', icon: XCircle, label: 'Cancelled' };
    default:
      return { color: 'text-slate-600', icon: Package, label: status };
  }
}

export default function OrderCard({
  order, shopName, isActionLoading, onCancel, onConfirmReceipt, onReview, onDispute,
}: OrderCardProps) {
  const router = useRouter();
  const effectiveStatus = getEffectiveOrderStatus(order.orderStatus, order.disputeStatus);
  const statusInfo = getStatusInfo(effectiveStatus);
  const StatusIcon = statusInfo.icon;
  const canCancel = ['NEW', 'PENDING_VERIFICATION'].includes(order.orderStatus);
  const canConfirm = order.orderStatus === 'DELIVERED';
  const canReview  = ['DELIVERED', 'COMPLETE', 'COMPLETED'].includes(order.orderStatus);
  const hasDispute = Boolean(order.latestDispute);
  const canDispute = canFileDispute(order.orderStatus, order.latestDispute);

  return (
    <div className={`bg-white border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow ${isActionLoading ? 'opacity-50 pointer-events-none' : ''}`}>
      <div className="px-6 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
        <div className="flex items-center gap-2">
          <Store className="w-4 h-4 text-slate-600" />
          <span className="text-sm font-black text-slate-900">{shopName}</span>
          <Link
            href={`/seller/${order.shopId}`}
            className="hidden sm:inline-flex px-2 py-0.5 bg-slate-200 text-slate-700 text-[10px] font-bold uppercase rounded hover:bg-slate-300 transition-colors"
          >
            View Shop
          </Link>
        </div>
        <span className={`flex items-center gap-1.5 text-sm font-bold uppercase ${statusInfo.color}`}>
          <StatusIcon className="w-4 h-4" /> {statusInfo.label}
        </span>
      </div>

      {order.disputeStatus && (
        <div className="px-6 pt-3">
          <DisputeStatus status={order.disputeStatus} />
        </div>
      )}

      <div className="p-6 cursor-pointer" onClick={() => router.push(`/orders/${order.orderId}`)}>
        <div className="space-y-4">
          {order.orderItems?.slice(0, 2).map((item: any, idx: number) => (
            <div key={idx} className="flex items-start gap-4">
              <div className="w-20 h-20 bg-slate-50 border border-slate-100 flex items-center justify-center p-2 shrink-0">
                <img
                  src={getFirstImage(item.productImage, 'https://placehold.co/100x100?text=No+Image')}
                  alt={item.productName}
                  className="w-full h-full object-contain mix-blend-multiply"
                />
              </div>
              <div className="flex-1 min-w-0 flex flex-col sm:flex-row justify-between">
                <div className="pr-4">
                  <p className="text-base font-bold text-slate-900 line-clamp-2">{item.productName}</p>
                  <p className="text-sm font-medium text-slate-500 mt-1">x{item.quantity}</p>
                </div>
                <div className="mt-2 sm:mt-0 text-left sm:text-right shrink-0">
                  <span className="text-base font-black text-cyan-600">
                    {formatCurrency(item.unitPrice)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
        {order.orderItems?.length > 2 && (
          <p className="mt-4 text-sm font-medium text-slate-500 border-t border-dashed border-slate-200 pt-3">
            View {order.orderItems.length - 2} more product(s)
          </p>
        )}
      </div>

      <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-end sm:items-center justify-between gap-4">
        <div className="flex items-center justify-end gap-2">
          <span className="text-sm text-slate-600 font-medium">Order Total:</span>
          <span className="text-xl font-black text-cyan-600">
            {formatCurrency(order.grandTotal)}
          </span>
        </div>

        <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3 w-full sm:w-auto">
          {canCancel && (
            <button
              onClick={() => onCancel(order.orderId)}
              disabled={isActionLoading}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-white border border-red-200 text-red-500 hover:bg-red-50 font-bold text-sm rounded-sm transition-colors disabled:opacity-50"
            >
              {isActionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
              Cancel
            </button>
          )}
          {canConfirm && (
            <button
              onClick={() => onConfirmReceipt(order.orderId)}
              disabled={isActionLoading}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-green-500 hover:bg-green-600 text-white font-bold text-sm rounded-sm shadow-sm transition-colors disabled:opacity-50"
            >
              {isActionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              Confirm Receipt
            </button>
          )}
          {canReview && (
            <button
              onClick={() => onReview(order, order.orderItems[0])}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-orange-500 text-white font-bold text-sm rounded-sm hover:bg-orange-600 transition-all shadow-sm"
            >
              <Star className="w-4 h-4" /> Rate
            </button>
          )}
          {hasDispute && (
            <button
              onClick={() => onDispute(order, 'view')}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-white border border-orange-200 text-orange-600 font-bold text-sm rounded-sm hover:bg-orange-50 transition-all shadow-sm"
            >
              <Scale className="w-4 h-4" /> View Dispute
            </button>
          )}
          {!hasDispute && canDispute && (
            <button
              onClick={() => onDispute(order, 'create')}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-white border border-orange-200 text-orange-600 font-bold text-sm rounded-sm hover:bg-orange-50 transition-all shadow-sm"
            >
              <Scale className="w-4 h-4" /> Dispute
            </button>
          )}
          <Link
            href={`/orders/${order.orderId}`}
            className="flex-1 sm:flex-none flex items-center justify-center px-6 py-2.5 bg-white border border-slate-300 text-slate-700 font-bold text-sm rounded-sm hover:bg-slate-50 transition-all shadow-sm"
          >
            View Details
          </Link>
        </div>
      </div>
    </div>
  );
}
