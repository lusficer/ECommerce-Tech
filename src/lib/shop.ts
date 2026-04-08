import { apiGet } from '@/lib/api';
import type { Shop } from '@/types';

function normalizeRole(role?: string): string {
  return String(role || '').trim().toUpperCase();
}

function pickShopIdFromAccountStatus(status: any): string {
  return (
    status?.shopId ||
    status?.profile?.shopId ||
    status?.profile?.shop?.shopId ||
    status?.profile?.ownerShopId ||
    ''
  );
}

/**
 * Loads shops for staff-facing screens after the Shop Service API update.
 * - Vendors use /api/shops/my-assigned-shops
 * - Managers try account status -> shopId, then fall back to assigned shops if the backend exposes them
 */
export async function loadManagedShops(userId: string, role?: string): Promise<Shop[]> {
  const normalized = normalizeRole(role);
  const isVendor = normalized.includes('VENDOR') || userId.startsWith('VEND');
  const isManager =
    normalized.includes('MANAGER') ||
    normalized.includes('SHOP_MNG') ||
    userId.startsWith('SHOP_MNG');

  if (isVendor) {
    return (await apiGet<Shop[]>('shop', '/api/shops/my-assigned-shops', {
      withUserId: false,
    })) || [];
  }

  if (isManager) {
    try {
      const account = await apiGet<any>('user', `/api/account/status/${encodeURIComponent(userId)}`, {
        withUserId: false,
      });
      const shopId = pickShopIdFromAccountStatus(account);
      if (shopId) {
        const shop = await apiGet<Shop>('shop', `/api/shops/${encodeURIComponent(shopId)}`, {
          withUserId: false,
        });
        return shop ? [shop] : [];
      }
    } catch {
      // Ignore and fall back to assigned shops below.
    }

    try {
      return (await apiGet<Shop[]>('shop', '/api/shops/my-assigned-shops', {
        withUserId: false,
      })) || [];
    } catch {
      return [];
    }
  }

  return [];
}
