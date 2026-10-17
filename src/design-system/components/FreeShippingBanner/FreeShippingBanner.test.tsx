import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { server } from '../../../mocks/server';
import { FreeShippingBanner } from './FreeShippingBanner';
import { useCartStore } from '../../../features/cart/store/useCartStore';

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>{children}</MemoryRouter>
    </QueryClientProvider>
  );
};

describe('TDD-FE-FS-02 & TDD-FE-FS-03: FreeShippingBanner Component', () => {
  beforeEach(() => {
    useCartStore.setState({ cart: [] });
    useCartStore.getState().closeDrawer();
    server.use(
      http.get('*/storefront/api/settings', () => {
        return HttpResponse.json({
          freeShippingEnabled: true,
          freeShippingThreshold: 50.0,
        });
      }),
      http.get('*/api/settings', () => {
        return HttpResponse.json({
          freeShippingEnabled: true,
          freeShippingThreshold: 50.0,
        });
      })
    );
  });

  it('TC-UI-FS-01: renders empty state message with threshold when cart is empty', async () => {
    render(<FreeShippingBanner />, { wrapper: createWrapper() });

    const banner = await screen.findByTestId('free-shipping-banner');
    expect(banner).toBeInTheDocument();

    const emptyText = screen.getByTestId('free-shipping-banner-empty');
    expect(emptyText).toHaveTextContent(/Envío GRATIS en todos los pedidos superiores a \$50\.00/i);
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    expect(screen.queryByTestId('banner-cart-link')).not.toBeInTheDocument();
  });

  it('TC-UI-FS-02: renders in-progress bar with missing amount and Ver carrito link when cart is partially filled', async () => {
    useCartStore.setState({
      cart: [
        {
          id: 'prod-1',
          name: 'Contorno Cafeína',
          thumbnailUrl: null,
          priceWhenAdded: 20.0,
          quantity: 1,
        },
      ],
    });

    render(<FreeShippingBanner />, { wrapper: createWrapper() });

    const banner = await screen.findByTestId('free-shipping-banner');
    expect(banner).toBeInTheDocument();

    const progressSection = screen.getByTestId('free-shipping-banner-progress');
    expect(progressSection).toHaveTextContent(/¡Te faltan \$30\.00 para tener ENVÍO GRATIS!/i);

    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toHaveAttribute('aria-valuenow', '40');
    expect(progressBar).toHaveAttribute('aria-valuemin', '0');
    expect(progressBar).toHaveAttribute('aria-valuemax', '100');

    const cartLink = screen.getByTestId('banner-cart-link');
    expect(cartLink).toHaveTextContent(/Ver carrito →/i);
    expect(cartLink).toHaveAttribute('href', '/cart');

    expect(useCartStore.getState().isDrawerOpen).toBe(false);
    cartLink.click();
    expect(useCartStore.getState().isDrawerOpen).toBe(true);
  });


  it('TC-UI-FS-03: renders unlocked emerald banner with Ir a pagar link when cart exceeds threshold', async () => {
    useCartStore.setState({
      cart: [
        {
          id: 'prod-1',
          name: 'Serum Vitamina C',
          thumbnailUrl: null,
          priceWhenAdded: 35.0,
          quantity: 1,
        },
        {
          id: 'prod-2',
          name: 'Crema Ceramidas',
          thumbnailUrl: null,
          priceWhenAdded: 25.0,
          quantity: 1,
        },
      ],
    });

    render(<FreeShippingBanner />, { wrapper: createWrapper() });

    const banner = await screen.findByTestId('free-shipping-banner');
    expect(banner).toBeInTheDocument();

    const unlockedSection = screen.getByTestId('free-shipping-banner-unlocked');
    expect(unlockedSection).toHaveTextContent(/¡Tienes ENVÍO GRATIS desbloqueado en tu carrito!/i);

    const payLink = screen.getByTestId('banner-cart-link');
    expect(payLink).toHaveTextContent(/Ir a pagar →/i);
    expect(payLink).toHaveAttribute('href', '/cart');
  });

  it('TC-UI-FS-04 / TDD-FE-FS-03: returns null when freeShippingEnabled is false', async () => {
    server.use(
      http.get('*/storefront/api/settings', () => {
        return HttpResponse.json({
          freeShippingEnabled: false,
          freeShippingThreshold: 50.0,
        });
      }),
      http.get('*/api/settings', () => {
        return HttpResponse.json({
          freeShippingEnabled: false,
          freeShippingThreshold: 50.0,
        });
      })
    );

    render(<FreeShippingBanner />, { wrapper: createWrapper() });

    // Cuando el feature flag está deshabilitado, el banner no existe en el DOM
    await screen.findByRole('heading', { name: /algo/i }).catch(() => {});
    expect(screen.queryByTestId('free-shipping-banner')).not.toBeInTheDocument();
  });

  it('reactively updates in real-time when item is added to cart (<16ms Zustand sync)', async () => {
    render(<FreeShippingBanner />, { wrapper: createWrapper() });

    expect(await screen.findByTestId('free-shipping-banner-empty')).toBeInTheDocument();

    // Simular que el usuario añade un producto
    act(() => {
      useCartStore.getState().addItem({
        id: 'prod-quick',
        name: 'Tónico Botánico',
        thumbnailUrl: null,
        priceWhenAdded: 15.0,
        quantity: 1,
      });
    });

    expect(screen.getByTestId('free-shipping-banner-progress')).toHaveTextContent(
      /¡Te faltan \$35\.00 para tener ENVÍO GRATIS!/i
    );
  });
});
