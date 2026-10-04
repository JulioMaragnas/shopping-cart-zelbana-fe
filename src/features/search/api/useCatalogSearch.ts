import { useQuery } from '@tanstack/react-query';
import type { Product } from '../types';

export const useCatalogSearch = (debouncedQuery: string, categoryId?: string) => {
  return useQuery<Product[]>({
    queryKey: ['catalogSearch', debouncedQuery, categoryId],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (debouncedQuery) params.append('q', debouncedQuery);
      if (categoryId) params.append('categoryId', categoryId);
      params.append('limit', '20');
      params.append('offset', '0');
      
      const response = await fetch(`/storefront/api/products?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.json();
    },
    staleTime: 60000, // 1 minuto de caché
  });
};

export const useSearchSuggestions = (debouncedQuery: string) => {
  return useQuery<string[]>({
    queryKey: ['searchSuggestions', debouncedQuery],
    queryFn: async () => {
      if (!debouncedQuery) return [];
      
      const params = new URLSearchParams({ q: debouncedQuery });
      const response = await fetch(`/storefront/api/search/suggestions?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.json();
    },
    staleTime: 60000,
    enabled: debouncedQuery.length > 0,
  });
};
