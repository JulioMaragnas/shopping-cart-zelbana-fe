export interface CartItemInput {
  productId: string;
  quantity: number;
}

export interface CartValidatedItem {
  productId: string;
  name: string;
  quantityRequested: number;
  quantityFulfilled: number;
  unitPrice: number;
  subtotal: number;
  message: string;
}

export interface CartValidationResponse {
  items: CartValidatedItem[];
  totalAmount: number;
  isValid: boolean;
}

export interface OrderSummary {
  id: string;
  status: 'RESERVED' | 'PAID' | 'CANCELLED';
  totalAmount: number;
  expiresAt: string;
}

export interface ReserveResponse {
  success: boolean;
  order: OrderSummary;
}

export interface ConfirmResponse {
  success: boolean;
  message: string;
}

export interface CancelResponse {
  success: boolean;
  message: string;
}
