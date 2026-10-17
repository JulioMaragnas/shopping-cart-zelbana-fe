import React from 'react';
import { describe, it, expect } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { server } from '../../../mocks/server';
import { useStoreSettings, DEFAULT_SETTINGS } from './useStoreSettings';

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

describe('TDD-FE-FS-01: useStoreSettings Hook', () => {
  it('returns initialData immediately with DEFAULT_SETTINGS', () => {
    const { result } = renderHook(() => useStoreSettings(), {
      wrapper: createWrapper(),
    });

    expect(result.current.data).toEqual(DEFAULT_SETTINGS);
    expect(result.current.data?.freeShippingEnabled).toBe(true);
    expect(result.current.data?.freeShippingThreshold).toBe(50.0);
  });

  it('fetches settings from /storefront/api/settings successfully', async () => {
    server.use(
      http.get('*/storefront/api/settings', () => {
        return HttpResponse.json({
          freeShippingEnabled: true,
          freeShippingThreshold: 75.0,
        });
      })
    );

    const { result } = renderHook(() => useStoreSettings(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.data?.freeShippingThreshold).toBe(75.0);
    });
    expect(result.current.data?.freeShippingEnabled).toBe(true);
  });

  it('provides resilient fallback to DEFAULT_SETTINGS when endpoint returns 500 error', async () => {
    server.use(
      http.get('*/storefront/api/settings', () => {
        return new HttpResponse(null, { status: 500 });
      }),
      http.get('*/api/settings', () => {
        return new HttpResponse(null, { status: 500 });
      })
    );

    const { result } = renderHook(() => useStoreSettings(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isFetching).toBe(false);
    });

    // En caso de error de red, el hook devuelve DEFAULT_SETTINGS como fallback tolerante
    expect(result.current.data).toEqual(DEFAULT_SETTINGS);
  });

  it('provides resilient fallback to DEFAULT_SETTINGS on network error without crashing', async () => {
    server.use(
      http.get('*/storefront/api/settings', () => {
        return HttpResponse.error();
      })
    );

    const { result } = renderHook(() => useStoreSettings(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isFetching).toBe(false);
    });

    expect(result.current.data).toEqual(DEFAULT_SETTINGS);
  });
});
