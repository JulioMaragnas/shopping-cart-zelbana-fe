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

export interface CartValidationResponse {
  items: CartValidatedItem[];
  totalAmount: number;
  isValid: boolean;
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

export interface ConfirmPaymentPayload {
  orderId: string;
  shippingAddress?: string;
  shippingCoordinates?: { lat: number; lng: number } | null;
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

