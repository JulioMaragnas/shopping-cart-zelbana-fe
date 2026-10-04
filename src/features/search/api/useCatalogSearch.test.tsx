import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
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
});
