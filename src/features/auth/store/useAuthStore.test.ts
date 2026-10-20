import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore } from './useAuthStore';
import { useCartStore } from '../../cart/store/useCartStore';

describe('useAuthStore (Zustand & Zero Cart Loss Guarantee)', () => {
  beforeEach(() => {
    localStorage.clear();
    useAuthStore.setState({
      token: null,
      user: null,
      isAuthenticated: false,
    });
    useCartStore.getState().clearCart();
  });

  it('TDD-AUTH-FE-01 / TC-AUTH-FE-07: sets token, user and isAuthenticated: true on login, and saves smart resume keys to localStorage', () => {
    const mockUser = {
      id: 'usr-12345',
      name: 'Julio Cano',
      email: 'julio@ejemplo.com',
      avatarUrl: null,
      authProvider: 'local',
    };
    const mockToken = 'mock-jwt-token-xyz';

    useAuthStore.getState().login({
      token: mockToken,
      user: mockUser,
    });

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(true);
    expect(state.token).toBe(mockToken);
    expect(state.user).toEqual(mockUser);

    // Verificar smart resume en localStorage
    expect(localStorage.getItem('zelbana-last-auth-name')).toBe('Julio');
    expect(localStorage.getItem('zelbana-last-auth-email')).toBe('julio@ejemplo.com');
    expect(localStorage.getItem('zelbana-last-auth-provider')).toBe('local');
    expect(localStorage.getItem('zelbana-customer-name')).toBe('Julio Cano');
    expect(localStorage.getItem('zelbana-customer-email')).toBe('julio@ejemplo.com');
  });

  it('clears token, user and isAuthenticated: false on logout', () => {
    useAuthStore.getState().login({
      token: 'some-token',
      user: {
        id: 'usr-1',
        name: 'Maria Perez',
        email: 'maria@ejemplo.com',
      },
    });

    expect(useAuthStore.getState().isAuthenticated).toBe(true);

    useAuthStore.getState().logout();

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.token).toBeNull();
    expect(state.user).toBeNull();
  });

  it('TDD-AUTH-FE-02 / TC-AUTH-FE-08: guarantees Zero Cart Loss on login and logout', () => {
    // 1. Agregar 3 productos al carrito anónimo
    useCartStore.getState().addItem({
      id: 'prod-1',
      name: 'Jabón de Lavanda',
      priceWhenAdded: 15.0,
      quantity: 2,
    });
    useCartStore.getState().addItem({
      id: 'prod-2',
      name: 'Crema Hidratante',
      priceWhenAdded: 25.0,
      quantity: 1,
    });
    useCartStore.getState().addItem({
      id: 'prod-3',
      name: 'Aceite de Jojoba',
      priceWhenAdded: 30.0,
      quantity: 1,
    });

    expect(useCartStore.getState().cart).toHaveLength(3);

    // 2. Ejecutar login
    useAuthStore.getState().login({
      token: 'jwt-123',
      user: {
        id: 'usr-456',
        name: 'Julio Cano',
        email: 'julio@ejemplo.com',
      },
    });

    // Verificar que los 3 productos siguen exactamente intactos en useCartStore
    expect(useCartStore.getState().cart).toHaveLength(3);
    expect(useCartStore.getState().cart[0].id).toBe('prod-1');
    expect(useCartStore.getState().cart[1].id).toBe('prod-2');
    expect(useCartStore.getState().cart[2].id).toBe('prod-3');

    // 3. Ejecutar logout
    useAuthStore.getState().logout();

    // Verificar que los 3 productos SIGUEN intactos en useCartStore (Zero Cart Loss)
    expect(useCartStore.getState().cart).toHaveLength(3);
    expect(useCartStore.getState().cart[0].quantity).toBe(2);
    expect(useCartStore.getState().cart[1].quantity).toBe(1);
    expect(useCartStore.getState().cart[2].quantity).toBe(1);
  });

  it('updates profile data without affecting session token', () => {
    useAuthStore.getState().login({
      token: 'jwt-123',
      user: {
        id: 'usr-1',
        name: 'Julio Cano',
        email: 'julio@ejemplo.com',
      },
    });

    useAuthStore.getState().updateProfile({
      name: 'Julio Cesar Cano',
      avatarUrl: 'https://example.com/avatar.jpg',
    });

    const state = useAuthStore.getState();
    expect(state.token).toBe('jwt-123');
    expect(state.user?.name).toBe('Julio Cesar Cano');
    expect(state.user?.avatarUrl).toBe('https://example.com/avatar.jpg');
    expect(state.user?.email).toBe('julio@ejemplo.com');
  });
});
