import React from 'react';
import { describe, it, expect } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useCheckoutReserve, useCheckoutConfirm, useCheckoutCancel } from './useCheckout';

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      mutations: {
        retry: false,
      },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useCheckout Hooks', () => {
  it('TC-CHK-1: Successfully reserves cart inventory for 15 minutes', async () => {
    const { result } = renderHook(() => useCheckoutReserve(), {
      wrapper: createWrapper(),
    });

    result.current.mutate([{ productId: '1', quantity: 2 }]);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.success).toBe(true);
    expect(result.current.data?.order.status).toBe('RESERVED');
    expect(result.current.data?.order.id).toBeDefined();
    expect(result.current.data?.order.expiresAt).toBeDefined();
  });

  it('TC-CHK-2: Rejects reservation with 409 when stock is insufficient', async () => {
    const { result } = renderHook(() => useCheckoutReserve(), {
      wrapper: createWrapper(),
    });

    // Product '3' (rubicon) has currentStock 0 in mock
    result.current.mutate([{ productId: '3', quantity: 1 }]);

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toContain('Stock insuficiente');
  });

  it('TC-PAY-1: Confirms payment successfully', async () => {
    const { result } = renderHook(() => useCheckoutConfirm(), {
      wrapper: createWrapper(),
    });

    result.current.mutate('ord-12345');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.success).toBe(true);
    expect(result.current.data?.message).toBe('Pago consolidado en Kardex.');
  });

  it('Cancels reservation explicitly', async () => {
    const { result } = renderHook(() => useCheckoutCancel(), {
      wrapper: createWrapper(),
    });

    result.current.mutate('ord-12345');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.success).toBe(true);
    expect(result.current.data?.message).toBe('Reserva anulada y stock liberado.');
  });
});
