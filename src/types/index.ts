// Shared domain types to keep API shapes consistent across features

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
  | 'COMPLETE'
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
  phone?: string;
  warehouseAddress?: string | null;
  warehouseCity?: string | null;
  warehouseDistrict?: string | null;
  warehouseWard?: string | null;
  warehousePhone?: string | null;
  createdAt?: string;
  status?: string;
  ownerId?: string;
}

export interface UpdateShopProfileRequest {
  shopName?: string;
  description?: string;
  logoUrl?: string;
  address?: string;
  phone?: string;
  warehouseAddress?: string;
  warehouseCity?: string;
  warehouseDistrict?: string;
  warehouseWard?: string;
  warehousePhone?: string;
}

export interface ShippingResponseDTO {
  shippingId?: string;
  orderId?: string;
  shipperId?: string;
  status?: string;

  pickupAddress?: string;
  pickupCity?: string;
  pickupDistrict?: string;
  pickupWard?: string;
  pickupPhone?: string;

  deliveryAddress?: string;
  deliveryCity?: string;
  deliveryDistrict?: string;
  deliveryWard?: string;
  deliveryPhone?: string;
}

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | string;

export interface FraudSignals {
  isNewAccount?: boolean;
  recentOrderCount?: number;
  recentCancelCount?: number;
  hasDisputeHistory?: boolean;
  addressMismatch?: boolean;
  // Allow backend to add more signals without breaking the UI
  [key: string]: unknown;
}

export interface VerificationOrderSummary {
  grandTotal: number;
  items?: OrderItem[];
  address?: OrderAddress;
}

export interface VerificationContextDTO {
  paymentStatus?: string;
  paymentMethod?: string;
  paymentRiskLevel?: RiskLevel;
  fraudSignals?: FraudSignals;
  fraudScore?: number; // 0-100
  riskLevel?: RiskLevel;
  orderSummary?: VerificationOrderSummary;
}

export interface ShipperAvailableOrderDTO {
  orderId: string;
  shopId: string;
  grandTotal: number;
  userId?: string;

  pickupAddress?: string;
  pickupCity?: string;
  pickupDistrict?: string;
  pickupWard?: string;
  pickupPhone?: string;

  deliveryAddress?: string;
  deliveryCity?: string;
  deliveryDistrict?: string;
  deliveryWard?: string;
  deliveryPhone?: string;

  // Backward/extra fields that may appear
  [key: string]: unknown;
}

export interface AvailableShipperDTO {
  shipperId: string;
  status?: string;
  fullName?: string;
  phone?: string;
  [key: string]: unknown;
}

export type ShipperWorkStatus = 'AVAILABLE' | 'ON_DELIVERY' | 'UNAVAILABLE' | string;

export interface ShipperStatusDTO {
  status: ShipperWorkStatus;
  unavailableReason?: string;
  [key: string]: unknown;
}

export type DeliveryPhotoType = 'PICKING_UP' | 'DELIVERED' | 'FAILED' | 'RETURNED';

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

export type NotificationType =
  // Customer
  | 'ORDER_STATUS_CHANGED'
  | 'ORDER_VERIFIED'
  | 'ORDER_REJECTED'
  | 'DISPUTE_RESOLVED'
  | 'DISPUTE_NEEDS_INFO'
  // Vendor
  | 'NEW_ORDER_RECEIVED'
  | 'PRODUCT_APPROVED'
  | 'PRODUCT_REJECTED'
  | 'LOW_STOCK_WARNING'
  // Manager
  | 'ORDER_PENDING_VERIFICATION'
  | 'NEW_DISPUTE_CREATED'
  // Shipper
  | 'ORDER_AVAILABLE_FOR_PICKUP'
  | string;

export type NotificationReferenceType = 'ORDER' | 'PRODUCT' | 'DISPUTE' | string;

export interface NotificationDTO {
  // Backends may use either `id` or `notificationId`; the UI normalizes.
  id?: string | number;
  notificationId?: string | number;
  type: NotificationType;
  title?: string;
  message?: string;
  createdAt?: string;
  referenceType?: NotificationReferenceType;
  referenceId?: string | number;
  read?: boolean;
  isRead?: boolean;
  // Allow extra fields without breaking the UI.
  [key: string]: unknown;
}
