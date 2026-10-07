import React from 'react';
import { describe, it, expect } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useProductDetail } from './useProductDetail';

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useProductDetail Hook', () => {
  it('fetches and normalizes a single product by ID', async () => {
    const { result } = renderHook(() => useProductDetail('1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.id).toBe('1');
    expect(result.current.data?.name).toBe('Jeep wrangler');
    expect(result.current.data?.disponible).toBe(true);
    expect(result.current.data?.maxOrderQuantity).toBe(10);
    expect(result.current.data?.discountPercentage).toBe(20);
    expect(result.current.data?.categoryName).toBe('Jabones Artesanales');
    expect(result.current.data?.specs).toEqual([
      { label: 'Tracción', value: '4x4 Command-Trac' },
      { label: 'Capacidad', value: '5 pasajeros' },
    ]);
  });

  it('handles error state when product is not found (404)', async () => {
    const { result } = renderHook(() => useProductDetail('999'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeDefined();
  });
});
