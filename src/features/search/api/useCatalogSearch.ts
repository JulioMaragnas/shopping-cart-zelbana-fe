import { useQuery } from '@tanstack/react-query';
import type { Product, PaginatedCatalogResponse, CatalogItem } from '../types';

export interface CatalogSearchResult {
  products: Product[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
}

export interface UseCatalogSearchOptions {
  query?: string;
  categoryId?: string;
  page?: number;
  limit?: number;
}

export type RawCatalogInput = CatalogItem | (Partial<Product> & { id: string | number; name: string; salePrice: number });

const isCatalogItem = (item: RawCatalogInput): item is CatalogItem => {
  return 'product' in item && item.product !== undefined;
};

export const normalizeProduct = (item: RawCatalogInput): Product => {
  if (isCatalogItem(item)) {
    const p = item.product;
    const stock = typeof item.currentStock === 'number' ? item.currentStock : 0;
    return {
      id: String(p.id),
      name: p.name,
      description: p.description || '',
      photos: Array.isArray(p.photos) ? p.photos : [],
      salePrice: p.salePrice,
      originalPrice: p.originalPrice ?? p.salePrice,
      unitPrice: p.unitPrice,
      categoryId: p.categoryId,
      currentStock: stock,
      disponible: stock > 0,
      lowStock: stock > 0 && stock <= 5,
    };
  }

  // Si ya viene como Product plano (retrocompatibilidad)
  const stock = typeof item.currentStock === 'number' ? item.currentStock : (item.disponible ? 10 : 0);
  return {
    id: String(item.id),
    name: item.name,
    description: item.description || '',
    photos: Array.isArray(item.photos) ? item.photos : [],
    salePrice: item.salePrice,
    originalPrice: item.originalPrice ?? item.salePrice,
    unitPrice: item.unitPrice,
    categoryId: item.categoryId,
    currentStock: stock,
    disponible: item.disponible !== undefined ? Boolean(item.disponible) : stock > 0,
    lowStock: item.lowStock !== undefined ? Boolean(item.lowStock) : (stock > 0 && stock <= 5),
  };
};

export const useCatalogSearch = (
  queryOrOptions: string | UseCatalogSearchOptions = '',
  categoryIdParam?: string,
  pageParam = 1
) => {
  const options: UseCatalogSearchOptions = typeof queryOrOptions === 'string'
    ? { query: queryOrOptions, categoryId: categoryIdParam, page: pageParam, limit: 20 }
    : { page: 1, limit: 20, ...queryOrOptions };

  const { query = '', categoryId, page = 1, limit = 20 } = options;

  return useQuery<CatalogSearchResult>({
    queryKey: ['catalogSearch', query, categoryId, page, limit],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (query) {
        params.append('query', query);
        params.append('q', query);
      }
      if (categoryId) {
        params.append('categoryId', categoryId);
      }
      params.append('page', String(page));
      params.append('limit', String(limit));

      const response = await fetch(`/storefront/api/products?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const json = await response.json();

      if (json && Array.isArray(json.items)) {
        const paginated = json as PaginatedCatalogResponse;
        return {
          products: paginated.items.map(normalizeProduct),
          totalItems: paginated.totalItems ?? paginated.items.length,
          totalPages: paginated.totalPages ?? 1,
          currentPage: paginated.currentPage ?? page,
        };
      }

      if (Array.isArray(json)) {
        return {
          products: json.map(normalizeProduct),
          totalItems: json.length,
          totalPages: Math.ceil(json.length / limit) || 1,
          currentPage: page,
        };
      }

      return {
        products: [],
        totalItems: 0,
        totalPages: 1,
        currentPage: page,
      };
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
