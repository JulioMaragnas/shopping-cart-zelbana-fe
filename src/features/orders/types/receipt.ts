export interface OrderReceiptItem {
  productId: string;
  name: string;
  imageUrl?: string;
  thumbnailUrl?: string | null;
  category?: string;
  quantity: number;
  unitPrice: number;
  salePrice?: number;
  subtotal: number;
}

export interface OrderReceiptData {
  orderId: string;
  createdAt: string; // ISO string
  status: 'PAID';
  paymentMethod?: {
    type: 'CREDIT_CARD' | 'DEBIT_CARD' | 'PSE' | 'CASH';
    lastFourDigits?: string;
    brand?: string;
  };
  customer: {
    name: string;
    email: string;
    phone?: string;
  };
  shippingAddress:
    | {
        street: string;
        city: string;
        department: string;
        notes?: string;
      }
    | string;
  financialSummary: {
    subtotal: number;
    discounts: number;
    shippingCost: number;
    isFreeShipping: boolean;
    totalPaid: number;
  };
  items: OrderReceiptItem[];
}

export interface OrderReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: OrderReceiptData | import('./orders.types').PaidOrder | null;
  isLoading?: boolean;
}
