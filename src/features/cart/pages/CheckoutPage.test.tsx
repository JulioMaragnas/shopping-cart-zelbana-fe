import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HelmetProvider } from 'react-helmet-async';
import { CheckoutPage } from './CheckoutPage';
import { useCartStore } from '../store/useCartStore';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('CheckoutPage', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    useCartStore.setState({
      cart: [{ id: 'p1', name: 'Jabón Cacao', priceWhenAdded: 15, quantity: 2 }],
    });
  });

  const renderComponent = (
    orderId = 'ord-12345',
    state = { order: { id: 'ord-12345', status: 'RESERVED', totalAmount: 30, expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString() } }
  ) => {
    return render(
      <HelmetProvider>
        <QueryClientProvider client={queryClient}>
          <MemoryRouter initialEntries={[{ pathname: `/checkout/${orderId}`, state }]}>
            <Routes>
              <Route path="/checkout/:orderId" element={<CheckoutPage />} />
            </Routes>
          </MemoryRouter>
        </QueryClientProvider>
      </HelmetProvider>
    );
  };

  it('debe renderizar el ID de reserva, el total y el temporizador regresivo', () => {
    renderComponent();

    expect(screen.getByText(/ord-12345/i)).toBeInTheDocument();
    expect(screen.getByText(/Total a pagar/i)).toBeInTheDocument();
    expect(screen.getByText(/\$30(\.00)?/i)).toBeInTheDocument();
    // Temporizador debe mostrar formato MM:SS
    expect(screen.getByTestId('countdown-timer')).toBeInTheDocument();
  });

  it('debe confirmar el pago, vaciar el carrito y navegar a /order-success/:orderId', async () => {
    renderComponent();

    const payButton = screen.getByRole('button', { name: /confirmar y pagar|simular pago/i });
    fireEvent.click(payButton);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/order-success/ord-12345', expect.any(Object));
      expect(useCartStore.getState().cart).toEqual([]);
    });
  });

  it('debe cancelar la reserva y volver al carrito', async () => {
    renderComponent();

    const cancelButton = screen.getByRole('button', { name: /cancelar reserva/i });
    fireEvent.click(cancelButton);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/cart');
    });
  });

  it('debe mostrar alerta de expiración cuando el tiempo llega a cero', async () => {
    vi.useFakeTimers();

    const pastExpiresAt = new Date(Date.now() + 2000).toISOString();
    renderComponent('ord-12345', {
      order: { id: 'ord-12345', status: 'RESERVED', totalAmount: 30, expiresAt: pastExpiresAt },
    });

    // Avanzar tiempo para que expire
    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(screen.getByText(/tu tiempo de reserva expiró/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /volver al carrito/i })).toBeInTheDocument();

    vi.useRealTimers();
  });
});
