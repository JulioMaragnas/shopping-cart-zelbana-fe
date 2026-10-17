import type { PaidOrder } from '../../types/orders.types';

export interface OrderHistoryCardProps {
  order: PaidOrder;
  isReordering: boolean;
  onReorder: (order: PaidOrder) => void;
  onViewVoucher?: (orderId: string) => void;
}
