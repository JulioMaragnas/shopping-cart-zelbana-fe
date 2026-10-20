import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HelmetProvider } from 'react-helmet-async';
import { MyOrdersPage } from './MyOrdersPage';
import { useCartStore } from '../../cart/store/useCartStore';
import { server } from '../../../mocks/server';
import { http, HttpResponse } from 'msw';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('MyOrdersPage Component (TC-UI-ORD-01 to TC-UI-ORD-08)', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    useCartStore.getState().clearCart();
    useCartStore.getState().closeDrawer();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
  });

  const renderPage = () => {
    return render(
      <HelmetProvider>
        <QueryClientProvider client={queryClient}>
          <MemoryRouter initialEntries={['/orders']}>
            <Routes>
              <Route path="/orders" element={<MyOrdersPage />} />
            </Routes>
          </MemoryRouter>
        </QueryClientProvider>
      </HelmetProvider>
    );
  };

  it('TC-UI-ORD-01: renders page title and strictly filters out non-PAID orders', async () => {
    localStorage.setItem('zelbana-customer-email', 'maria@email.com');

    // Return mixed orders
    server.use(
      http.get('*/storefront/api/orders', () => {
        return HttpResponse.json({
          orders: [
            {
              id: 'ORD-PAID-01',
              status: 'PAID',
              customerEmail: 'maria@email.com',
              shippingAddress: 'Calle 93 # 14-20',
              createdAt: '2026-10-14T15:42:00.000Z',
              totalAmount: 142500,
              items: [],
            },
            {
              id: 'ORD-RESERVED-02',
              status: 'RESERVED',
              customerEmail: 'maria@email.com',
              shippingAddress: 'Calle 93 # 14-20',
              createdAt: '2026-10-14T15:00:00.000Z',
              totalAmount: 50000,
              items: [],
            },
            {
              id: 'ORD-CANCELLED-03',
              status: 'CANCELLED',
              customerEmail: 'maria@email.com',
              shippingAddress: 'Calle 93 # 14-20',
              createdAt: '2026-10-14T14:00:00.000Z',
              totalAmount: 30000,
              items: [],
            },
          ],
        });
      })
    );

    renderPage();

    expect(screen.getByTestId('my-orders-page')).toBeInTheDocument();
    expect(screen.getByTestId('orders-page-title')).toHaveTextContent(/Mis Pedidos/i);

    // Only PAID order should be rendered
    await waitFor(() => {
      expect(screen.getByTestId('order-card-ORD-PAID-01')).toBeInTheDocument();
    });

    expect(screen.queryByTestId('order-card-ORD-RESERVED-02')).not.toBeInTheDocument();
    expect(screen.queryByTestId('order-card-ORD-CANCELLED-03')).not.toBeInTheDocument();
  });

  it('TC-UI-ORD-06: displays empty state when user has no confirmed orders, with browse button and accessible lookup form', async () => {
    localStorage.setItem('zelbana-customer-email', 'newuser@email.com');

    server.use(
      http.get('*/storefront/api/orders', () => {
        return HttpResponse.json({ orders: [] });
      })
    );

    renderPage();

    await waitFor(() => {
      expect(screen.getByTestId('orders-empty-state')).toBeInTheDocument();
    });

    expect(screen.getByText(/Aún no tienes pedidos confirmados/i)).toBeInTheDocument();
    expect(screen.getByTestId('order-lookup-form')).toBeInTheDocument();

    const browseBtn = screen.getByTestId('orders-empty-browse-btn');
    fireEvent.click(browseBtn);
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  it('TC-UI-ORD-04: safe manual search brings up the queried paid order', async () => {
    renderPage();

    const orderIdInput = screen.getByTestId('order-lookup-order-id-input');
    const emailInput = screen.getByTestId('order-lookup-email-input');
    const submitBtn = screen.getByTestId('order-lookup-submit-btn');

    fireEvent.change(orderIdInput, { target: { value: 'ORD-1760731845000' } });
    fireEvent.change(emailInput, { target: { value: 'maria@email.com' } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByTestId('order-card-ORD-1760731845000')).toBeInTheDocument();
    });
  });

  it('TC-UI-ORD-05: safe manual search returns 404 anti-enumeration error for non-existent order', async () => {
    renderPage();

    const orderIdInput = screen.getByTestId('order-lookup-order-id-input');
    const emailInput = screen.getByTestId('order-lookup-email-input');
    const submitBtn = screen.getByTestId('order-lookup-submit-btn');

    fireEvent.change(orderIdInput, { target: { value: 'ORD-INVALID' } });
    fireEvent.change(emailInput, { target: { value: 'maria@email.com' } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      const errorMsg = screen.getByTestId('order-lookup-error-message');
      expect(errorMsg).toHaveTextContent(
        'No encontramos un pedido pagado asociado a ese número de orden y correo electrónico.'
      );
    });
  });

  it('TC-UI-ORD-07 / TDD-FE-ORD-08: reorders products on click of "Volver a comprar"', async () => {
    localStorage.setItem('zelbana-customer-email', 'maria@email.com');
    renderPage();

    await waitFor(() => {
      expect(screen.getByTestId('order-card-ORD-1760731845000')).toBeInTheDocument();
    });

    const reorderBtn = screen.getByTestId('reorder-button-ORD-1760731845000');
    fireEvent.click(reorderBtn);

    await waitFor(() => {
      expect(useCartStore.getState().cart.length).toBeGreaterThan(0);
      expect(useCartStore.getState().isDrawerOpen).toBe(true);
    });
  });

  it('TC-UI-ORD-08: displays reorder feedback banner with out of stock items when reordering partial stock', async () => {
    localStorage.setItem('zelbana-customer-email', 'maria@email.com');
    renderPage();

    await waitFor(() => {
      expect(screen.getByTestId('order-card-ORD-1760731845000')).toBeInTheDocument();
    });

    const reorderBtn = screen.getByTestId('reorder-button-ORD-1760731845000');
    fireEvent.click(reorderBtn);

    await waitFor(() => {
      const banner = screen.getByTestId('reorder-feedback-banner');
      expect(banner).toBeInTheDocument();
      expect(banner).toHaveTextContent(/agotado/i);
      expect(screen.getByTestId('reorder-banner-view-cart-link')).toBeInTheDocument();
    });
  });
});
