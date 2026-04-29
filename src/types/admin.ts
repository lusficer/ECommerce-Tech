export interface AdminUserDTO {
  userId: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  isBanned: boolean;
  isVerified: boolean;
  banReason: string | null;
  createdAt: string;
}

export interface AdminShopDTO {
  shopId: string;
  shopName: string;
  status: 'ACTIVE' | 'DEACTIVATED' | string;
  vendorId: string;
  managerId: string;
  deactivationReason: string | null;
  createdAt: string;
  deactivatedAt: string | null;
}

export interface SpringPage<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

