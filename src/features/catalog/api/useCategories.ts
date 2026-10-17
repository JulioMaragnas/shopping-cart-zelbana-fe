import { useQuery } from '@tanstack/react-query';
import type { Category } from '../../search/types';

export const useCategories = () => {
  return useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await fetch('/storefront/api/categories');
      if (!response.ok) {
        throw new Error('Error al obtener categorías');
      }
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutos de caché
  });
};
