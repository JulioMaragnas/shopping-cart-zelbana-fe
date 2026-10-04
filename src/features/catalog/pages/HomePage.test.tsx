import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HelmetProvider } from 'react-helmet-async';
import { HomePage } from './HomePage';
import { useCartStore } from '../../cart/store/useCartStore';

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
});
