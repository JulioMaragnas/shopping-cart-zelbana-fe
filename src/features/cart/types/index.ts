export interface CartItemInput {
  productId: string;
  quantity: number;
}

export interface CartValidatedItem {
  productId: string;
  name: string;
  thumbnailUrl?: string | null;
  quantityRequested: number;
  quantityFulfilled: number;
  availableStock?: number;
  salePrice?: number;
  unitPrice: number;
  discountPercentage?: number;
  subtotal: number;
  message: string;
}

export interface UpsellProductDTO {
  id: string;
  name: string;
  thumbnailUrl: string | null;
  salePrice: number;
  discountPercentage: number;
  categoryId: string;
  categoryName: string;
  isAvailable: boolean;
  disponible?: boolean;
  maxOrderQuantity: number;
  coversMissingAmount: boolean;
}

export interface ShippingPromotionDTO {
  enabled: boolean;
  threshold: number;
  currentAmount: number;
  missingAmount: number;
  percentage: number;
  isFreeShippingUnlocked: boolean;
  upsellProducts: UpsellProductDTO[];
}

export interface CartValidationResponse {
  items: CartValidatedItem[];
  totalAmount: number;
  isValid: boolean;
  shippingPromotion?: ShippingPromotionDTO;
}

export interface OrderItem {
  productId: string;
  name: string;
  thumbnailUrl?: string | null;
  quantity: number;
  unitPrice: number;
  salePrice: number;
  discountPercentage: number;
  lineSubtotal: number;
  lineTotal: number;
}

export type OrderStatus = 'RESERVED' | 'PAID' | 'CANCELLED' | 'EXPIRED';

export interface OrderSummary {
  id: string;
  status: OrderStatus;
  totalAmount: number;
  expiresAt: string;
}

export interface OrderDetail {
  id: string;
  status: OrderStatus;
  createdAt: string;
  expiresAt: string;
  customerEmail?: string | null;
  shippingAddress?: string | null;
  shippingCoordinates?: { lat: number; lng: number } | null;
  subtotalAmount: number;
  discountAmount: number;
  totalAmount: number;
  items: OrderItem[];
}

export interface ReserveResponse {
  success: boolean;
  order: OrderDetail;
}

export interface ShippingCoordinates {
  lat: number;
  lng: number;
}

export type AddressQuickChip = 'Casa' | 'Oficina' | 'Padres' | 'Pareja';

export interface UserAddress {
  id: string;
  userId?: string;
  label: string;
  receiverName: string;
  receiverPhone: string;
  city: string;
  department: string;
  addressLine: string;
  additionalInfo?: string | null;
  coordinates?: ShippingCoordinates | null;
  isDefault: boolean;
}

export interface ConfirmPaymentPayload {
  orderId: string;
  shippingAddress: string;
  shippingCoordinates?: ShippingCoordinates | null;
  customerEmail?: string;
}

export interface ConfirmResponse {
  success: boolean;
  message: string;
}

export interface CancelResponse {
  success: boolean;
  message: string;
}


