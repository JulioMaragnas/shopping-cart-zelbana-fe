import { useState } from 'react';
import { useCartStore } from '../../cart/store/useCartStore';
import type { PaidOrder, ReorderFeedback } from '../types/orders.types';

export const useReorder = () => {
  const addItem = useCartStore((state) => state.addItem);
  const openDrawer = useCartStore((state) => state.openDrawer);
  const [isReordering, setIsReordering] = useState(false);
  const [feedback, setFeedback] = useState<ReorderFeedback | null>(null);

  const reorder = async (order: PaidOrder) => {
    setIsReordering(true);
    setFeedback(null);

    try {
      const payload = {
        cart: order.items.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
        })),
      };

      const response = await fetch('/storefront/api/cart/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Error al validar el inventario actual.');
      }

      const data = await response.json();
      const fulfilledItems = (data.items || []).filter((i: any) => i.quantityFulfilled > 0);
      const outOfStockItems = (data.items || []).filter((i: any) => i.quantityFulfilled === 0);

      if (fulfilledItems.length === 0) {
        setFeedback({
          type: 'out_of_stock',
          message: 'Lo sentimos, los productos de este pedido se encuentran agotados temporalmente.',
          addedCount: 0,
          outOfStockItems: outOfStockItems.map((i: any) => i.name),
        });
        setIsReordering(false);
        return;
      }

      for (const item of fulfilledItems) {
        addItem({
          id: item.productId,
          name: item.name,
          thumbnailUrl: item.thumbnailUrl,
          priceWhenAdded: item.salePrice,
          quantity: item.quantityFulfilled,
        });
      }

      if (typeof openDrawer === 'function') {
        openDrawer();
      }

      if (outOfStockItems.length > 0) {
        const outNames = outOfStockItems.map((i: any) => `'${i.name}'`).join(', ');
        setFeedback({
          type: 'partial',
          message: `⚠️ Agregamos ${fulfilledItems.length} producto(s) a tu carrito. ${outNames} está agotado en este momento.`,
          addedCount: fulfilledItems.length,
          outOfStockItems: outOfStockItems.map((i: any) => i.name),
        });
      } else {
        setFeedback({
          type: 'success',
          message: '✓ ¡Agregamos todos los productos de tu pedido al carrito!',
          addedCount: fulfilledItems.length,
          outOfStockItems: [],
        });
      }
    } catch (err: unknown) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'No fue posible procesar la recompra.',
        addedCount: 0,
        outOfStockItems: [],
      });
    } finally {
      setIsReordering(false);
    }
  };

  return {
    reorder,
    isReordering,
    feedback,
    clearFeedback: () => setFeedback(null),
  };
};
