import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  useCheckoutReserve,
  useCheckoutConfirm,
  useCheckoutCancel,
  useOrderDetail,
} from './useCheckout';
import { resetMockOrders } from '../../../mocks/handlers';

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
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
  beforeEach(() => {
    resetMockOrders();
  });

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
    expect(result.current.data?.order.subtotalAmount).toBeGreaterThan(0);
    expect(result.current.data?.order.totalAmount).toBeGreaterThan(0);
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

  it('TC-PAY-1: Confirms payment successfully with string orderId', async () => {
    const { result } = renderHook(() => useCheckoutConfirm(), {
      wrapper: createWrapper(),
    });

    result.current.mutate('ord-12345');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.success).toBe(true);
    expect(result.current.data?.message).toBe('Pago consolidado en Kardex.');
  });

  it('Confirms payment successfully with full payload (address and email)', async () => {
    const { result } = renderHook(() => useCheckoutConfirm(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      orderId: 'ord-12345',
      shippingAddress: 'Calle 10 # 43A-30',
      shippingCoordinates: { lat: 6.2081, lng: -75.5684 },
      customerEmail: 'cliente@zelbana.com',
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.success).toBe(true);
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

  it('Fetches order details by orderId with useOrderDetail', async () => {
    const { result } = renderHook(() => useOrderDetail('ord-12345'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.id).toBe('ord-12345');
    expect(result.current.data?.status).toBe('RESERVED');
    expect(result.current.data?.totalAmount).toBe(50.0);
    expect(result.current.data?.subtotalAmount).toBe(65.0);
    expect(result.current.data?.discountAmount).toBe(15.0);
    expect(result.current.data?.items).toHaveLength(2);
  });
});
