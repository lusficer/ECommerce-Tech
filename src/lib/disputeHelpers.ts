import type { Dispute, DisputeStatus, OrderStatus } from '@/types';

const DISPUTEABLE_ORDER_STATUSES: OrderStatus[] = ['DELIVERED', 'COMPLETE', 'COMPLETED'];

export function normalizeDisputeStatus(status?: string): DisputeStatus {
  const normalized = (status || '').trim().toUpperCase();
  if (!normalized) return '';

  if (normalized === 'APPROVED' || normalized === 'RESOLVED_APPROVED') return 'APPROVED';
  if (normalized === 'REJECTED' || normalized === 'RESOLVED_REJECTED') return 'REJECTED';
  if (
    normalized === 'PENDING' ||
    normalized === 'UNDER_REVIEW' ||
    normalized === 'WAITING_FOR_INFO'
  ) {
    return 'PENDING';
  }

  return normalized;
}

export function getLatestDispute(disputes?: Dispute[]): Dispute | null {
  if (!disputes?.length) return null;
  return [...disputes].sort(
    (left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
  )[0];
}

export function getEffectiveOrderStatus(
  orderStatus: string,
  disputeStatus?: string
): OrderStatus {
  if (normalizeDisputeStatus(disputeStatus) === 'APPROVED') return 'DISPUTED';
  return orderStatus as OrderStatus;
}

export function canFileDispute(orderStatus: string, dispute?: Dispute | null): boolean {
  const eligibleOrderStatus = DISPUTEABLE_ORDER_STATUSES.includes(orderStatus as OrderStatus);
  if (!eligibleOrderStatus) return false;
  return !dispute;
}

export function isDisputedOrder(dispute?: Dispute | null): boolean {
  return Boolean(dispute);
}

export function getDisputeLabel(status?: string): string {
  const rawStatus = (status || '').trim().toUpperCase();

  if (!rawStatus) return '';

  // Common pending/in-flight states
  if (rawStatus === 'PENDING' || rawStatus === 'OPEN' || rawStatus === 'SUBMITTED' || rawStatus === 'IN_PROGRESS') {
    return 'Dispute Pending';
  }
  if (rawStatus === 'UNDER_REVIEW') return 'Dispute Under Review';
  if (rawStatus === 'WAITING_FOR_INFO') return 'Need More Information';
  if (rawStatus === 'APPROVED' || rawStatus === 'RESOLVED_APPROVED') return 'Dispute Approved';
  if (rawStatus === 'REJECTED' || rawStatus === 'RESOLVED_REJECTED') return 'Dispute Rejected';

  const normalized = normalizeDisputeStatus(status);
  if (normalized === 'APPROVED') return 'Dispute Approved';
  if (normalized === 'REJECTED') return 'Dispute Rejected';
  if (normalized === 'PENDING') return 'Dispute Pending';

  // Fallback: show something meaningful rather than a misleading "NONE" label.
  return `Dispute ${rawStatus.replace(/_/g, ' ')}`;
}
