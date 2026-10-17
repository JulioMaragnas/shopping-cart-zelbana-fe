import React from 'react';
import { describe, it, expect } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { server } from '../../../mocks/server';
import { useCategories } from './useCategories';
import { mockCategories } from '../../../mocks/handlers';

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

describe('useCategories Hook', () => {
  it('fetches and returns the hierarchical category tree', async () => {
    const { result } = renderHook(() => useCategories(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockCategories);
    expect(result.current.data?.[0].children?.length).toBeGreaterThan(0);
  });

  it('handles error state when categories endpoint fails', async () => {
    server.use(
      http.get('*/storefront/api/categories', () => {
        return new HttpResponse(null, { status: 500 });
      }),
      http.get('*/api/categories', () => {
        return new HttpResponse(null, { status: 500 });
      })
    );

    const { result } = renderHook(() => useCategories(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeDefined();
  });
});
