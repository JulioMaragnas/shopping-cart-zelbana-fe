import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HelmetProvider } from 'react-helmet-async';
import { ProductDetailPage } from './ProductDetailPage';
import { getAffinityData } from '../../search/utils/affinityStorage';

const renderProductDetailPage = (productId = '1') => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return render(
    <HelmetProvider>
      <MemoryRouter initialEntries={[`/products/${productId}`]}>
        <QueryClientProvider client={queryClient}>
          <Routes>
            <Route path="/products/:id" element={<ProductDetailPage />} />
          </Routes>
        </QueryClientProvider>
      </MemoryRouter>
    </HelmetProvider>
  );
};

describe('ProductDetailPage Affinity Tracking', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('records category affinity in localStorage when viewing a product detail', async () => {
    renderProductDetailPage('1');

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    });

    const affinity = getAffinityData();
    // In mockCatalogItems, product 1 has categoryId 'cat-3'
    expect(affinity.recentCategories).toContain('cat-3');
  });
});
