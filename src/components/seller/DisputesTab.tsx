'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  Scale, ChevronDown, ChevronUp, FileText, Send,
  CheckCircle2, XCircle, AlertCircle, Clock, Eye, Loader2,
  MessageSquare, Gavel, Link as LinkIcon, X
} from 'lucide-react';
import { getAuth, logout } from '@/lib/auth';
import { apiGet, apiPost, getUserFacingErrorMessage, isApiError } from '@/lib/api';

interface Evidence {
  evidenceId?: number;
  disputeId: string;
  uploaderId: string;
  fileUrl: string;
  fileType: string;
  description: string;
  uploadedAt?: string;
}

interface Dispute {
  disputeId: string;
  orderId: string;
  userId: string; 
  shopId: string;
  reason: string;
  description: string;
  status: string;
  resolutionSummary?: string;
  refundAmount?: number;
  resolvedAt?: string;
  resolvedBy?: string;
  createdAt: string;
  updatedAt: string;
  evidenceList?: Evidence[];
}

interface DisputesTabProps {
  userId: string; 
  shopId: string;
}

const DISPUTE_REASONS = [
  { value: 'PAYMENT_ISSUE', label: 'Payment Issue' },
  { value: 'RETURN_REFUND', label: 'Return & Refund' },
  { value: 'DAMAGED_GOODS', label: 'Damaged Goods' },
  { value: 'ITEM_NOT_RECEIVED', label: 'Item Not Received' },
  { value: 'WRONG_ITEM', label: 'Wrong Item' },
  { value: 'OTHER', label: 'Other' },
];

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  PENDING:           { label: 'Pending Review',    color: 'text-yellow-700', bg: 'bg-yellow-50 border-yellow-200',   icon: <Clock size={14} /> },
  UNDER_REVIEW:      { label: 'Under Review',      color: 'text-blue-700',   bg: 'bg-blue-50 border-blue-200',     icon: <Eye size={14} /> },
  WAITING_FOR_INFO:  { label: 'Waiting for Info',  color: 'text-orange-700', bg: 'bg-orange-50 border-orange-200', icon: <AlertCircle size={14} /> },
  RESOLVED_APPROVED: { label: 'Refund Approved',   color: 'text-green-700',  bg: 'bg-green-50 border-green-200',   icon: <CheckCircle2 size={14} /> },
  RESOLVED_REJECTED: { label: 'Request Rejected',  color: 'text-red-700',    bg: 'bg-red-50 border-red-200',       icon: <XCircle size={14} /> },
};

