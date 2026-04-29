import { apiGet } from '@/lib/api';
import type { Shop } from '@/types';

function detectRoleKind(userId: string, role?: string): 'vendor' | 'manager' | 'other' {
  const normalized = (role ?? '').trim().toUpperCase();

  // Vendor detection
  if (normalized === 'VENDOR' || userId.startsWith('VEND')) {
    return 'vendor';
  }

  // Manager detection - handle multiple variants
  const managerVariants = ['MANAGER', 'SHOP_MANAGER', 'SHOP MANAGER'];
  if (managerVariants.includes(normalized) || userId.startsWith('SHOP_MNG')) {
    return 'manager';
  }

  return 'other';
}

export async function loadManagedShops(
  userId: string,
  role?: string
): Promise<Shop[]> {
  const kind = detectRoleKind(userId, role);

  if (kind === 'vendor') {
    const shops = await apiGet<Shop[]>(
      'shop',
      '/api/shops/my-assigned-shops',
      { withUserId: false }
    );
    return shops ?? [];
  }

  if (kind === 'manager') {
    const shops = await apiGet<Shop[]>(
      'shop',
      '/api/shops/my-managed-shops',
      { withUserId: false }
    );
    return shops ?? [];
  }

  return [];
}
