import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { useReorder } from './useReorder';
import { useCartStore } from '../../cart/store/useCartStore';
import { server } from '../../../mocks/server';
import { http, HttpResponse } from 'msw';
import type { PaidOrder } from '../types/orders.types';

describe('useReorder Hook (TDD-FE-ORD-08, TC-UI-ORD-07, TC-UI-ORD-08)', () => {
  beforeEach(() => {
    useCartStore.getState().clearCart();
    useCartStore.getState().closeDrawer();
  });

  const baseOrder: PaidOrder = {
    orderId: 'ORD-1760731845000',
    customerEmail: 'maria@email.com',
    shippingAddress: 'Calle 93 # 14-20',
    createdAt: '2026-10-14T15:42:00.000Z',
    status: 'PAID',
    totalAmount: 142500,
    items: [
      {
        productId: '1',
        name: 'Serum Niacinamida 10%',
        thumbnailUrl: '/thumb1.webp',
        quantity: 2,
        salePrice: 62000,
      },
    ],
  };

  it('TC-UI-ORD-07: adds all fulfilled items to cart, opens mini cart drawer, and returns success feedback', async () => {
    server.use(
      http.post('*/storefront/api/cart/validate', () => {
        return HttpResponse.json({
          items: [
            {
              productId: '1',
              name: 'Serum Niacinamida 10%',
              thumbnailUrl: '/thumb1.webp',
              quantityRequested: 2,
              quantityFulfilled: 2,
              availableStock: 10,
              salePrice: 62000,
              unitPrice: 62000,
              discountPercentage: 0,
              subtotal: 124000,
              message: 'Stock disponible',
            },
          ],
          totalAmount: 124000,
          isValid: true,
          shippingPromotion: { enabled: false, threshold: 0, currentAmount: 124000, missingAmount: 0, percentage: 100, isFreeShippingUnlocked: false, upsellProducts: [] },
        });
      })
    );

    const { result } = renderHook(() => useReorder());

    expect(result.current.isReordering).toBe(false);

    await act(async () => {
      await result.current.reorder(baseOrder);
    });

    expect(result.current.isReordering).toBe(false);
    expect(useCartStore.getState().cart).toHaveLength(1);
    expect(useCartStore.getState().cart[0]).toEqual({
      id: '1',
      name: 'Serum Niacinamida 10%',
      thumbnailUrl: '/thumb1.webp',
      priceWhenAdded: 62000,
      quantity: 2,
    });
    expect(useCartStore.getState().isDrawerOpen).toBe(true);
    expect(result.current.feedback?.type).toBe('success');
    expect(result.current.feedback?.addedCount).toBe(1);
  });

  it('TC-UI-ORD-08: handles partial reorder when some items are out of stock', async () => {
    const multiItemOrder: PaidOrder = {
      ...baseOrder,
      items: [
        {
          productId: '1',
          name: 'Serum Niacinamida 10%',
          thumbnailUrl: '/thumb1.webp',
          quantity: 2,
          salePrice: 62000,
        },
        {
          productId: '3',
          name: 'Exfoliante Corporal Café & Coco',
          thumbnailUrl: '/thumb3.webp',
          quantity: 1,
          salePrice: 45500,
        },
      ],
    };

    server.use(
      http.post('*/storefront/api/cart/validate', () => {
        return HttpResponse.json({
          items: [
            {
              productId: '1',
              name: 'Serum Niacinamida 10%',
              thumbnailUrl: '/thumb1.webp',
              quantityRequested: 2,
              quantityFulfilled: 2,
              availableStock: 10,
              salePrice: 62000,
              unitPrice: 62000,
              discountPercentage: 0,
              subtotal: 124000,
              message: 'Stock disponible',
            },
            {
              productId: '3',
              name: 'Exfoliante Corporal Café & Coco',
              thumbnailUrl: '/thumb3.webp',
              quantityRequested: 1,
              quantityFulfilled: 0,
              availableStock: 0,
              salePrice: 45500,
              unitPrice: 45500,
              discountPercentage: 0,
              subtotal: 0,
              message: 'Producto agotado',
            },
          ],
          totalAmount: 124000,
          isValid: false,
          shippingPromotion: { enabled: false, threshold: 0, currentAmount: 124000, missingAmount: 0, percentage: 100, isFreeShippingUnlocked: false, upsellProducts: [] },
        });
      })
    );

    const { result } = renderHook(() => useReorder());

    await act(async () => {
      await result.current.reorder(multiItemOrder);
    });

    // Only item 1 is added to cart
    expect(useCartStore.getState().cart).toHaveLength(1);
    expect(useCartStore.getState().cart[0].id).toBe('1');
    expect(useCartStore.getState().isDrawerOpen).toBe(true);

    expect(result.current.feedback?.type).toBe('partial');
    expect(result.current.feedback?.addedCount).toBe(1);
    expect(result.current.feedback?.outOfStockItems).toContain('Exfoliante Corporal Café & Coco');
    expect(result.current.feedback?.message).toContain('Exfoliante Corporal Café & Coco');
  });

  it('handles total out of stock gracefully without modifying cart', async () => {
    server.use(
      http.post('*/storefront/api/cart/validate', () => {
        return HttpResponse.json({
          items: [
            {
              productId: '1',
              name: 'Serum Niacinamida 10%',
              thumbnailUrl: '/thumb1.webp',
              quantityRequested: 2,
              quantityFulfilled: 0,
              availableStock: 0,
              salePrice: 62000,
              unitPrice: 62000,
              discountPercentage: 0,
              subtotal: 0,
              message: 'Producto agotado',
            },
          ],
          totalAmount: 0,
          isValid: false,
          shippingPromotion: { enabled: false, threshold: 0, currentAmount: 0, missingAmount: 0, percentage: 0, isFreeShippingUnlocked: false, upsellProducts: [] },
        });
      })
    );

    const { result } = renderHook(() => useReorder());

    await act(async () => {
      await result.current.reorder(baseOrder);
    });

    expect(useCartStore.getState().cart).toHaveLength(0);
    expect(useCartStore.getState().isDrawerOpen).toBe(false);
    expect(result.current.feedback?.type).toBe('out_of_stock');
    expect(result.current.feedback?.message).toContain('agotados temporalmente');
  });

  it('handles network error cleanly', async () => {
    server.use(
      http.post('*/storefront/api/cart/validate', () => {
        return HttpResponse.error();
      })
    );

    const { result } = renderHook(() => useReorder());

    await act(async () => {
      await result.current.reorder(baseOrder);
    });

    expect(result.current.isReordering).toBe(false);
    expect(result.current.feedback?.type).toBe('error');
  });
});