export default function DisputesTab({ userId, shopId }: DisputesTabProps) {
  const router = useRouter();
  const [disputes, setDisputes]       = useState<Dispute[]>([]);
  const [loading, setLoading]         = useState(true);
  const [expandedId, setExpandedId]   = useState<string | null>(null);
  const [submitting, setSubmitting]   = useState(false);

  const [requestInfoModal, setRequestInfoModal] = useState({ isOpen: false, disputeId: '', message: '' });
  const [resolveModal, setResolveModal]         = useState({ isOpen: false, disputeId: '', resolutionType: 'APPROVED' as 'APPROVED' | 'REJECTED', resolutionSummary: '', refundAmount: 0 });

  const handleSessionExpired = (err: unknown): boolean => {
    if (isApiError(err) && (err.status === 401 || err.status === 403)) {
      logout();
      toast.error('Your session has expired. Please sign in again.');
      router.push('/login');
      return true;
    }
    return false;
  };

  const fetchDisputes = useCallback(async () => {
    setLoading(true);
    const { token } = getAuth();
    if (!token) {
      setDisputes([]);
      setLoading(false);
      return;
    }

    try {
      const data = await apiGet<Dispute[]>('dispute', '/api/manager/disputes', {
        headers: { 'SHOP-ID': shopId },
      });
      setDisputes(Array.isArray(data) ? data : []);
    } catch (err) {
      if (handleSessionExpired(err)) return;
      setDisputes([]);
    } finally {
      setLoading(false);
    }
  }, [shopId]);

  useEffect(() => { fetchDisputes(); }, [fetchDisputes]);

  const fetchDisputeDetail = async (disputeId: string) => {
    const { token } = getAuth();
    if (!token) return;

    try {
      const detail = await apiGet<Dispute>('dispute', `/api/manager/disputes/${encodeURIComponent(disputeId)}`);
      setDisputes(prev => prev.map(d => d.disputeId === disputeId ? detail : d));
    } catch (err) {
      if (!handleSessionExpired(err)) {
        toast.error(getUserFacingErrorMessage(err, { defaultMessage: 'Failed to load dispute details.' }));
      }
    }
  };

  const handleRequestInfo = async () => {
    if (!requestInfoModal.message.trim()) { toast.error('Please enter a message'); return; }

    setSubmitting(true);

    try {
      await apiPost(
        'dispute',
        `/api/manager/disputes/${encodeURIComponent(requestInfoModal.disputeId)}/request-info`,
        { message: requestInfoModal.message },
        { withUserId: false, headers: { 'X-User-Id': userId } }
      );
      toast.success('Information request sent to customer!');
      setRequestInfoModal({ isOpen: false, disputeId: '', message: '' });
      fetchDisputes();
    } catch (err) {
      if (!handleSessionExpired(err)) {
        toast.error(getUserFacingErrorMessage(err, { defaultMessage: 'Failed to send request.' }));
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleResolve = async () => {
    if (!resolveModal.resolutionSummary.trim()) { toast.error('Please provide a resolution summary'); return; }
    if (resolveModal.resolutionType === 'APPROVED' && resolveModal.refundAmount <= 0) {
      toast.error('Please enter a valid refund amount');
      return;
    }

    setSubmitting(true);

    try {
      const body: any = {
        resolutionType: resolveModal.resolutionType,
        resolutionSummary: resolveModal.resolutionSummary,
      };
      if (resolveModal.resolutionType === 'APPROVED') {
        body.refundAmount = resolveModal.refundAmount;
      }

      await apiPost(
        'dispute',
        `/api/manager/disputes/${encodeURIComponent(resolveModal.disputeId)}/resolve`,
        body,
        { withUserId: false, headers: { 'X-User-Id': userId } }
      );
      toast.success(`Dispute ${resolveModal.resolutionType.toLowerCase()}!`);
      setResolveModal({ isOpen: false, disputeId: '', resolutionType: 'APPROVED', resolutionSummary: '', refundAmount: 0 });
      fetchDisputes();
    } catch (err) {
      if (!handleSessionExpired(err)) {
        toast.error(getUserFacingErrorMessage(err, { defaultMessage: 'Failed to resolve dispute.' }));
      }
    } finally {
      setSubmitting(false);
    }
  };

  const toggleExpand = (disputeId: string) => {
    if (expandedId === disputeId) {
      setExpandedId(null);
    } else {
      setExpandedId(disputeId);
      fetchDisputeDetail(disputeId);
    }
  };

  const StatusBadge = ({ status }: { status: string }) => {
    const config = STATUS_CONFIG[status] || STATUS_CONFIG.PENDING;
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${config.bg} ${config.color}`}>
        {config.icon}
        {config.label}
      </span>
    );
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '—';
    try {
      return new Date(dateStr).toLocaleDateString('en-GB', {
        day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
      });
    } catch { return dateStr; }
  };

  const getReasonLabel = (reason: string) => {
    return DISPUTE_REASONS.find(r => r.value === reason)?.label || reason;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <Scale size={24} className="text-cyan-600" />
            Customer Disputes
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Review and resolve customer refund requests
          </p>
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={32} className="animate-spin text-cyan-600" />
        </div>
      )}

      {!loading && disputes.length === 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-sm">
          <Scale size={48} className="mx-auto text-slate-300 mb-4" />
          <p className="text-lg font-bold text-slate-400">No disputes found</p>
          <p className="text-sm text-slate-400 mt-1">
            There are no customer disputes filed for this shop.
          </p>
        </div>
      )}

      {!loading && disputes.length > 0 && (
        <div className="space-y-3">
          {disputes.map(dispute => {
            const isExpanded = expandedId === dispute.disputeId;
            const canManagerAct = ['PENDING', 'UNDER_REVIEW', 'WAITING_FOR_INFO'].includes(dispute.status);

            return (
              <div
                key={dispute.disputeId}
                className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden transition-all"
              >
                <button
                  onClick={() => toggleExpand(dispute.disputeId)}
                  className="w-full flex items-center justify-between px-6 py-4 hover:bg-slate-50/50 transition-colors text-left"
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="shrink-0">
                      <FileText size={20} className="text-slate-400" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-black text-slate-800">{dispute.disputeId}</span>
                        <span className="text-xs text-slate-400">•</span>
                        <span className="text-xs font-bold text-slate-500">Order: {dispute.orderId}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="text-xs font-bold text-slate-400">{getReasonLabel(dispute.reason)}</span>
                        <span className="text-xs text-slate-300">•</span>
                        <span className="text-xs text-slate-400">{formatDate(dispute.createdAt)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <StatusBadge status={dispute.status} />
                    {isExpanded ? <ChevronUp size={18} className="text-slate-400" /> : <ChevronDown size={18} className="text-slate-400" />}
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t border-slate-100 px-6 py-5 space-y-5 bg-slate-50/30">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <DetailField label="Dispute ID" value={dispute.disputeId} />
                      <DetailField label="Order ID" value={dispute.orderId} />
                      <DetailField label="Customer ID" value={dispute.userId} />
                      <DetailField label="Reason" value={getReasonLabel(dispute.reason)} />
                      <DetailField label="Status" value={<StatusBadge status={dispute.status} />} />
                      <DetailField label="Created" value={formatDate(dispute.createdAt)} />
                      <DetailField label="Updated" value={formatDate(dispute.updatedAt)} />
                      {dispute.resolvedAt && <DetailField label="Resolved" value={formatDate(dispute.resolvedAt)} />}
                      {dispute.resolvedBy && <DetailField label="Resolved By" value={dispute.resolvedBy} />}
                      {dispute.refundAmount != null && dispute.refundAmount > 0 && (
                        <DetailField label="Refund Amount" value={`$${dispute.refundAmount.toLocaleString()}`} />
                      )}
                    </div>

                    <div>
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Customer Description</p>
                      <p className="text-sm text-slate-700 bg-white border border-slate-200 rounded-xl px-4 py-3">
                        {dispute.description || '—'}
                      </p>
                    </div>

                    {dispute.resolutionSummary && (
                      <div>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Resolution Summary</p>
                        <p className={`text-sm rounded-xl px-4 py-3 border ${dispute.status === 'RESOLVED_APPROVED' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
                          {dispute.resolutionSummary}
                        </p>
                      </div>
                    )}

                    {dispute.evidenceList && dispute.evidenceList.length > 0 && (
                      <div>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">
                          Evidence Provided ({dispute.evidenceList.length})
                        </p>
                        <div className="space-y-3">
                          {dispute.evidenceList.map((ev, idx) => (
                            <div key={ev.evidenceId || idx} className="flex flex-col bg-white border border-slate-200 rounded-xl px-4 py-3">
                              <div className="flex items-start gap-3">
                                <LinkIcon size={14} className="text-cyan-600 mt-0.5 shrink-0" />
                                <div className="min-w-0 flex-1">
                                  <a
                                    href={ev.fileUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm text-cyan-600 hover:underline font-bold break-all"
                                  >
                                    View File
                                  </a>
                                  <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
                                    <span className="font-bold bg-slate-100 px-2 py-0.5 rounded">{ev.fileType}</span>
                                    {ev.description && <span>• {ev.description}</span>}
                                    {ev.uploadedAt && <span>• {formatDate(ev.uploadedAt)}</span>}
                                  </div>
                                </div>
                              </div>
                              {ev.fileType === 'IMAGE' && ev.fileUrl && (
                                <div className="mt-3 pl-7">
                                  <img 
                                    src={ev.fileUrl} 
                                    alt="Evidence preview"
                                    className="max-h-60 w-auto object-contain rounded-lg border border-slate-200 shadow-sm"
                                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                  />
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {canManagerAct && (
                      <div className="flex items-center gap-3 pt-4 border-t border-slate-200 mt-4">
                        <button
                          onClick={() => setRequestInfoModal({ isOpen: true, disputeId: dispute.disputeId, message: '' })}
                          className="flex items-center gap-2 px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold rounded-xl transition-colors"
                        >
                          <MessageSquare size={16} />
                          Request Info from Customer
                        </button>
                        <button
                          onClick={() => setResolveModal({ isOpen: true, disputeId: dispute.disputeId, resolutionType: 'APPROVED', resolutionSummary: '', refundAmount: 0 })}
                          className="flex items-center gap-2 px-5 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white text-sm font-bold rounded-xl transition-colors"
                        >
                          <Gavel size={16} />
                          Make Decision (Resolve)
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {requestInfoModal.isOpen && (
        <ModalOverlay onClose={() => setRequestInfoModal({ isOpen: false, disputeId: '', message: '' })}>
          <h3 className="text-lg font-black text-slate-800 mb-4 flex items-center gap-2">
            <MessageSquare size={20} className="text-orange-500" />
            Request Additional Information
          </h3>
          <p className="text-sm text-slate-500 mb-4">
            Send a message to the customer requesting more evidence (like uncut unboxing videos) or clarification.
          </p>
          <textarea
            value={requestInfoModal.message}
            onChange={e => setRequestInfoModal(m => ({ ...m, message: e.target.value }))}
            placeholder="Describe what information you need from the customer..."
            rows={4}
            className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-100 resize-none"
            autoFocus
          />
          <div className="flex justify-end gap-3 mt-5">
            <button
              onClick={() => setRequestInfoModal({ isOpen: false, disputeId: '', message: '' })}
              className="px-5 py-2.5 border border-slate-200 text-slate-600 text-sm font-bold rounded-xl hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleRequestInfo}
              disabled={submitting}
              className="flex items-center gap-2 px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold rounded-xl transition-colors disabled:opacity-50"
            >
              {submitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              Send Request
            </button>
          </div>
        </ModalOverlay>
      )}

      {resolveModal.isOpen && (
        <ModalOverlay onClose={() => setResolveModal({ isOpen: false, disputeId: '', resolutionType: 'APPROVED', resolutionSummary: '', refundAmount: 0 })}>
          <h3 className="text-lg font-black text-slate-800 mb-4 flex items-center gap-2">
            <Gavel size={20} className="text-cyan-600" />
            Resolve Dispute
          </h3>

          <div className="mb-4">
            <label className="block text-sm font-bold text-slate-600 mb-2">Final Decision</label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setResolveModal(m => ({ ...m, resolutionType: 'APPROVED' }))}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold border-2 transition-colors ${
                  resolveModal.resolutionType === 'APPROVED'
                    ? 'border-green-500 bg-green-50 text-green-700'
                    : 'border-slate-200 text-slate-500 hover:border-slate-300'
                }`}
              >
                <CheckCircle2 size={16} />
                Approve Refund
              </button>
              <button
                type="button"
                onClick={() => setResolveModal(m => ({ ...m, resolutionType: 'REJECTED' }))}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold border-2 transition-colors ${
                  resolveModal.resolutionType === 'REJECTED'
                    ? 'border-red-500 bg-red-50 text-red-700'
                    : 'border-slate-200 text-slate-500 hover:border-slate-300'
                }`}
              >
                <XCircle size={16} />
                Reject Request
              </button>
            </div>
          </div>

          {resolveModal.resolutionType === 'APPROVED' && (
            <div className="mb-4">
              <label className="block text-sm font-bold text-slate-600 mb-1.5">Refund Amount ($)</label>
              <input
                type="number"
                value={resolveModal.refundAmount || ''}
                onChange={e => setResolveModal(m => ({ ...m, refundAmount: parseFloat(e.target.value) || 0 }))}
                placeholder="0.00"
                min="0"
                step="0.01"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-100"
              />
            </div>
          )}

          <div className="mb-5">
            <label className="block text-sm font-bold text-slate-600 mb-1.5">Resolution Summary *</label>
            <textarea
              value={resolveModal.resolutionSummary}
              onChange={e => setResolveModal(m => ({ ...m, resolutionSummary: e.target.value }))}
              placeholder="Provide a clear explanation to the customer regarding your decision..."
              rows={3}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-100 resize-none"
            />
          </div>

          <div className="flex justify-end gap-3">
            <button
              onClick={() => setResolveModal({ isOpen: false, disputeId: '', resolutionType: 'APPROVED', resolutionSummary: '', refundAmount: 0 })}
              className="px-5 py-2.5 border border-slate-200 text-slate-600 text-sm font-bold rounded-xl hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleResolve}
              disabled={submitting}
              className={`flex items-center gap-2 px-5 py-2.5 text-white text-sm font-bold rounded-xl transition-colors disabled:opacity-50 ${
                resolveModal.resolutionType === 'APPROVED'
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              {submitting ? <Loader2 size={14} className="animate-spin" /> : <Gavel size={14} />}
              {resolveModal.resolutionType === 'APPROVED' ? 'Confirm Approval' : 'Confirm Rejection'}
            </button>
          </div>
        </ModalOverlay>
      )}
    </div>
  );
}

function DetailField({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-0.5">{label}</p>
      <div className="text-sm font-bold text-slate-700">{value}</div>
    </div>
  );
}

function ModalOverlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl p-6 animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 text-slate-400 hover:text-slate-600 transition-colors"
        >
          <X size={18} />
        </button>
        {children}
      </div>
    </div>
  );
}