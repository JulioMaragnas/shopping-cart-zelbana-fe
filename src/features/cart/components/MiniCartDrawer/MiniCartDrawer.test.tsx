import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route, useNavigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { server } from '../../../../mocks/server';
import { MiniCartDrawer } from './MiniCartDrawer';
import { useCartStore } from '../../store/useCartStore';

const RouteChangeButton = () => {
  const navigate = useNavigate();
  return (
    <div>
      <button onClick={() => navigate('/cart')}>Go to Cart</button>
      <button onClick={() => navigate('/checkout/order-123')}>Go to Checkout</button>
    </div>
  );
};

const createWrapper = (initialEntries = ['/']) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={initialEntries}>
        <Routes>
          <Route
            path="*"
            element={
              <>
                <RouteChangeButton />
                {children}
              </>
            }
          />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
};

describe('MiniCartDrawer Component', () => {
  beforeEach(() => {
    useCartStore.getState().clearCart();
    useCartStore.getState().closeDrawer();
    document.body.style.overflow = '';

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
      }),
      http.post('*/storefront/api/cart/validate', () => {
        return HttpResponse.json({
          items: [
            {
              productId: 'prod-1',
              name: 'Serum Vitamina C',
              thumbnailUrl: '/products/serum.webp',
              quantityRequested: 1,
              quantityFulfilled: 1,
              availableStock: 5,
              salePrice: 20.0,
              unitPrice: 20.0,
              discountPercentage: 0,
              subtotal: 20.0,
              message: '',
            },
          ],
          totalAmount: 20.0,
          isValid: true,
          shippingPromotion: {
            enabled: true,
            threshold: 50.0,
            currentAmount: 20.0,
            missingAmount: 30.0,
            percentage: 40,
            isFreeShippingUnlocked: false,
            upsellProducts: [
              {
                id: 'upsell-1',
                name: 'Tónico Botánico',
                thumbnailUrl: '/products/tonico.webp',
                salePrice: 15.0,
                discountPercentage: 0,
                categoryId: 'cat-3',
                categoryName: 'Cuidado Facial',
                disponible: true,
                maxOrderQuantity: 5,
                coversMissingAmount: false,
              },
            ],
          },
        });
      })
    );
  });

  it('does not render when isDrawerOpen is false', () => {
    render(<MiniCartDrawer />, { wrapper: createWrapper() });
    expect(screen.queryByTestId('mini-cart-drawer')).not.toBeInTheDocument();
    expect(screen.queryByTestId('mini-cart-backdrop')).not.toBeInTheDocument();
  });

  it('renders correctly when open with WAI-ARIA attributes', async () => {
    useCartStore.getState().openDrawer();
    render(<MiniCartDrawer />, { wrapper: createWrapper() });

    const drawer = screen.getByTestId('mini-cart-drawer');
    expect(drawer).toBeInTheDocument();
    expect(drawer).toHaveAttribute('role', 'dialog');
    expect(drawer).toHaveAttribute('aria-modal', 'true');
    expect(drawer).toHaveAttribute('aria-labelledby', 'mini-cart-title');

    expect(screen.getByTestId('mini-cart-backdrop')).toBeInTheDocument();
    expect(screen.getByTestId('mini-cart-close-btn')).toBeInTheDocument();
  });

  it('TDD-FE-MC-07: closes drawer via close button, backdrop click, or Escape key, and manages body scroll lock', async () => {
    const user = userEvent.setup();
    useCartStore.getState().openDrawer();

    const { unmount } = render(<MiniCartDrawer />, { wrapper: createWrapper() });
    expect(document.body.style.overflow).toBe('hidden');

    // Close button test
    const closeBtn = screen.getByTestId('mini-cart-close-btn');
    await user.click(closeBtn);
    expect(useCartStore.getState().isDrawerOpen).toBe(false);
    expect(document.body.style.overflow).toBe('');

    // Reopen and close with backdrop
    act(() => {
      useCartStore.getState().openDrawer();
    });
    expect(document.body.style.overflow).toBe('hidden');
    const backdrop = screen.getByTestId('mini-cart-backdrop');
    await user.click(backdrop);
    expect(useCartStore.getState().isDrawerOpen).toBe(false);
    expect(document.body.style.overflow).toBe('');

    // Reopen and close with Escape key
    act(() => {
      useCartStore.getState().openDrawer();
    });
    expect(document.body.style.overflow).toBe('hidden');
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(useCartStore.getState().isDrawerOpen).toBe(false);
    expect(document.body.style.overflow).toBe('');

    // Unmount restores scroll lock
    act(() => {
      useCartStore.getState().openDrawer();
    });
    expect(document.body.style.overflow).toBe('hidden');
    unmount();
    expect(document.body.style.overflow).toBe('');
  });

  it('TDD-FE-MC-06: automatically closes drawer on route change to /cart or /checkout/*', async () => {
    const user = userEvent.setup();
    useCartStore.getState().openDrawer();

    render(<MiniCartDrawer />, { wrapper: createWrapper(['/']) });
    expect(useCartStore.getState().isDrawerOpen).toBe(true);

    const goToCartBtn = screen.getByText('Go to Cart');
    await user.click(goToCartBtn);

    expect(useCartStore.getState().isDrawerOpen).toBe(false);
    expect(screen.queryByTestId('mini-cart-drawer')).not.toBeInTheDocument();
  });

  it('TDD-FE-MC-08: renders free shipping progress and upsell carousel when eligible', async () => {
    const user = userEvent.setup();
    useCartStore.getState().addItem({
      id: 'prod-1',
      name: 'Serum Vitamina C',
      priceWhenAdded: 20.0,
      quantity: 1,
    });
    useCartStore.getState().openDrawer();

    render(<MiniCartDrawer />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByTestId('mini-cart-free-shipping-progress')).toBeInTheDocument();
    });

    expect(screen.getByTestId('mini-cart-free-shipping-progress')).toHaveTextContent(
      /¡Te faltan \$30\.00 para tener ENVÍO GRATIS!/i
    );

    const upsellCarousel = await screen.findByTestId('mini-cart-upsell-carousel');
    expect(upsellCarousel).toBeInTheDocument();


    const addUpsellBtn = screen.getByTestId('mini-cart-upsell-add-btn-upsell-1');
    expect(addUpsellBtn).toBeInTheDocument();

    await user.click(addUpsellBtn);

    const cart = useCartStore.getState().cart;
    expect(cart.some((item) => item.id === 'upsell-1')).toBe(true);
  });

  it('hides free shipping progress bar when freeShippingEnabled is false', async () => {
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
      }),
      http.post('*/storefront/api/cart/validate', () => {
        return HttpResponse.json({
          items: [
            {
              productId: 'prod-1',
              name: 'Serum Vitamina C',
              thumbnailUrl: '/products/serum.webp',
              quantityRequested: 1,
              quantityFulfilled: 1,
              availableStock: 5,
              salePrice: 20.0,
              unitPrice: 20.0,
              discountPercentage: 0,
              subtotal: 20.0,
              message: '',
            },
          ],
          totalAmount: 20.0,
          isValid: true,
          shippingPromotion: {
            enabled: false,
            threshold: 50.0,
            currentAmount: 20.0,
            missingAmount: 30.0,
            percentage: 40,
            isFreeShippingUnlocked: false,
            upsellProducts: [],
          },
        });
      })
    );

    useCartStore.getState().addItem({
      id: 'prod-1',
      name: 'Serum Vitamina C',
      priceWhenAdded: 20.0,
      quantity: 1,
    });
    useCartStore.getState().openDrawer();

    render(<MiniCartDrawer />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByTestId('mini-cart-item-prod-1')).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.queryByTestId('mini-cart-free-shipping-progress')).not.toBeInTheDocument();
    });
  });

  it('renders item list with stepper and remove actions', async () => {
    const user = userEvent.setup();
    useCartStore.getState().addItem({
      id: 'prod-1',
      name: 'Serum Vitamina C',
      priceWhenAdded: 20.0,
      quantity: 2,
    });
    useCartStore.getState().openDrawer();

    render(<MiniCartDrawer />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByTestId('mini-cart-item-prod-1')).toBeInTheDocument();
    });

    // Increase qty
    const increaseBtn = screen.getByTestId('mini-cart-increase-qty-prod-1');
    await user.click(increaseBtn);
    expect(useCartStore.getState().cart[0].quantity).toBe(3);

    // Decrease qty
    const decreaseBtn = screen.getByTestId('mini-cart-decrease-qty-prod-1');
    await user.click(decreaseBtn);
    expect(useCartStore.getState().cart[0].quantity).toBe(2);

    // Remove item
    const removeBtn = screen.getByTestId('mini-cart-remove-item-prod-1');
    await user.click(removeBtn);
    expect(useCartStore.getState().cart).toHaveLength(0);
  });

  it('renders Empty State with explore button that closes the drawer', async () => {
    const user = userEvent.setup();
    useCartStore.getState().clearCart();
    useCartStore.getState().openDrawer();

    render(<MiniCartDrawer />, { wrapper: createWrapper() });

    const emptyState = screen.getByTestId('mini-cart-empty-state');
    expect(emptyState).toBeInTheDocument();
    expect(screen.getByText(/Tu carrito está vacío/i)).toBeInTheDocument();

    const exploreBtn = screen.getByTestId('mini-cart-explore-btn');
    await user.click(exploreBtn);

    expect(useCartStore.getState().isDrawerOpen).toBe(false);
  });

  it('renders Error State with retry button when validation fails', async () => {
    server.use(
      http.post('*/storefront/api/cart/validate', () => {
        return new HttpResponse(null, { status: 500 });
      })
    );

    useCartStore.getState().addItem({
      id: 'prod-1',
      name: 'Serum Vitamina C',
      priceWhenAdded: 20.0,
      quantity: 1,
    });
    useCartStore.getState().openDrawer();

    render(<MiniCartDrawer />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByTestId('mini-cart-error-banner')).toBeInTheDocument();
    });

    const retryBtn = screen.getByTestId('mini-cart-retry-btn');
    expect(retryBtn).toBeInTheDocument();
  });

  it('renders Partial/Edge State and stock adjustment button when cart is invalid', async () => {
    const user = userEvent.setup();
    server.use(
      http.post('*/storefront/api/cart/validate', () => {
        return HttpResponse.json({
          items: [
            {
              productId: 'prod-1',
              name: 'Serum Vitamina C',
              thumbnailUrl: '/products/serum.webp',
              quantityRequested: 5,
              quantityFulfilled: 2,
              availableStock: 2,
              salePrice: 20.0,
              unitPrice: 20.0,
              discountPercentage: 0,
              subtotal: 40.0,
              message: 'Solo quedan 2 unidades disponibles',
            },
          ],
          totalAmount: 40.0,
          isValid: false,
        });
      })
    );

    useCartStore.getState().addItem({
      id: 'prod-1',
      name: 'Serum Vitamina C',
      priceWhenAdded: 20.0,
      quantity: 5,
    });
    useCartStore.getState().openDrawer();

    render(<MiniCartDrawer />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByTestId('mini-cart-adjust-stock-btn')).toBeInTheDocument();
    });

    expect(screen.getByText(/Solo quedan 2 unidades disponibles/i)).toBeInTheDocument();

    const adjustBtn = screen.getByTestId('mini-cart-adjust-stock-btn');
    await user.click(adjustBtn);

    expect(useCartStore.getState().cart[0].quantity).toBe(2);
  });

  it('renders footer totals, checkout button, and view full cart link', async () => {
    const user = userEvent.setup();
    useCartStore.getState().addItem({
      id: 'prod-1',
      name: 'Serum Vitamina C',
      priceWhenAdded: 20.0,
      quantity: 1,
    });
    useCartStore.getState().openDrawer();

    render(<MiniCartDrawer />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByTestId('mini-cart-total-amount')).toBeInTheDocument();
    });

    expect(screen.getByTestId('mini-cart-total-amount')).toHaveTextContent('$20.00');

    await waitFor(() => {
      expect(screen.getByTestId('mini-cart-checkout-btn')).toHaveTextContent(/Ir a Pagar/i);
    });

    const fullCartLink = screen.getByTestId('mini-cart-view-full-cart-link');
    expect(fullCartLink).toHaveTextContent(/Ver carrito completo/i);

    await user.click(screen.getByTestId('mini-cart-checkout-btn'));
    expect(useCartStore.getState().isDrawerOpen).toBe(false);
  });
});
