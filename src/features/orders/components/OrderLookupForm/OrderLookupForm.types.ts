import type { OrderLookupQuery } from '../../types/orders.types';

export interface OrderLookupFormProps {
  isLoading: boolean;
  onSearch: (query: OrderLookupQuery) => void;
  errorMessage?: string | null;
}
