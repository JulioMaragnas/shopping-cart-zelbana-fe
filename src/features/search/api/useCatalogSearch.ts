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

const hasNestedProduct = (item: RawCatalogInput): item is CatalogItem & { product: NonNullable<CatalogItem['product']> } => {
  return 'product' in item && item.product !== undefined;
};

export const normalizeProduct = (item: RawCatalogInput): Product => {
  const source = hasNestedProduct(item) ? item.product : item;
  const photos = Array.isArray(source.photos) ? source.photos : [];
  const thumbnailUrl =
    source.thumbnailUrl !== undefined
      ? source.thumbnailUrl
      : photos.length > 0
      ? photos[0]
      : null;

  const rawDisponible = item.disponible ?? source.disponible;
  const disponible = Boolean(rawDisponible);
  const rawMaxOrderQuantity = item.maxOrderQuantity ?? source.maxOrderQuantity;
  const maxOrderQuantity =
    typeof rawMaxOrderQuantity === 'number'
      ? Math.max(0, rawMaxOrderQuantity)
      : disponible
      ? 1
      : 0;
  const lowStock = Boolean(item.lowStock ?? source.lowStock);
  const discountPercentage =
    typeof source.discountPercentage === 'number' && source.discountPercentage > 0
      ? Math.round(source.discountPercentage)
      : 0;

  return {
    id: String(source.id),
    name: source.name || '',
    description: source.description || '',
    thumbnailUrl,
    photos,
    salePrice: Number(source.salePrice) || 0,
    discountPercentage,
    categoryId: source.categoryId,
    categoryName: source.categoryName,
    specs: Array.isArray(source.specs) ? source.specs : [],
    disponible: disponible && maxOrderQuantity > 0,
    lowStock,
    maxOrderQuantity,
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
  const safePage = Math.max(1, page);

  return useQuery<CatalogSearchResult>({
    queryKey: ['catalogSearch', query, categoryId, safePage, limit],
    queryFn: async () => {
      const offset = (safePage - 1) * limit;
      const params = new URLSearchParams();
      if (query) {
        params.append('query', query);
        params.append('q', query);
      }
      if (categoryId) {
        params.append('categoryId', categoryId);
      }
      params.append('page', String(safePage));
      params.append('limit', String(limit));
      params.append('offset', String(offset));

      const response = await fetch(`/storefront/api/products?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const json = await response.json();

      if (json && Array.isArray(json.items)) {
        const paginated = json as PaginatedCatalogResponse;
        const totalItems = paginated.totalItems ?? paginated.items.length;
        const totalPages = Math.max(1, paginated.totalPages ?? (Math.ceil(totalItems / limit) || 1));
        const currentPage = Math.min(safePage, totalPages);
        return {
          products: paginated.items.map(normalizeProduct),
          totalItems,
          totalPages,
          currentPage,
        };
      }

      if (Array.isArray(json)) {
        const totalItems = json.length;
        const totalPages = Math.max(1, Math.ceil(totalItems / limit) || 1);
        const currentPage = Math.min(safePage, totalPages);
        const sliced = json.length > limit ? json.slice(offset, offset + limit) : json;
        return {
          products: sliced.map(normalizeProduct),
          totalItems,
          totalPages,
          currentPage,
        };
      }

      return {
        products: [],
        totalItems: 0,
        totalPages: 1,
        currentPage: 1,
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
