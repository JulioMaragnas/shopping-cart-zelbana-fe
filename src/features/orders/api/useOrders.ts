import { useQuery, useMutation } from '@tanstack/react-query';
import type { PaidOrder, OrderLookupQuery, OrdersResponse, OrderLookupResponse } from '../types/orders.types';

export const fetchPaidOrders = async (email: string): Promise<PaidOrder[]> => {
  const normalized = email.trim().toLowerCase();
  const res = await fetch(`/storefront/api/orders?email=${encodeURIComponent(normalized)}`);
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Error al consultar las órdenes.');
  }
  const data: OrdersResponse = await res.json();
  return (data.orders || [])
    .filter((o) => o.status === 'PAID')
    .map((o) => ({
      ...o,
      orderId: o.orderId || o.id || '',
    }));
};

export const lookupPaidOrder = async (query: OrderLookupQuery): Promise<PaidOrder> => {
  const res = await fetch('/storefront/api/orders/lookup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      orderId: query.orderId.trim(),
      email: query.email.trim().toLowerCase(),
    }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(
      errorData.error ||
        'No encontramos un pedido pagado asociado a ese número de orden y correo electrónico.'
    );
  }

  const data: OrderLookupResponse = await res.json();
  return {
    ...data.order,
    orderId: data.order.orderId || data.order.id || '',
  };
};

export const usePaidOrders = (email?: string | null) => {
  return useQuery({
    queryKey: ['paidOrders', email],
    queryFn: () => (email ? fetchPaidOrders(email) : Promise.resolve([])),
    enabled: Boolean(email && email.trim()),
    staleTime: 1000 * 60 * 2,
  });
};

export const useOrderLookup = () => {
  return useMutation({
    mutationFn: lookupPaidOrder,
  });
};
