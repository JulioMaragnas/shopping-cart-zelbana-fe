import { useMutation } from '@tanstack/react-query';
import type { CartItemInput, ReserveResponse, ConfirmResponse, CancelResponse } from '../types';

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
  return useMutation<ConfirmResponse, Error, string>({
    mutationFn: async (orderId) => {
      const response = await fetch(`/storefront/api/checkout/confirm/${orderId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
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
