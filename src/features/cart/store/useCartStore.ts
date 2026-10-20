import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  id: string;
  name: string;
  thumbnailUrl?: string | null;
  priceWhenAdded: number;
  quantity: number;
}

export interface CartState {
  cart: CartItem[];
  isDrawerOpen: boolean;
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  openDrawer: () => void;
  closeDrawer: () => void;
  toggleDrawer: () => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      cart: [],
      isDrawerOpen: false,

      openDrawer: () => set({ isDrawerOpen: true }),
      closeDrawer: () => set({ isDrawerOpen: false }),
      toggleDrawer: () => set((state) => ({ isDrawerOpen: !state.isDrawerOpen })),

      addItem: (item) =>
        set((state) => {
          const wasEmpty = state.cart.length === 0;
          const existingItem = state.cart.find((i) => i.id === item.id);

          let nextCart: CartItem[];
          if (existingItem) {
            nextCart = state.cart.map((i) =>
              i.id === item.id
                ? {
                    ...i,
                    thumbnailUrl: item.thumbnailUrl ?? i.thumbnailUrl,
                    quantity: i.quantity + item.quantity,
                  }
                : i
            );
          } else {
            nextCart = [...state.cart, item];
          }

          return {
            cart: nextCart,
            isDrawerOpen: wasEmpty ? true : state.isDrawerOpen,
          };
        }),

      removeItem: (id) =>
        set((state) => ({
          cart: state.cart.filter((i) => i.id !== id),
        })),

      updateQuantity: (id, quantity) =>
        set((state) => ({
          cart: state.cart.map((i) =>
            i.id === id ? { ...i, quantity } : i
          ),
        })),

      clearCart: () => set({ cart: [] }),
    }),
    {
      name: 'zelbana-cart-storage',
      partialize: (state) => ({ cart: state.cart }),
    }
  )
);
