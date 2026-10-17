export type OrderStatus = 'PAID';

export interface OrderProductItem {
  productId: string;
  name: string;
  thumbnailUrl: string | null;
  quantity: number;
  salePrice: number;
  unitPrice?: number;
  discountPercentage?: number;
  lineSubtotal?: number;
  lineTotal?: number;
  isAvailableToday?: boolean;
}

export interface PaidOrder {
  orderId: string;
  id?: string;
  customerEmail: string;
  shippingAddress: string;
  shippingCoordinates?: { lat: number; lng: number } | null;
  createdAt: string;
  paidAt?: string;
  expiresAt?: string;
  status: OrderStatus;
  subtotalAmount?: number;
  discountAmount?: number;
  totalAmount: number;
  currency?: 'COP' | 'USD';
  items: OrderProductItem[];
}

export interface OrderLookupQuery {
  orderId: string;
  email: string;
}

export interface ReorderFeedback {
  type: 'success' | 'partial' | 'out_of_stock' | 'error';
  message: string;
  addedCount: number;
  outOfStockItems: string[];
}

export interface OrdersResponse {
  orders: PaidOrder[];
}

export interface OrderLookupResponse {
  order: PaidOrder;
}
