import { useQuery } from '@tanstack/react-query';
import { useCartStore } from '../store/useCartStore';
import type { CartValidationResponse } from '../types';

export const useCartValidate = () => {
  const cart = useCartStore((state) => state.cart);

  return useQuery<CartValidationResponse>({
    queryKey: ['cartValidate', cart],
    queryFn: async () => {
      const payload = {
        cart: cart.map((item) => ({
          productId: item.id,
          quantity: item.quantity,
        })),
      };

      const response = await fetch('/storefront/api/cart/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Error al validar el carrito en el servidor');
      }

      return response.json();
    },
    enabled: cart.length > 0,
    staleTime: 10000, // 10 segundos
  });
};
