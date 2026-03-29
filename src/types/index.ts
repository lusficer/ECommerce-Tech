// ===== src/types/index.ts =====
// Centralized TypeScript interfaces for the entire application

export interface Product {
  productId: string;
  name: string;
  price: number;
  mainImage: string;
  discountPercentage: number;
  stock: number;
  description?: string;
  categoryId?: string;
  shopId?: string;
  brand?: string;
  approvalStatus?: string;
}

export interface CartItemResponse {
  itemId: number;
  productId: string;
  productName: string;
  productImage: string;
  quantity: number;
  unitPrice: number;
  subTotal: number;
  shopId: string;
  discountPercentage?: number;
}

export interface CartResponse {
  cartId: string;
  userId: string;
  items: CartItemResponse[];
  totalItems: number;
  totalPrice: number;
}

export interface OrderAddress {
  fullName: string;
  phone: string;
  addressLine: string;
  city: string;
  district: string;
  ward: string;
}

export interface OrderItem {
  orderItemId: string;
  productId: string;
  productName: string;
  productImage: string;
  quantity: number;
  unitPrice: number;
  subTotal: number;
  discountPercentage?: number;
  reviewStatus?: string;
}

export type OrderStatus =
  | 'NEW'
  | 'PENDING_VERIFICATION'
  | 'PROCESSING'
  | 'READY_TO_SHIP'
  | 'SHIPPING'
  | 'DELIVERED'
  | 'COMPLETED'
  | 'DISPUTED'
  | 'CANCELLED'
  | 'REJECTED'
  | 'RETURNED'
  | 'DELIVERY_FAILED'
  | string;

export type DisputeStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | string;

export interface Dispute {
  disputeId: string;
  orderId: string;
  reason: string;
  description: string;
  status: DisputeStatus;
  imageUrls?: string[];
  createdAt: string;
  updatedAt?: string;
}

export interface Order {
  orderId: string;
  shopId: string;
  userId: string;
  status: OrderStatus;
  paymentMethod: string;
  paymentStatus?: string;
  subTotal: number;
  shippingFee: number;
  discountAmount: number;
  grandTotal: number;
  shippingAddress: OrderAddress;
  items: OrderItem[];
  createdAt: string;
  updatedAt?: string;
  note?: string;
  trackingNumber?: string;
  disputeStatus?: DisputeStatus;
  disputes?: Dispute[];
}

export interface RecommendationItem {
  productId: string;
  score?: number;
}

export interface RecommendationResponse {
  recommendations: RecommendationItem[];
}

export interface Shop {
  shopId: string;
  shopName: string;
  description?: string;
  logoUrl?: string;
  address?: string;
  createdAt?: string;
  status?: string;
  ownerId?: string;
}

export interface Review {
  reviewId: string;
  userId: string;
  productId: string;
  orderId: string;
  rating: number;
  comment: string;
  imageUrls?: string[];
  createdAt: string;
  userName?: string;
  userAvatar?: string;
}

export interface Category {
  categoryId: string;
  name: string;
}

export interface UserProfile {
  userId: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  address?: string;
  role?: string;
}
