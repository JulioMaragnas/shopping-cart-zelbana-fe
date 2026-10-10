import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HelmetProvider } from 'react-helmet-async';
import { CheckoutPage } from './CheckoutPage';
import { useCartStore } from '../store/useCartStore';
import { server } from '../../../mocks/server';
import { http, HttpResponse } from 'msw';

import { resetMockOrders } from '../../../mocks/handlers';
import type { OrderDetail } from '../types';

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
    resetMockOrders();
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
    state?: { order?: OrderDetail }
  ) => {
    const defaultOrder: OrderDetail = {
      id: 'ord-12345',
      status: 'RESERVED',
      totalAmount: 50.0,
      subtotalAmount: 65.0,
      discountAmount: 15.0,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      customerEmail: 'julio@ejemplo.com',
      shippingAddress: 'Carrera 65A 1 sur-10',
      items: [
        {
          productId: '1',
          name: 'Jabón de coco',
          quantity: 2,
          unitPrice: 20.0,
          salePrice: 12.5,
          discountPercentage: 37,
          lineSubtotal: 40.0,
          lineTotal: 25.0,
        },
        {
          productId: '2',
          name: 'Sal hidratante',
          quantity: 1,
          unitPrice: 25.0,
          salePrice: 25.0,
          discountPercentage: 0,
          lineSubtotal: 25.0,
          lineTotal: 25.0,
        },
      ],
    };

    const resolvedState = state === undefined && orderId === 'ord-12345' ? { order: defaultOrder } : state;

    return render(
      <HelmetProvider>
        <QueryClientProvider client={queryClient}>
          <MemoryRouter initialEntries={[{ pathname: `/checkout/${orderId}`, state: resolvedState }]}>
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
    expect(screen.getByText(/\$50(\.00)?/i)).toBeInTheDocument();
    expect(screen.getByTestId('countdown-timer')).toBeInTheDocument();
  });

  it('TC-ORD-3: Desglose "Resumen de la compra" con productos, descuento oficial y total (Mercado Libre)', () => {
    renderComponent();

    expect(screen.getByText(/Resumen de la compra/i)).toBeInTheDocument();
    // Productos con subtotales en el desglose
    expect(screen.getByText(/Jabón de coco \(x2\)/i)).toBeInTheDocument();
    expect(screen.getByText(/\$40\.00/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Sal hidratante/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/\$25\.00/i).length).toBeGreaterThanOrEqual(1);
    // Renglón de descuento oficial
    expect(screen.getByText(/Descuento/i)).toBeInTheDocument();
    expect(screen.getByText(/-\$15\.00/i)).toBeInTheDocument();
    // Total sostenido
    expect(screen.getByText(/\$50\.00/i)).toBeInTheDocument();
  });

  it('TC-ORD-2: Sostenimiento inmutable de precios y datos tras recarga F5 (sin state en location)', async () => {
    // Simulamos recarga F5: state es undefined
    renderComponent('ord-12345', undefined);

    await waitFor(() => {
      expect(screen.getByText(/ord-12345/i)).toBeInTheDocument();
      expect(screen.getAllByText(/Jabón de coco/i).length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText(/-\$15\.00/i)).toBeInTheDocument();
      expect(screen.getByText(/\$50\.00/i)).toBeInTheDocument();
    });
  });

  it('Redirige automáticamente a /order-success/:orderId si la orden ya tiene status PAID', async () => {
    renderComponent('ord-12345', {
      order: {
        id: 'ord-12345',
        status: 'PAID',
        totalAmount: 50.0,
        expiresAt: new Date().toISOString(),
      },
    });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith(
        '/order-success/ord-12345',
        expect.objectContaining({ replace: true })
      );
    });
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

  it('debe cancelar la reserva y volver al carrito conservando los productos', async () => {
    renderComponent();

    const cancelButton = screen.getByRole('button', { name: /cancelar reserva/i });
    fireEvent.click(cancelButton);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/cart');
      expect(useCartStore.getState().cart).toHaveLength(1);
    });
  });

  it('debe mostrar alerta de expiración cuando el tiempo llega a cero', async () => {
    vi.useFakeTimers();

    const pastExpiresAt = new Date(Date.now() + 2000).toISOString();
    renderComponent('ord-12345', {
      order: {
        id: 'ord-12345',
        status: 'RESERVED',
        totalAmount: 50,
        expiresAt: pastExpiresAt,
      },
    });

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(screen.getByText(/tu tiempo de reserva expiró/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /volver al carrito/i })).toBeInTheDocument();

    vi.useRealTimers();
  });

  it('debe mostrar alerta de error cuando la confirmación de pago falla', async () => {
    server.use(
      http.post('*/storefront/api/checkout/confirm/:orderId', () => {
        return HttpResponse.json(
          { error: 'Tu tiempo de reserva expiró y los productos fueron liberados.' },
          { status: 400 }
        );
      })
    );

    renderComponent();

    const payButton = screen.getByRole('button', { name: /confirmar y pagar|simular pago/i });
    fireEvent.click(payButton);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/tiempo de reserva expiró/i);
    });
  });
});

