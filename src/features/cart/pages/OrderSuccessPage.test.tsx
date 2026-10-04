import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HelmetProvider } from 'react-helmet-async';
import { OrderSuccessPage } from './OrderSuccessPage';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('OrderSuccessPage', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
  });

  const renderComponent = (orderId = 'ord-12345') => {
    return render(
      <HelmetProvider>
        <QueryClientProvider client={queryClient}>
          <MemoryRouter initialEntries={[`/order-success/${orderId}`]}>
            <Routes>
              <Route path="/order-success/:orderId" element={<OrderSuccessPage />} />
            </Routes>
          </MemoryRouter>
        </QueryClientProvider>
      </HelmetProvider>
    );
  };

  it('debe mostrar el mensaje de confirmación y el ID de orden', () => {
    renderComponent('ord-999');

    expect(screen.getByText(/¡Gracias por tu compra!/i)).toBeInTheDocument();
    expect(screen.getByText(/ord-999/i)).toBeInTheDocument();
    expect(screen.getByText(/Pago consolidado/i)).toBeInTheDocument();
  });

  it('debe navegar al catálogo al hacer click en seguir comprando', () => {
    renderComponent();

    const backButton = screen.getByRole('button', { name: /seguir comprando|volver a la tienda/i });
    fireEvent.click(backButton);

    expect(mockNavigate).toHaveBeenCalledWith('/');
  });
});
