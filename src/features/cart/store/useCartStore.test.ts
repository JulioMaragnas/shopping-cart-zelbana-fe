import { describe, it, expect, beforeEach } from 'vitest';
import { useCartStore } from './useCartStore';

describe('useCartStore', () => {
  beforeEach(() => {
    useCartStore.getState().clearCart();
    useCartStore.getState().closeDrawer();
    localStorage.clear();
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

  describe('Mini-Cart Drawer actions & proactive open rule (TDD-FE-MC-01..03)', () => {
    it('TDD-FE-MC-01: opens drawer proactively on 0 -> 1 transition', () => {
      expect(useCartStore.getState().cart).toHaveLength(0);
      expect(useCartStore.getState().isDrawerOpen).toBe(false);

      useCartStore.getState().addItem({ id: 'prod-1', name: 'Serum Vit C', priceWhenAdded: 25, quantity: 1 });

      expect(useCartStore.getState().cart).toHaveLength(1);
      expect(useCartStore.getState().isDrawerOpen).toBe(true);
    });

    it('TDD-FE-MC-02: does not open drawer on N -> N+1 transition if drawer was closed', () => {
      // First item: opens drawer
      useCartStore.getState().addItem({ id: 'prod-1', name: 'Serum Vit C', priceWhenAdded: 25, quantity: 1 });
      expect(useCartStore.getState().isDrawerOpen).toBe(true);

      // User closes drawer
      useCartStore.getState().closeDrawer();
      expect(useCartStore.getState().isDrawerOpen).toBe(false);

      // Adding second item
      useCartStore.getState().addItem({ id: 'prod-2', name: 'Crema Hidratante', priceWhenAdded: 30, quantity: 1 });
      expect(useCartStore.getState().cart).toHaveLength(2);
      expect(useCartStore.getState().isDrawerOpen).toBe(false);

      // Adding existing item
      useCartStore.getState().addItem({ id: 'prod-1', name: 'Serum Vit C', priceWhenAdded: 25, quantity: 1 });
      expect(useCartStore.getState().cart[0].quantity).toBe(2);
      expect(useCartStore.getState().isDrawerOpen).toBe(false);
    });

    it('toggles, opens and closes drawer correctly', () => {
      expect(useCartStore.getState().isDrawerOpen).toBe(false);
      useCartStore.getState().openDrawer();
      expect(useCartStore.getState().isDrawerOpen).toBe(true);
      useCartStore.getState().closeDrawer();
      expect(useCartStore.getState().isDrawerOpen).toBe(false);
      useCartStore.getState().toggleDrawer();
      expect(useCartStore.getState().isDrawerOpen).toBe(true);
      useCartStore.getState().toggleDrawer();
      expect(useCartStore.getState().isDrawerOpen).toBe(false);
    });

    it('TDD-FE-MC-03: partialize excludes isDrawerOpen from localStorage', () => {
      useCartStore.getState().addItem({ id: 'prod-1', name: 'Serum Vit C', priceWhenAdded: 25, quantity: 1 });
      useCartStore.getState().openDrawer();

      const storedRaw = localStorage.getItem('zelbana-cart-storage');
      expect(storedRaw).not.toBeNull();
      const parsed = JSON.parse(storedRaw!);
      expect(parsed.state).toBeDefined();
      expect(parsed.state.cart).toHaveLength(1);
      expect(parsed.state.cart[0].id).toBe('prod-1');
      expect(parsed.state.isDrawerOpen).toBeUndefined();
    });
  });
});
