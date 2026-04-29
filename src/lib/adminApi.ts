import { apiGet, apiPut } from '@/lib/api';
import type { AdminShopDTO, AdminUserDTO, SpringPage } from '@/types/admin';

export interface ListAdminUsersParams {
  role?: string;
  isBanned?: boolean;
  search?: string;
  page: number;
  size: number;
}

export interface ListAdminShopsParams {
  status?: string;
  search?: string;
  page: number;
  size: number;
}

function appendIfPresent(qs: URLSearchParams, key: string, value: string | undefined) {
  if (typeof value !== 'string') return;
  const trimmed = value.trim();
  if (!trimmed) return;
  qs.set(key, trimmed);
}

export async function listAdminUsers(
  params: ListAdminUsersParams
): Promise<SpringPage<AdminUserDTO>> {
  const qs = new URLSearchParams();
  qs.set('page', String(params.page));
  qs.set('size', String(params.size));
  appendIfPresent(qs, 'role', params.role);
  appendIfPresent(qs, 'search', params.search);
  if (typeof params.isBanned === 'boolean') {
    qs.set('isBanned', String(params.isBanned));
  }

  return apiGet<SpringPage<AdminUserDTO>>('user', `/api/admin/users?${qs.toString()}`);
}

export async function setUserBanStatus(
  userId: string,
  banned: boolean,
  reason: string
): Promise<void> {
  await apiPut('user', `/api/admin/users/${encodeURIComponent(userId)}/ban`, {
    banned,
    reason,
  });
}

export async function listAdminShops(
  params: ListAdminShopsParams
): Promise<SpringPage<AdminShopDTO>> {
  const qs = new URLSearchParams();
  qs.set('page', String(params.page));
  qs.set('size', String(params.size));
  appendIfPresent(qs, 'status', params.status);
  appendIfPresent(qs, 'search', params.search);

  return apiGet<SpringPage<AdminShopDTO>>('shop', `/api/admin/shops?${qs.toString()}`);
}

export async function setShopStatus(
  shopId: string,
  status: 'ACTIVE' | 'DEACTIVATED',
  reason: string
): Promise<void> {
  await apiPut('shop', `/api/admin/shops/${encodeURIComponent(shopId)}/status`, {
    status,
    reason,
  });
}

