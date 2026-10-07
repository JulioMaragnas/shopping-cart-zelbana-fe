import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
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

describe('ProductDetailPage Component (Fases 3.1, 3.2, 3.3, 3.4)', () => {
  beforeEach(() => {
    useCartStore.getState().clearCart();
  });

  it('TC-PDP-3.1.1 & TC-PDP-3.2.1: renders multi-photo gallery, switches active photo on thumbnail click, and displays -20% OFF without originalPrice', async () => {
    const user = userEvent.setup();
    renderPDP('1');

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Jeep wrangler' })).toBeInTheDocument();
    });

    expect(screen.getByText('$45000.00')).toBeInTheDocument();
    expect(screen.getByText('-20% OFF')).toBeInTheDocument();
    expect(screen.queryByText('$48000.00')).not.toBeInTheDocument();

    // Gallery has 3 thumbnails for product 1
    const thumb1 = screen.getByRole('button', { name: /Ver foto 1/i });
    const thumb2 = screen.getByRole('button', { name: /Ver foto 2/i });
    const thumb3 = screen.getByRole('button', { name: /Ver foto 3/i });
    expect(thumb1).toBeInTheDocument();
    expect(thumb2).toBeInTheDocument();
    expect(thumb3).toBeInTheDocument();

    const mainImg = screen.getByRole('img', { name: 'Jeep wrangler' });
    expect(mainImg.getAttribute('src')).toContain('prod-1-1.webp');

    await user.click(thumb2);
    expect(mainImg.getAttribute('src')).toContain('prod-1-2.webp');
  });

  it('TC-PDP-3.1.2 & TC-PDP-3.2.2: hides thumbnail strip when product has only 1 photo and hides discount badge when discountPercentage is 0', async () => {
    renderPDP('2'); // Product 2 has 1 photo and discountPercentage: 0

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Jeep grand cherokee' })).toBeInTheDocument();
    });

    expect(screen.getByText('$55000.00')).toBeInTheDocument();
    expect(screen.queryByText(/% OFF/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Ver foto/i })).not.toBeInTheDocument();
  });

  it('TC-PDP-3.1.4: shows fallback placeholder when main image fails to load (onError) without external placeholder URL', async () => {
    renderPDP('1');

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Jeep wrangler' })).toBeInTheDocument();
    });

    const mainImg = screen.getByRole('img', { name: 'Jeep wrangler' });
    fireEvent.error(mainImg);

    expect(screen.getByText(/Sin imagen disponible/i)).toBeInTheDocument();
  });

  it('TC-PDP-3.3.2: renders clickable categoryName and dynamic specs without hardcoded cosmetics text', async () => {
    renderPDP('1');

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Jeep wrangler' })).toBeInTheDocument();
    });

    const categoryLink = screen.getByRole('link', { name: 'Jabones Artesanales' });
    expect(categoryLink).toHaveAttribute('href', '/?categoryId=cat-3&page=1');

    expect(screen.getByText(/4x4 Command-Trac/i)).toBeInTheDocument();
    expect(screen.getByText(/5 pasajeros/i)).toBeInTheDocument();

    // Ensure hardcoded texts are completely gone
    expect(screen.queryByText(/Cosmética e higiene artesanal/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Sellado de fábrica con certificación sanitaria/i)).not.toBeInTheDocument();
  });

  it('TC-PDP-3.4.1 & TC-PDP-3.4.2: obfuscates exact inventory count in lowStock badge and limits quantity selector by subtracting quantityInCart', async () => {
    useCartStore.getState().addItem({
      id: '2',
      name: 'Jeep grand cherokee',
      thumbnailUrl: '/products/prod-2-thumb.webp',
      priceWhenAdded: 55000,
      quantity: 2,
    });

    renderPDP('2'); // Product 2 has lowStock: true, maxOrderQuantity: 3

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Jeep grand cherokee' })).toBeInTheDocument();
    });

    // Shows lowStock badge without "(3 en inventario)"
    expect(screen.getByText('¡Pocas unidades disponibles!')).toBeInTheDocument();
    expect(screen.queryByText(/en inventario/i)).not.toBeInTheDocument();

    // Shows cart notice and caps max selectable to remainingAvailable = 3 - 2 = 1
    expect(screen.getByText(/Ya tienes 2 unidad\(es\) en tu carrito/i)).toBeInTheDocument();
    const qtyInput = screen.getByLabelText(/Cantidad/i);
    expect(qtyInput).toHaveAttribute('max', '1');
  });

  it('TC-PDP-3.4.3: disables selector and button with "Máximo en carrito" when quantityInCart >= maxOrderQuantity', async () => {
    useCartStore.getState().addItem({
      id: '2',
      name: 'Jeep grand cherokee',
      thumbnailUrl: '/products/prod-2-thumb.webp',
      priceWhenAdded: 55000,
      quantity: 3,
    });

    renderPDP('2'); // maxOrderQuantity is 3

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Jeep grand cherokee' })).toBeInTheDocument();
    });

    const addBtn = screen.getByRole('button', { name: /Máximo en carrito/i });
    expect(addBtn).toBeDisabled();
    expect(screen.getByLabelText(/Cantidad/i)).toBeDisabled();
    expect(
      screen.getByText(/Ya tienes el máximo de unidades disponibles en tu carrito/i)
    ).toBeInTheDocument();
  });

  it('allows increasing quantity and adding item with thumbnailUrl to the cart', async () => {
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
    expect(cart[0].thumbnailUrl).toContain('/products/prod-1-thumb.webp');
  });

  it('TC-PDP-3.4.4: shows Agotado and disables button if product stock is 0', async () => {
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
