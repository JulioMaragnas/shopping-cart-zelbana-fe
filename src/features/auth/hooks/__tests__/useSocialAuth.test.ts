import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSocialAuth } from '../useSocialAuth';
import { useAuthStore } from '../../store/useAuthStore';
import { useCartStore } from '../../../cart/store/useCartStore';
import { http, HttpResponse } from 'msw';
import { server } from '../../../../mocks/server';

describe('useSocialAuth Hook', () => {
  beforeEach(() => {
    localStorage.clear();
    useAuthStore.setState({
      token: null,
      user: null,
      isAuthenticated: false,
    });
    useCartStore.getState().clearCart();
    vi.restoreAllMocks();
  });

  it('authenticates user and updates store and localStorage on handleGoogleSuccess', async () => {
    const { result } = renderHook(() => useSocialAuth());

    await act(async () => {
      await result.current.handleGoogleSuccess('valid-id-token');
    });

    expect(useAuthStore.getState().isAuthenticated).toBe(true);
    expect(useAuthStore.getState().token).toBe('mock-jwt-token-google-7d');
    expect(useAuthStore.getState().user?.authProvider).toBe('google');

    expect(localStorage.getItem('zelbana-last-auth-name')).toBe('Julio Cano');
    expect(localStorage.getItem('zelbana-last-auth-email')).toBe('julio@ejemplo.com');
    expect(localStorage.getItem('zelbana-last-auth-provider')).toBe('google');
  });

  it('guarantees Zero Cart Loss on social authentication', async () => {
    useCartStore.getState().addItem({
      id: 'item-1',
      name: 'Item 1',
      priceWhenAdded: 10,
      quantity: 3,
    });

    const { result } = renderHook(() => useSocialAuth());

    await act(async () => {
      await result.current.handleGoogleSuccess('valid-id-token');
    });

    // Carrito debe permanecer intacto con 3 unidades
    expect(useCartStore.getState().cart).toHaveLength(1);
    expect(useCartStore.getState().cart[0].quantity).toBe(3);
  });

  it('sets socialError and resets isVerifying when social login fails', async () => {
    server.use(
      http.post('*/storefront/api/auth/social', () => {
        return HttpResponse.json({ error: 'Token inválido' }, { status: 401 });
      })
    );

    const { result } = renderHook(() => useSocialAuth());

    await act(async () => {
      try {
        await result.current.handleGoogleSuccess('invalid-id-token');
      } catch {
        // Expected throw
      }
    });

    expect(result.current.isVerifying).toBe(false);
    expect(result.current.socialError).toBe(
      'No se pudo completar el inicio de sesión con Google. Intenta con tu correo y contraseña.'
    );
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });

  it('clears socialError and isVerifying on handleDismiss', async () => {
    server.use(
      http.post('*/storefront/api/auth/social', () => {
        return HttpResponse.json({ error: 'Token inválido' }, { status: 401 });
      })
    );

    const { result } = renderHook(() => useSocialAuth());

    await act(async () => {
      try {
        await result.current.handleGoogleSuccess('invalid-id-token');
      } catch {}
    });

    expect(result.current.socialError).toBeTruthy();

    act(() => {
      result.current.handleDismiss();
    });

    expect(result.current.socialError).toBeNull();
    expect(result.current.isVerifying).toBe(false);
  });
});
