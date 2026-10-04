import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HelmetProvider } from 'react-helmet-async';
import { CartPage } from './CartPage';
import { useCartStore } from '../store/useCartStore';

const renderCartPage = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return render(
    <HelmetProvider>
      <MemoryRouter initialEntries={['/cart']}>
        <QueryClientProvider client={queryClient}>
          <Routes>
            <Route path="/cart" element={<CartPage />} />
            <Route path="/checkout/:orderId" element={<div>Checkout Page Mock</div>} />
          </Routes>
        </QueryClientProvider>
      </MemoryRouter>
    </HelmetProvider>
  );
};

describe('CartPage Component (Zero Trust)', () => {
  beforeEach(() => {
    useCartStore.getState().clearCart();
  });

  it('TC-CART-1: Renders cart items and server-validated total amount', async () => {
    useCartStore.getState().addItem({
      id: '1',
      name: 'Jeep wrangler',
      priceWhenAdded: 45000,
      quantity: 2,
    });

    renderCartPage();

    await waitFor(() => {
      expect(screen.getByText('Jeep wrangler')).toBeInTheDocument();
      expect(screen.getByText('Resumen del pedido')).toBeInTheDocument();
    });

    // Validated official total from backend: 2 * 45000 = $90000
    await waitFor(() => {
      expect(screen.getAllByText('$90000').length).toBeGreaterThanOrEqual(1);
    });

    const payBtn = screen.getByRole('button', { name: /Pagar/i });
    expect(payBtn).not.toBeDisabled();
  });

  it('TC-CART-3: Shows partial stock warning and allows auto-adjusting cart quantity', async () => {
    const user = userEvent.setup();
    // Item '2' only has stock 3 in mock, but we request 5
    useCartStore.getState().addItem({
      id: '2',
      name: 'Jeep grand cherokee',
      priceWhenAdded: 55000,
      quantity: 5,
    });

    renderCartPage();

    await waitFor(() => {
      expect(screen.getByText(/Stock parcial/i)).toBeInTheDocument();
      expect(screen.getByText(/Ajustar carrito al inventario disponible/i)).toBeInTheDocument();
    });

    const adjustBtn = screen.getByRole('button', { name: /Ajustar carrito al inventario disponible/i });
    await user.click(adjustBtn);

    // Quantity should now be adjusted to 3
    await waitFor(() => {
      const cart = useCartStore.getState().cart;
      expect(cart[0].quantity).toBe(3);
    });
  });

  it('TC-CHK-1: Initiates checkout reservation and navigates to checkout on pay', async () => {
    const user = userEvent.setup();
    useCartStore.getState().addItem({
      id: '1',
      name: 'Jeep wrangler',
      priceWhenAdded: 45000,
      quantity: 1,
    });

    renderCartPage();

    await waitFor(() => {
      const payBtn = screen.getByRole('button', { name: /Pagar/i });
      expect(payBtn).not.toBeDisabled();
    });

    const payBtn = screen.getByRole('button', { name: /Pagar/i });
    await user.click(payBtn);

    await waitFor(() => {
      expect(screen.getByText('Checkout Page Mock')).toBeInTheDocument();
    });
  });
});
