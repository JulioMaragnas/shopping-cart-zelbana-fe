import { useQuery } from '@tanstack/react-query';
import { useCartStore } from '../store/useCartStore';
import { getAffinityData } from '../../search/store/useAffinityStore';
import type { CartValidationResponse } from '../types';

export const useCartValidate = () => {
  const cart = useCartStore((state) => state.cart);
  const affinity = getAffinityData();

  return useQuery<CartValidationResponse>({
    queryKey: ['cartValidate', cart, affinity.recentSearches, affinity.recentCategories],
    queryFn: async () => {
      const payload: {
        cart: Array<{ productId: string; quantity: number }>;
        affinityTerms?: string[];
        affinityCategories?: string[];
      } = {
        cart: cart.map((item) => ({
          productId: item.id,
          quantity: item.quantity,
        })),
        ...(affinity.recentSearches.length > 0 ? { affinityTerms: affinity.recentSearches } : {}),
        ...(affinity.recentCategories.length > 0 ? { affinityCategories: affinity.recentCategories } : {}),
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
