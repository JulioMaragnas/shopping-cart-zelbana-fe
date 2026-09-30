import { describe, it, expect, beforeEach } from 'vitest';
import { useCartStore } from './useCartStore';

describe('useCartStore', () => {
  beforeEach(() => {
    useCartStore.getState().clearCart();
  });

  it('adds an item to the cart', () => {
    useCartStore.getState().addItem({
      id: '1',
      name: 'Test Product',
      priceWhenAdded: 100,
      quantity: 1
    });

    const cart = useCartStore.getState().cart;
    expect(cart).toHaveLength(1);
    expect(cart[0].id).toBe('1');
    expect(cart[0].quantity).toBe(1);
  });

  it('increments quantity if item already exists', () => {
    useCartStore.getState().addItem({ id: '1', name: 'Test Product', priceWhenAdded: 100, quantity: 1 });
    useCartStore.getState().addItem({ id: '1', name: 'Test Product', priceWhenAdded: 100, quantity: 2 });

    const cart = useCartStore.getState().cart;
    expect(cart).toHaveLength(1);
    expect(cart[0].quantity).toBe(3);
  });

  it('removes an item from the cart', () => {
    useCartStore.getState().addItem({ id: '1', name: 'Test Product', priceWhenAdded: 100, quantity: 1 });
    useCartStore.getState().removeItem('1');

    const cart = useCartStore.getState().cart;
    expect(cart).toHaveLength(0);
  });

  it('updates the quantity of an item', () => {
    useCartStore.getState().addItem({ id: '1', name: 'Test Product', priceWhenAdded: 100, quantity: 1 });
    useCartStore.getState().updateQuantity('1', 5);

    const cart = useCartStore.getState().cart;
    expect(cart[0].quantity).toBe(5);
  });
});
