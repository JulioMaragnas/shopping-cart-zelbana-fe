import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useCartValidate } from './useCartValidate';
import { useCartStore } from '../store/useCartStore';

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

describe('useCartValidate Hook', () => {
  beforeEach(() => {
    useCartStore.getState().clearCart();
  });

  it('TC-CART-1: Validates cart with available stock and returns official totalAmount', async () => {
    useCartStore.getState().addItem({
      id: '1',
      name: 'Jeep wrangler',
      priceWhenAdded: 45000,
      quantity: 2,
    });

    const { result } = renderHook(() => useCartValidate(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.isValid).toBe(true);
    expect(result.current.data?.totalAmount).toBe(90000); // 2 * 45000
    expect(result.current.data?.items).toHaveLength(1);
    expect(result.current.data?.items[0].quantityFulfilled).toBe(2);
    expect(result.current.data?.items[0].availableStock).toBe(10);
    expect(result.current.data?.items[0].salePrice).toBe(45000);
    expect(result.current.data?.items[0].discountPercentage).toBe(20);
    expect(result.current.data?.items[0].thumbnailUrl).toMatch(/^\/products\/prod-1-thumb\.webp\?X-Amz-/);
    expect(result.current.data?.items[0].message).toBe('Stock disponible');
  });

  it('TC-CART-3: Flags partial stock when requested quantity exceeds available stock', async () => {
    // Product '2' (Jeep grand cherokee) has currentStock: 3 in mock
    useCartStore.getState().addItem({
      id: '2',
      name: 'Jeep grand cherokee',
      priceWhenAdded: 55000,
      quantity: 5,
    });

    const { result } = renderHook(() => useCartValidate(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.isValid).toBe(false);
    expect(result.current.data?.items[0].quantityRequested).toBe(5);
    expect(result.current.data?.items[0].quantityFulfilled).toBe(3);
    expect(result.current.data?.items[0].availableStock).toBe(3);
    expect(result.current.data?.items[0].message).toContain('Stock parcial');
    expect(result.current.data?.totalAmount).toBe(165000); // 3 * 55000
  });

  it('TC-CART-4: Flags deleted product with quantityFulfilled 0 and isValid false', async () => {
    useCartStore.getState().addItem({
      id: '999',
      name: 'Deleted Product',
      priceWhenAdded: 10000,
      quantity: 1,
    });

    const { result } = renderHook(() => useCartValidate(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.isValid).toBe(false);
    expect(result.current.data?.items[0].quantityFulfilled).toBe(0);
    expect(result.current.data?.items[0].availableStock).toBe(0);
    expect(result.current.data?.items[0].message).toContain('no existe en el catálogo');
  });

  it('is disabled when cart is empty', () => {
    const { result } = renderHook(() => useCartValidate(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isFetching).toBe(false);
    expect(result.current.data).toBeUndefined();
  });
});
