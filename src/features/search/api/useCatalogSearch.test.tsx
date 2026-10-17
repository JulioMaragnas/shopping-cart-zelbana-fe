import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { server } from '../../../mocks/server';
import { useCatalogSearch } from './useCatalogSearch';
import { describe, it, expect } from 'vitest';
import React from 'react';

const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

export function createWrapper() {
  const queryClient = createTestQueryClient();
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}

describe('useCatalogSearch', () => {
  it('should return loading state initially', async () => {
    const { result } = renderHook(() => useCatalogSearch(''), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toBeUndefined();
  });

  it('should fetch paginated products when query is empty', async () => {
    const { result } = renderHook(() => useCatalogSearch(''), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data?.products).toHaveLength(5);
    expect(result.current.data?.totalItems).toBe(5);
    expect(result.current.data?.totalPages).toBe(1);
    expect(result.current.data?.currentPage).toBe(1);
  });

  it('should filter products when a query is provided', async () => {
    const { result } = renderHook(() => useCatalogSearch('rubicon'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data?.products).toHaveLength(1);
    expect(result.current.data?.products[0].name).toBe('Jeep rubicon');
  });

  it('should filter products by categoryId', async () => {
    const { result } = renderHook(() => useCatalogSearch('', 'cat-4'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data?.products).toHaveLength(1);
    expect(result.current.data?.products[0].categoryId).toBe('cat-4');
  });

  it('TC-PLP-2.1.6: filtering by parent category (cat-1) includes products from parent and child subcategories (cat-3, cat-4)', async () => {
    const { result } = renderHook(() => useCatalogSearch('', 'cat-1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data?.products).toHaveLength(4);
    const categoryIds = result.current.data?.products.map((p) => p.categoryId);
    expect(categoryIds).toEqual(expect.arrayContaining(['cat-1', 'cat-3', 'cat-4']));
  });

  it('TC-PLP-2.1.7: sends page, limit, and offset=(page-1)*limit and keeps currentPage coherent with requested page clamped to totalPages', async () => {
    let capturedUrl = '';
    server.use(
      http.get('*/storefront/api/products', ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json({
          items: [
            {
              id: '21',
              name: 'Jabón Página 2',
              salePrice: 15,
              discountPercentage: 0,
              thumbnailUrl: '/products/p21.webp',
              disponible: true,
              lowStock: false,
              maxOrderQuantity: 10,
            },
          ],
          totalItems: 50,
          totalPages: 3,
          currentPage: 1, // Simulates backend returning stale currentPage: 1
        });
      })
    );

    const { result } = renderHook(() => useCatalogSearch({ page: 2, limit: 20 }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    const parsedUrl = new URL(capturedUrl);
    expect(parsedUrl.searchParams.get('page')).toBe('2');
    expect(parsedUrl.searchParams.get('limit')).toBe('20');
    expect(parsedUrl.searchParams.get('offset')).toBe('20');
    expect(result.current.data?.currentPage).toBe(2);
    expect(result.current.data?.totalPages).toBe(3);
  });

  it('TC-PLP-2.2.1, TC-PLP-2.3.1 & TC-PLP-2.4.1: normalizes thumbnailUrl (MinIO relative presigned), discountPercentage, and maxOrderQuantity without exposing unitPrice or originalPrice', async () => {
    const { result } = renderHook(() => useCatalogSearch(''), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    const firstProduct = result.current.data?.products[0];
    expect(firstProduct).toBeDefined();
    expect(firstProduct?.thumbnailUrl).toMatch(/^\/products\/prod-1-thumb\.webp\?X-Amz-Algorithm=AWS4-HMAC-SHA256/);
    expect(firstProduct?.discountPercentage).toBe(20);
    expect(firstProduct?.maxOrderQuantity).toBe(10);
    expect(firstProduct?.lowStock).toBe(false);
    expect('unitPrice' in (firstProduct as unknown as Record<string, unknown>)).toBe(false);
    expect('originalPrice' in (firstProduct as unknown as Record<string, unknown>)).toBe(false);

    // Product 2 has stock 3 => lowStock: true, maxOrderQuantity: 3
    const lowStockProduct = result.current.data?.products[1];
    expect(lowStockProduct?.lowStock).toBe(true);
    expect(lowStockProduct?.maxOrderQuantity).toBe(3);
  });
});
