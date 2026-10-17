import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HelmetProvider } from 'react-helmet-async';
import { http, HttpResponse, delay } from 'msw';
import { server } from '../../../mocks/server';
import { HomePage } from './HomePage';
import { useCartStore } from '../../cart/store/useCartStore';
import { getAffinityData, AFFINITY_STORAGE_KEY } from '../../search/utils/affinityStorage';

function LocationDisplay() {
  const location = useLocation();
  return <div data-testid="location-search">{location.search}</div>;
}

const renderHomePage = (initialEntries = ['/']) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return render(
    <HelmetProvider>
      <MemoryRouter initialEntries={initialEntries}>
        <QueryClientProvider client={queryClient}>
          <LocationDisplay />
          <HomePage />
        </QueryClientProvider>
      </MemoryRouter>
    </HelmetProvider>
  );
};

describe('HomePage BuyBox & Afinidad Integration (TC-UI-BUYBOX-01 a 10, TDD-FE-04, TDD-FE-05)', () => {
  beforeEach(() => {
    localStorage.clear();
    useCartStore.getState().clearCart();
    vi.restoreAllMocks();
  });

  it('TC-UI-BUYBOX-01 & TDD-FE-04: renders BuyBoxSortBar with 5 pills, recommended active by default', async () => {
    renderHomePage(['/']);

    await waitFor(() => {
      expect(screen.getByTestId('buybox-sort-bar')).toBeInTheDocument();
    });

    const recommendedPill = screen.getByTestId('sort-pill-recommended');
    expect(recommendedPill).toHaveAttribute('aria-pressed', 'true');

    expect(screen.getByTestId('sort-pill-best_selling')).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByTestId('sort-pill-highest_discount')).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByTestId('sort-pill-price_asc')).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByTestId('sort-pill-price_desc')).toHaveAttribute('aria-pressed', 'false');
  });

  it('TC-UI-BUYBOX-02: clicking sort-pill-best_selling updates URL to ?sort=best_selling&page=1 and activates pill', async () => {
    const user = userEvent.setup();
    renderHomePage(['/']);

    await waitFor(() => {
      expect(screen.getByTestId('buybox-sort-bar')).toBeInTheDocument();
    });

    const bestSellingPill = screen.getByTestId('sort-pill-best_selling');
    await user.click(bestSellingPill);

    await waitFor(() => {
      expect(screen.getByTestId('location-search')).toHaveTextContent('sort=best_selling');
      expect(screen.getByTestId('location-search')).toHaveTextContent('page=1');
    });

    expect(bestSellingPill).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByTestId('sort-pill-recommended')).toHaveAttribute('aria-pressed', 'false');
  });

  it('TC-UI-BUYBOX-03: preserves categoryId and query when changing sort, resets to page=1', async () => {
    const user = userEvent.setup();
    server.use(
      http.get('*/storefront/api/products', () => {
        return HttpResponse.json({
          items: [
            {
              id: '5',
              name: 'Crema Corporal Hidratante',
              salePrice: 20,
              discountPercentage: 0,
              thumbnailUrl: '/crema.webp',
              disponible: true,
              lowStock: false,
              maxOrderQuantity: 5,
              categoryId: 'cat-1',
            },
          ],
          totalItems: 50,
          totalPages: 3,
          currentPage: 3,
        });
      })
    );

    renderHomePage(['/?categoryId=cat-1&query=crema&page=3']);

    await waitFor(() => {
      expect(screen.getByTestId('buybox-sort-bar')).toBeInTheDocument();
    });

    const priceAscPill = screen.getByTestId('sort-pill-price_asc');
    await user.click(priceAscPill);

    await waitFor(() => {
      const search = screen.getByTestId('location-search').textContent;
      expect(search).toContain('categoryId=cat-1');
      expect(search).toContain('query=crema');
      expect(search).toContain('sort=price_asc');
      expect(search).toContain('page=1');
    });
  });

  it('TC-UI-BUYBOX-04: synchronizes with external URL ?sort=highest_discount (and alias discount_desc)', async () => {
    renderHomePage(['/?sort=highest_discount']);

    await waitFor(() => {
      expect(screen.getByTestId('sort-pill-highest_discount')).toHaveAttribute('aria-pressed', 'true');
      expect(screen.getByTestId('sort-pill-recommended')).toHaveAttribute('aria-pressed', 'false');
    });
  });

  it('TC-UI-BUYBOX-05: silently falls back to recommended on invalid sort query param', async () => {
    renderHomePage(['/?sort=invalido_sql_injection']);

    await waitFor(() => {
      expect(screen.getByTestId('sort-pill-recommended')).toHaveAttribute('aria-pressed', 'true');
    });
  });

  it('TC-UI-BUYBOX-06 & TDD-FE-05: shows catalog-skeleton-grid during loading and preserves BuyBoxSortBar in DOM', async () => {
    server.use(
      http.get('*/storefront/api/products', async () => {
        await delay(150);
        return HttpResponse.json({
          items: [],
          totalItems: 0,
          totalPages: 1,
          currentPage: 1,
        });
      })
    );

    renderHomePage(['/']);

    expect(screen.getByTestId('catalog-skeleton-grid')).toBeInTheDocument();
    expect(screen.getByTestId('buybox-sort-bar')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.queryByTestId('catalog-skeleton-grid')).not.toBeInTheDocument();
    });
  });

  it('TC-UI-BUYBOX-07: anti-garbage rule does not record searches with 0 results in recentSearches', async () => {
    server.use(
      http.get('*/storefront/api/products', () => {
        return HttpResponse.json({
          items: [],
          totalItems: 0,
          totalPages: 1,
          currentPage: 1,
        });
      })
    );

    renderHomePage(['/?query=inexistente123']);

    await waitFor(() => {
      expect(screen.getByTestId('catalog-empty-state')).toBeInTheDocument();
    });

    const affinity = getAffinityData();
    expect(affinity.recentSearches).not.toContain('inexistente123');
  });

  it('TC-UI-BUYBOX-08: successfully records valid search query when totalItems > 0', async () => {
    server.use(
      http.get('*/storefront/api/products', () => {
        return HttpResponse.json({
          items: [
            {
              id: '10',
              name: 'Serum Vitamina C',
              salePrice: 25,
              discountPercentage: 10,
              thumbnailUrl: '/thumb.webp',
              disponible: true,
              lowStock: false,
              maxOrderQuantity: 5,
            },
          ],
          totalItems: 1,
          totalPages: 1,
          currentPage: 1,
        });
      })
    );

    renderHomePage(['/?query=vitamina%20c']);

    await waitFor(() => {
      const affinity = getAffinityData();
      expect(affinity.recentSearches[0]).toBe('vitamina c');
    });
  });

  it('TC-UI-BUYBOX-09: clear-filters-btn clears categoryId and query while preserving active sort', async () => {
    const user = userEvent.setup();
    server.use(
      http.get('*/storefront/api/products', () => {
        return HttpResponse.json({
          items: [],
          totalItems: 0,
          totalPages: 1,
          currentPage: 1,
        });
      })
    );

    renderHomePage(['/?query=vacio&categoryId=cat-1&sort=price_desc']);

    await waitFor(() => {
      expect(screen.getByTestId('clear-filters-btn')).toBeInTheDocument();
    });

    await user.click(screen.getByTestId('clear-filters-btn'));

    await waitFor(() => {
      const search = screen.getByTestId('location-search').textContent;
      expect(search).not.toContain('query=');
      expect(search).not.toContain('categoryId=');
      expect(search).toContain('sort=price_desc');
      expect(search).toContain('page=1');
    });
  });

  it('TC-UI-BUYBOX-10: renders out-of-stock product card with product-card-sold-out and disabled Agotado button', async () => {
    server.use(
      http.get('*/storefront/api/products', () => {
        return HttpResponse.json({
          items: [
            {
              id: '1',
              name: 'Producto Disponible',
              salePrice: 20,
              discountPercentage: 0,
              thumbnailUrl: '/p1.webp',
              disponible: true,
              lowStock: false,
              maxOrderQuantity: 5,
            },
            {
              id: '2',
              name: 'Producto Agotado',
              salePrice: 15,
              discountPercentage: 0,
              thumbnailUrl: '/p2.webp',
              disponible: false,
              lowStock: false,
              maxOrderQuantity: 0,
            },
          ],
          totalItems: 2,
          totalPages: 1,
          currentPage: 1,
        });
      })
    );

    renderHomePage(['/']);

    await waitFor(() => {
      expect(screen.getByTestId('product-card-sold-out')).toBeInTheDocument();
    });

    const soldOutCard = screen.getByTestId('product-card-sold-out');
    expect(soldOutCard).toHaveTextContent('Producto Agotado');

    const agotadoButton = screen.getByRole('button', { name: /Agotado/i });
    expect(agotadoButton).toBeDisabled();
  });
});
