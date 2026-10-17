import { useMutation, useQuery } from '@tanstack/react-query';
import type {
  CartItemInput,
  ReserveResponse,
  ConfirmResponse,
  CancelResponse,
  OrderDetail,
  ConfirmPaymentPayload,
} from '../types';

export const useOrderDetail = (orderId: string, initialData?: OrderDetail | null) => {
  return useQuery<OrderDetail, Error>({
    queryKey: ['orderDetail', orderId],
    queryFn: async () => {
      const response = await fetch(`/storefront/api/orders/${orderId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al obtener la orden');
      }

      return data;
    },
    enabled: Boolean(orderId),
    initialData: initialData ?? undefined,
  });
};

export const useCheckoutReserve = () => {
  return useMutation<ReserveResponse, Error, CartItemInput[]>({
    mutationFn: async (cartItems) => {
      const response = await fetch('/storefront/api/checkout/reserve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ cart: cartItems }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al reservar el inventario');
      }

      return data;
    },
  });
};

export const useCheckoutConfirm = () => {
  return useMutation<ConfirmResponse, Error, string | ConfirmPaymentPayload>({
    mutationFn: async (param) => {
      const isString = typeof param === 'string';
      const orderId = isString ? param : param.orderId;
      const body = isString
        ? JSON.stringify({ shippingAddress: 'Dirección confirmada del comprador' })
        : JSON.stringify({
            shippingAddress: param.shippingAddress,
            shippingCoordinates: param.shippingCoordinates,
            customerEmail: param.customerEmail,
          });


      const response = await fetch(`/storefront/api/checkout/confirm/${orderId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al confirmar el pago');
      }

      return data;
    },
  });
};

export const useCheckoutCancel = () => {
  return useMutation<CancelResponse, Error, string>({
    mutationFn: async (orderId) => {
      const response = await fetch(`/storefront/api/checkout/cancel/${orderId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al cancelar la reserva');
      }

      return data;
    },
  });
};

