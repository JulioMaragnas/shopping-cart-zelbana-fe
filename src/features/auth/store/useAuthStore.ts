import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UserDTO } from '../types';

export interface AuthState {
  token: string | null;
  user: UserDTO | null;
  isAuthenticated: boolean;
  login: (authData: { token: string; user: UserDTO }) => void;
  logout: () => void;
  updateProfile: (updatedData: Partial<UserDTO>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      isAuthenticated: false,

      login: ({ token, user }) => {
        // Persistir Smart Resume y datos de cliente en localStorage
        if (typeof window !== 'undefined') {
          const firstName = user.name ? user.name.trim().split(/\s+/)[0] : '';
          localStorage.setItem('zelbana-last-auth-name', firstName);
          localStorage.setItem('zelbana-last-auth-email', user.email);
          localStorage.setItem('zelbana-last-auth-provider', user.authProvider || 'local');
          localStorage.setItem('zelbana-customer-name', user.name);
          localStorage.setItem('zelbana-customer-email', user.email);
        }

        set({
          token,
          user,
          isAuthenticated: true,
        });
      },

      logout: () => {
        // Cierre de sesión seguro: NUNCA limpia ni muta el carrito (Garantía Zero Cart Loss)
        set({
          token: null,
          user: null,
          isAuthenticated: false,
        });
      },

      updateProfile: (updatedData) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updatedData } : null,
        })),
    }),
    {
      name: 'zelbana-auth-storage',
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
