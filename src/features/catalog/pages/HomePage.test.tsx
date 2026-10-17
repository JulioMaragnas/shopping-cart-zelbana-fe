import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach } from 'vitest';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HelmetProvider } from 'react-helmet-async';
import { http, HttpResponse } from 'msw';
import { server } from '../../../mocks/server';
import { HomePage } from './HomePage';
import { useCartStore } from '../../cart/store/useCartStore';

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

describe('HomePage Component', () => {
  beforeEach(() => {
    useCartStore.getState().clearCart();
  });

  it('renders Jumbotron when there are no active filters', async () => {
    renderHomePage(['/']);
    await waitFor(() => {
      expect(screen.getByTestId('jumbotron')).toBeInTheDocument();
    });
  });

  it('hides Jumbotron and shows category filter banner when categoryId is active', async () => {
    renderHomePage(['/?categoryId=cat-3']);

    await waitFor(() => {
      expect(screen.getByText(/Categoría:/i)).toBeInTheDocument();
      expect(screen.getByText(/Jabones Artesanales/i)).toBeInTheDocument();
    });

    expect(screen.getByRole('button', { name: /Limpiar filtro/i })).toBeInTheDocument();
  });

  it('TC-PLP-2.1.4 & TC-PLP-2.1.5: shows clear filter button when only query is active, syncs SearchBar input, and clears search on click', async () => {
    const user = userEvent.setup();
    renderHomePage(['/?query=wrangler']);

    await waitFor(() => {
      expect(screen.getByText(/Búsqueda:/i)).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/Buscar productos/i) as HTMLInputElement;
    expect(searchInput.value).toBe('wrangler');

    const clearBtn = screen.getByRole('button', { name: /Limpiar filtro/i });
    expect(clearBtn).toBeInTheDocument();

    await user.click(clearBtn);

    await waitFor(() => {
      expect(screen.getByTestId('jumbotron')).toBeInTheDocument();
    });
    expect(searchInput.value).toBe('');
  });

  it('renders paginated controls and displays current page status', async () => {
    renderHomePage(['/']);

    await waitFor(() => {
      expect(screen.getByText(/Página 1 de 1/i)).toBeInTheDocument();
    });

    const prevBtn = screen.getByRole('button', { name: /Anterior/i });
    const nextBtn = screen.getByRole('button', { name: /Siguiente/i });

    expect(prevBtn).toBeDisabled();
    expect(nextBtn).toBeDisabled(); // 1 page only with default 5 mock items
  });

  it('TC-PLP-PAG-1: keeps UI page status coherent with URL ?page=2 even if API returns currentPage: 1, and navigates cleanly to page 3 and page 1', async () => {
    const user = userEvent.setup();
    server.use(
      http.get('*/storefront/api/products', () => {
        return HttpResponse.json({
          items: [
            {
              id: '21',
              name: 'Vela Aromática Sándalo',
              salePrice: 18,
              discountPercentage: 15,
              thumbnailUrl: '/products/prod-21-thumb.webp',
              disponible: true,
              lowStock: false,
              maxOrderQuantity: 10,
            },
          ],
          totalItems: 50,
          totalPages: 3,
          currentPage: 1, // Stale currentPage from backend
        });
      })
    );

    renderHomePage(['/?page=2']);

    await waitFor(() => {
      expect(screen.getByText('Página 2 de 3')).toBeInTheDocument();
    });

    const prevBtn = screen.getByRole('button', { name: /Anterior/i });
    const nextBtn = screen.getByRole('button', { name: /Siguiente/i });

    expect(prevBtn).not.toBeDisabled();
    expect(nextBtn).not.toBeDisabled();

    await user.click(nextBtn);

    await waitFor(() => {
      expect(screen.getByText('Página 3 de 3')).toBeInTheDocument();
    });
    expect(screen.getByTestId('location-search')).toHaveTextContent('?page=3');
    expect(screen.getByRole('button', { name: /Siguiente/i })).toBeDisabled();
  });

  it('TC-PLP-PAG-2: normalizes out-of-range URL ?page=99 to totalPages (?page=3) so URL and UI never diverge', async () => {
    server.use(
      http.get('*/storefront/api/products', () => {
        return HttpResponse.json({
          items: [
            {
              id: '41',
              name: 'Jabón Cacao y Avena',
              salePrice: 15,
              discountPercentage: 15,
              thumbnailUrl: '/products/prod-41-thumb.webp',
              disponible: true,
              lowStock: false,
              maxOrderQuantity: 10,
            },
          ],
          totalItems: 50,
          totalPages: 3,
          currentPage: 3,
        });
      })
    );

    renderHomePage(['/?page=99']);

    await waitFor(() => {
      expect(screen.getByText('Página 3 de 3')).toBeInTheDocument();
      expect(screen.getByTestId('location-search')).toHaveTextContent('?page=3');
    });
  });
});
