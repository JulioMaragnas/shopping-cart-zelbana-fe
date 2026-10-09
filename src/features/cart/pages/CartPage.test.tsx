import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HelmetProvider } from 'react-helmet-async';
import { CartPage } from './CartPage';
import { useCartStore } from '../store/useCartStore';
import { server } from '../../../mocks/server';
import { http, HttpResponse } from 'msw';

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

describe('CartPage Component (Zero Trust — Fases 4.1 a 4.4)', () => {
  beforeEach(() => {
    useCartStore.getState().clearCart();
  });

  it('TC-CART-4.3.1 & TC-CART-4.3.3: renders cart items with official server price, -20% OFF badge, and coherent total ignoring manipulated local priceWhenAdded', async () => {
    useCartStore.getState().addItem({
      id: '1',
      name: 'Jeep wrangler',
      priceWhenAdded: 0.01, // Manipulated local price
      quantity: 2,
    });

    renderCartPage();

    await waitFor(() => {
      expect(screen.getByText('Jeep wrangler')).toBeInTheDocument();
      expect(screen.getByText('Resumen del pedido')).toBeInTheDocument();
    });

    // Server price for product '1' is 45000, discountPercentage is 20 -> 2 * 45000 = $90000.00
    await waitFor(() => {
      expect(screen.getAllByText('$90000.00').length).toBeGreaterThanOrEqual(2);
    });

    expect(screen.getByText('-20% OFF')).toBeInTheDocument();
    expect(screen.getByText(/El precio se actualizó a \$45000\.00/i)).toBeInTheDocument();
    expect(screen.queryByText(/Descuento de artículo/i)).not.toBeInTheDocument();

    const payBtn = screen.getByRole('button', { name: /Pagar/i });
    expect(payBtn).not.toBeDisabled();
  });

  it('TC-CART-4.3.2 & TC-CART-4.4.1: shows partial stock warning without fake discount and auto-adjusts cart quantity with status confirmation', async () => {
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

    // Ensure missing stock is NOT shown as a discount
    expect(screen.queryByText(/Descuento de artículo/i)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Pagar/i })).toBeDisabled();

    const adjustBtn = screen.getByRole('button', { name: /Ajustar carrito al inventario disponible/i });
    await user.click(adjustBtn);

    // Quantity should now be adjusted to 3 and status banner shown
    await waitFor(() => {
      const cart = useCartStore.getState().cart;
      expect(cart[0].quantity).toBe(3);
      expect(screen.getByRole('status')).toHaveTextContent(/Hemos ajustado tu carrito/i);
    });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Pagar/i })).not.toBeDisabled();
    });
  });

  it('TC-CART-4.4.2 & TC-CART-4.4.3: removes out-of-stock (id 3) and deleted catalog products (id 999) when adjusting cart', async () => {
    const user = userEvent.setup();
    useCartStore.getState().addItem({
      id: '1',
      name: 'Jeep wrangler',
      priceWhenAdded: 45000,
      quantity: 1,
    });
    useCartStore.getState().addItem({
      id: '3',
      name: 'Jeep rubicon', // Out of stock (stock = 0)
      priceWhenAdded: 60000,
      quantity: 1,
    });
    useCartStore.getState().addItem({
      id: '999',
      name: 'Producto Fantasma Borrado', // Deleted from catalog
      priceWhenAdded: 10000,
      quantity: 1,
    });

    renderCartPage();

    await waitFor(() => {
      expect(screen.getByText('No disponible')).toBeInTheDocument();
      expect(screen.getByText('Agotado')).toBeInTheDocument();
    });

    expect(screen.getByRole('button', { name: /Pagar/i })).toBeDisabled();

    const adjustBtn = screen.getByRole('button', { name: /Ajustar carrito al inventario disponible/i });
    await user.click(adjustBtn);

    await waitFor(() => {
      const cart = useCartStore.getState().cart;
      expect(cart).toHaveLength(1);
      expect(cart[0].id).toBe('1');
      expect(screen.getByRole('status')).toHaveTextContent(/fueron removidos/i);
    });
  });

  it('TC-CHK-1: initiates checkout reservation and navigates to checkout on pay', async () => {
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

  it('TC-CART-4.4.4 (TC-CHK-2): displays error alert when checkout reservation fails with 409 Conflict', async () => {
    const user = userEvent.setup();
    useCartStore.getState().addItem({
      id: '1',
      name: 'Jeep wrangler',
      priceWhenAdded: 45000,
      quantity: 1,
    });

    server.use(
      http.post('*/storefront/api/checkout/reserve', () => {
        return HttpResponse.json(
          { error: 'Stock insuficiente para uno o más productos de tu carrito.' },
          { status: 409 }
        );
      })
    );

    renderCartPage();

    await waitFor(() => {
      const payBtn = screen.getByRole('button', { name: /Pagar/i });
      expect(payBtn).not.toBeDisabled();
    });

    const payBtn = screen.getByRole('button', { name: /Pagar/i });
    await user.click(payBtn);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/Stock insuficiente/i);
    });
  });
});
