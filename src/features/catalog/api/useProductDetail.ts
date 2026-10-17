import { useQuery } from '@tanstack/react-query';
import type { Product } from '../../search/types';
import { normalizeProduct } from '../../search/api/useCatalogSearch';

export const useProductDetail = (productId: string | undefined) => {
  return useQuery<Product>({
    queryKey: ['productDetail', productId],
    queryFn: async () => {
      if (!productId) {
        throw new Error('Product ID is required');
      }

      const response = await fetch(`/storefront/api/products/${productId}`);
      if (!response.ok) {
        throw new Error('Producto no encontrado');
      }

      const json = await response.json();
      return normalizeProduct(json);
    },
    enabled: Boolean(productId),
    staleTime: 60000,
  });
};
