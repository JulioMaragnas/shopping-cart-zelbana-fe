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
      expect(screen.getByText(/Hemos ajustado tu carrito/i)).toBeInTheDocument();
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
      expect(screen.getByText(/fueron removidos/i)).toBeInTheDocument();
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

  it('TDD-FE-FS-04 & TC-UI-FS-05: renders FreeShippingUpsellCarousel with progress bar and upsell cards when goal is in progress', async () => {
    server.use(
      http.post('*/storefront/api/cart/validate', () => {
        return HttpResponse.json({
          items: [
            {
              productId: 'prod-item-1',
              name: 'Contorno Cafeína',
              thumbnailUrl: null,
              quantityRequested: 1,
              quantityFulfilled: 1,
              availableStock: 10,
              salePrice: 35.0,
              unitPrice: 35.0,
              discountPercentage: 0,
              subtotal: 35.0,
              message: 'Stock disponible',
            },
          ],
          totalAmount: 35.0,
          isValid: true,
          shippingPromotion: {
            enabled: true,
            threshold: 50.0,
            currentAmount: 35.0,
            missingAmount: 15.0,
            percentage: 70,
            isFreeShippingUnlocked: false,
            upsellProducts: [
              {
                id: 'prod-upsell-1',
                name: 'Serum Vitamina C',
                thumbnailUrl: '/products/serum.webp',
                salePrice: 16.5,
                discountPercentage: 0,
                categoryId: 'cat-facial',
                categoryName: 'Cuidado Facial',
                disponible: true,
                maxOrderQuantity: 10,
                coversMissingAmount: true,
              },
            ],
          },
        });
      })
    );

    useCartStore.getState().addItem({
      id: 'prod-item-1',
      name: 'Contorno Cafeína',
      priceWhenAdded: 35.0,
      quantity: 1,
    });

    renderCartPage();

    await waitFor(() => {
      expect(screen.getByTestId('free-shipping-upsell-container')).toBeInTheDocument();
      expect(screen.getByTestId('free-shipping-goal-missing')).toHaveTextContent(/¡Te faltan \$15\.00 para tener ENVÍO GRATIS!/i);
      expect(screen.getByTestId('free-shipping-percentage-text')).toHaveTextContent('70%');
      expect(screen.getByTestId('upsell-carousel-section')).toBeInTheDocument();
      expect(screen.getByTestId('upsell-card-prod-upsell-1')).toBeInTheDocument();
      expect(screen.getByTestId('upsell-badge-covers-prod-upsell-1')).toHaveTextContent(/✨ ¡Te da Envío Gratis!/i);
      expect(screen.getByTestId('summary-shipping-pending')).toHaveTextContent(/Faltan \$15\.00/i);
    });
  });

  it('TDD-FE-FS-05 & TC-UI-FS-07: adds upsell product to cart on "+ Agregar" click', async () => {
    const user = userEvent.setup();

    server.use(
      http.post('*/storefront/api/cart/validate', () => {
        return HttpResponse.json({
          items: [
            {
              productId: 'prod-item-1',
              name: 'Contorno Cafeína',
              thumbnailUrl: null,
              quantityRequested: 1,
              quantityFulfilled: 1,
              availableStock: 10,
              salePrice: 35.0,
              unitPrice: 35.0,
              discountPercentage: 0,
              subtotal: 35.0,
              message: 'Stock disponible',
            },
          ],
          totalAmount: 35.0,
          isValid: true,
          shippingPromotion: {
            enabled: true,
            threshold: 50.0,
            currentAmount: 35.0,
            missingAmount: 15.0,
            percentage: 70,
            isFreeShippingUnlocked: false,
            upsellProducts: [
              {
                id: 'prod-upsell-1',
                name: 'Serum Vitamina C',
                thumbnailUrl: '/products/serum.webp',
                salePrice: 16.5,
                discountPercentage: 0,
                categoryId: 'cat-facial',
                categoryName: 'Cuidado Facial',
                disponible: true,
                maxOrderQuantity: 10,
                coversMissingAmount: true,
              },
            ],
          },
        });
      })
    );

    useCartStore.getState().addItem({
      id: 'prod-item-1',
      name: 'Contorno Cafeína',
      priceWhenAdded: 35.0,
      quantity: 1,
    });

    renderCartPage();

    await waitFor(() => {
      expect(screen.getByTestId('upsell-add-btn-prod-upsell-1')).toBeInTheDocument();
    });

    const addBtn = screen.getByTestId('upsell-add-btn-prod-upsell-1');
    await user.click(addBtn);

    await waitFor(() => {
      const cart = useCartStore.getState().cart;
      expect(cart.some((item) => item.id === 'prod-upsell-1')).toBe(true);
    });
  });

  it('TDD-FE-FS-06 & TC-UI-FS-08: transitions to unlocked state with 100% green bar, folds upsell carousel, and shows GRATIS in summary', async () => {
    server.use(
      http.post('*/storefront/api/cart/validate', () => {
        return HttpResponse.json({
          items: [
            {
              productId: 'prod-item-1',
              name: 'Serum Vitamina C',
              thumbnailUrl: null,
              quantityRequested: 2,
              quantityFulfilled: 2,
              availableStock: 10,
              salePrice: 30.0,
              unitPrice: 30.0,
              discountPercentage: 0,
              subtotal: 60.0,
              message: 'Stock disponible',
            },
          ],
          totalAmount: 60.0,
          isValid: true,
          shippingPromotion: {
            enabled: true,
            threshold: 50.0,
            currentAmount: 60.0,
            missingAmount: 0,
            percentage: 100,
            isFreeShippingUnlocked: true,
            upsellProducts: [],
          },
        });
      })
    );

    useCartStore.getState().addItem({
      id: 'prod-item-1',
      name: 'Serum Vitamina C',
      priceWhenAdded: 30.0,
      quantity: 2,
    });

    renderCartPage();

    await waitFor(() => {
      expect(screen.getByTestId('free-shipping-goal-unlocked')).toHaveTextContent(/¡Felicidades! Desbloqueaste ENVÍO GRATIS/i);
      expect(screen.getByTestId('free-shipping-progress-fill')).toHaveStyle({ width: '100%' });
      expect(screen.queryByTestId('upsell-carousel-section')).not.toBeInTheDocument();
      expect(screen.getByTestId('summary-shipping-free')).toHaveTextContent(/GRATIS \(\$0\.00\) 🎉/i);
    });
  });
});
