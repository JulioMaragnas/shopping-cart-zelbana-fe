import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HelmetProvider } from 'react-helmet-async';
import { ProductDetailPage } from './ProductDetailPage';
import { useCartStore } from '../../cart/store/useCartStore';

const renderPDP = (productId = '1') => {
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

describe('ProductDetailPage Component', () => {
  beforeEach(() => {
    useCartStore.getState().clearCart();
  });

  it('renders product details correctly for an available product', async () => {
    renderPDP('1');

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Jeep wrangler' })).toBeInTheDocument();
    });

    expect(screen.getByText(/\$45000\.00/i)).toBeInTheDocument();
    expect(screen.getByText(/\$48000\.00/i)).toBeInTheDocument(); // original price
    expect(screen.getByText(/Todoterreno clásico/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Agregar al Carrito/i })).toBeInTheDocument();
  });

  it('allows increasing quantity and adding item to the cart', async () => {
    const user = userEvent.setup();
    renderPDP('1');

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Jeep wrangler' })).toBeInTheDocument();
    });

    const qtyInput = screen.getByLabelText(/Cantidad/i);
    await user.clear(qtyInput);
    await user.type(qtyInput, '3');

    const addBtn = screen.getByRole('button', { name: /Agregar al Carrito/i });
    await user.click(addBtn);

    const cart = useCartStore.getState().cart;
    expect(cart).toHaveLength(1);
    expect(cart[0].id).toBe('1');
    expect(cart[0].quantity).toBe(3);
  });

  it('shows Agotado and disables button if product stock is 0', async () => {
    renderPDP('3'); // Jeep rubicon has stock 0 in mock

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Jeep rubicon' })).toBeInTheDocument();
    });

    const addBtn = screen.getByRole('button', { name: /Agotado/i });
    expect(addBtn).toBeDisabled();
    expect(screen.getByText(/Producto Agotado/i)).toBeInTheDocument();
  });

  it('displays error state when product does not exist', async () => {
    renderPDP('999');

    await waitFor(() => {
      expect(screen.getByText(/Producto no encontrado/i)).toBeInTheDocument();
    });
  });
});
