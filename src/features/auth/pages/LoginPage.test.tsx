import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { LoginPage } from './LoginPage';
import { useAuthStore } from '../store/useAuthStore';
import { useCartStore } from '../../cart/store/useCartStore';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { server } from '../../../mocks/server';
import { resetMockStoreSettings } from '../../../mocks/handlers';

const LocationTracker = () => {
  const location = useLocation();
  return <div data-testid="location-display">{location.pathname + location.search}</div>;
};

const renderLoginPage = (initialEntries = ['/login']) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={initialEntries}>
        <LoginPage />
        <LocationTracker />
      </MemoryRouter>
    </QueryClientProvider>
  );
};

describe('LoginPage Component (TC-UI-AUTH-01 .. TC-UI-AUTH-07, TC-UI-SOC-01 .. TC-UI-SOC-09)', () => {
  beforeEach(() => {
    localStorage.clear();
    resetMockStoreSettings();
    useAuthStore.setState({
      token: null,
      user: null,
      isAuthenticated: false,
    });
    useCartStore.getState().clearCart();
    vi.restoreAllMocks();
  });

  it('TC-UI-AUTH-01: renders initial form with empty fields, placeholders and enabled submit button', () => {
    renderLoginPage();

    expect(screen.getByTestId('login-card')).toBeInTheDocument();
    const emailInput = screen.getByTestId('login-email-input') as HTMLInputElement;
    const passwordInput = screen.getByTestId('login-password-input') as HTMLInputElement;
    const submitBtn = screen.getByTestId('login-submit-btn');

    expect(emailInput.value).toBe('');
    expect(passwordInput.value).toBe('');
    expect(submitBtn).toBeEnabled();
    expect(screen.getByTestId('login-toggle-password-btn')).toBeInTheDocument();
    expect(screen.getByTestId('login-remember-checkbox')).toBeInTheDocument();
    expect(screen.getByTestId('login-to-register-link')).toBeInTheDocument();
  });

  it('TC-UI-AUTH-02: renders SmartResumeCard when zelbana-last-auth-* exists in localStorage', () => {
    localStorage.setItem('zelbana-last-auth-name', 'Julio');
    localStorage.setItem('zelbana-last-auth-email', 'julio@ejemplo.com');

    renderLoginPage();

    expect(screen.getByTestId('smart-resume-card')).toBeInTheDocument();
    expect(screen.getByText(/Continuar como Julio/i)).toBeInTheDocument();
    expect(screen.getByText('julio@ejemplo.com')).toBeInTheDocument();
    expect(screen.getByTestId('smart-resume-continue-btn')).toBeInTheDocument();
    expect(screen.getByTestId('smart-resume-change-account-btn')).toBeInTheDocument();

    // The traditional form inputs should not be visible in this view
    expect(screen.queryByTestId('login-email-input')).not.toBeInTheDocument();
  });

  it('TC-UI-AUTH-03: hides SmartResumeCard and displays traditional form when clicking "Cambiar cuenta"', async () => {
    const user = userEvent.setup();
    localStorage.setItem('zelbana-last-auth-name', 'Julio');
    localStorage.setItem('zelbana-last-auth-email', 'julio@ejemplo.com');

    renderLoginPage();

    expect(screen.getByTestId('smart-resume-card')).toBeInTheDocument();

    const changeAccountBtn = screen.getByTestId('smart-resume-change-account-btn');
    await user.click(changeAccountBtn);

    expect(screen.queryByTestId('smart-resume-card')).not.toBeInTheDocument();
    expect(screen.getByTestId('login-email-input')).toBeInTheDocument();
    expect(screen.getByTestId('login-password-input')).toBeInTheDocument();
    expect(screen.getByTestId('login-submit-btn')).toBeInTheDocument();
  });

  it('toggles password visibility when clicking toggle password button', async () => {
    const user = userEvent.setup();
    renderLoginPage();

    const passwordInput = screen.getByTestId('login-password-input') as HTMLInputElement;
    const toggleBtn = screen.getByTestId('login-toggle-password-btn');

    expect(passwordInput.type).toBe('password');

    await user.click(toggleBtn);
    expect(passwordInput.type).toBe('text');

    await user.click(toggleBtn);
    expect(passwordInput.type).toBe('password');
  });

  it('TC-UI-AUTH-04: successful login populates useAuthStore and redirects to ?redirect= path', async () => {
    const user = userEvent.setup();
    renderLoginPage(['/login?redirect=/checkout/ORD-999']);

    const emailInput = screen.getByTestId('login-email-input');
    const passwordInput = screen.getByTestId('login-password-input');
    const submitBtn = screen.getByTestId('login-submit-btn');

    await user.type(emailInput, 'julio@ejemplo.com');
    await user.type(passwordInput, 'valid-password');
    await user.click(submitBtn);

    await waitFor(() => {
      expect(useAuthStore.getState().isAuthenticated).toBe(true);
      expect(useAuthStore.getState().token).toBe('mock-jwt-token-valid-7d');
      expect(useAuthStore.getState().user?.email).toBe('julio@ejemplo.com');
      expect(screen.getByTestId('location-display').textContent).toBe('/checkout/ORD-999');
    });
  });

  it('TC-UI-AUTH-05: guarantees Zero Cart Loss after successful login with items in useCartStore', async () => {
    const user = userEvent.setup();

    // Populate cart with 2 products
    useCartStore.getState().addItem({
      id: 'prod-1',
      name: 'Jabón de Avena',
      priceWhenAdded: 12.0,
      quantity: 2,
    });
    useCartStore.getState().addItem({
      id: 'prod-2',
      name: 'Serum Vitamina C',
      priceWhenAdded: 35.0,
      quantity: 1,
    });

    expect(useCartStore.getState().cart).toHaveLength(2);

    renderLoginPage();

    const emailInput = screen.getByTestId('login-email-input');
    const passwordInput = screen.getByTestId('login-password-input');
    const submitBtn = screen.getByTestId('login-submit-btn');

    await user.type(emailInput, 'julio@ejemplo.com');
    await user.type(passwordInput, 'valid-password');
    await user.click(submitBtn);

    await waitFor(() => {
      expect(useAuthStore.getState().isAuthenticated).toBe(true);
    });

    // Zero Cart Loss: Items must remain completely intact
    const cartItems = useCartStore.getState().cart;
    expect(cartItems).toHaveLength(2);
    expect(cartItems[0].id).toBe('prod-1');
    expect(cartItems[0].quantity).toBe(2);
    expect(cartItems[1].id).toBe('prod-2');
    expect(cartItems[1].quantity).toBe(1);
  });

  it('TC-UI-AUTH-06: shows error alert on 401 invalid credentials and re-enables inputs', async () => {
    const user = userEvent.setup();
    renderLoginPage();

    const emailInput = screen.getByTestId('login-email-input');
    const passwordInput = screen.getByTestId('login-password-input');
    const submitBtn = screen.getByTestId('login-submit-btn');

    await user.type(emailInput, 'invalid@ejemplo.com');
    await user.type(passwordInput, 'wrong-password');
    await user.click(submitBtn);

    const alert = await screen.findByTestId('login-error-alert');
    expect(alert).toBeInTheDocument();
    expect(alert).toHaveTextContent(/El correo o la contraseña son incorrectos/i);

    expect(emailInput).toBeEnabled();
    expect(passwordInput).toBeEnabled();
    expect(submitBtn).toBeEnabled();
  });

  it('TC-UI-AUTH-07: handles HTTP 429 Rate Limit with security alert and blocks submit button', async () => {
    const user = userEvent.setup();
    renderLoginPage();

    const emailInput = screen.getByTestId('login-email-input');
    const passwordInput = screen.getByTestId('login-password-input');
    const submitBtn = screen.getByTestId('login-submit-btn');

    await user.type(emailInput, 'rate.limit@ejemplo.com');
    await user.type(passwordInput, 'ratelimit');
    await user.click(submitBtn);

    const alert = await screen.findByTestId('login-error-alert');
    expect(alert).toBeInTheDocument();
    expect(alert).toHaveTextContent(/Demasiados intentos fallidos/i);

    expect(submitBtn).toBeDisabled();
    expect(submitBtn).toHaveTextContent(/Bloqueado por seguridad/i);
  });

  it('TC-UI-SOC-01: renders google-login-btn with text "Continuar con Google", social-divider with "o con tu correo", and traditional form below', async () => {
    renderLoginPage();

    const googleBtn = await screen.findByTestId('google-login-btn');
    expect(googleBtn).toBeInTheDocument();
    expect(googleBtn).toHaveTextContent('Continuar con Google');

    const divider = screen.getByTestId('social-divider');
    expect(divider).toBeInTheDocument();
    expect(screen.getByTestId('social-divider-text')).toHaveTextContent('o con tu correo');

    // Traditional form is rendered below
    expect(screen.getByTestId('login-email-input')).toBeInTheDocument();
    expect(screen.getByTestId('login-password-input')).toBeInTheDocument();
    expect(screen.getByTestId('login-submit-btn')).toBeInTheDocument();
  });

  it('TC-UI-SOC-03: hides google-login-btn and social-divider when enabledSocialProviders is empty or googleClientId is empty', async () => {
    server.use(
      http.get('*/storefront/api/settings', () => {
        return HttpResponse.json({
          freeShippingEnabled: true,
          freeShippingThreshold: 50.0,
          enabledSocialProviders: [],
          googleClientId: null,
        });
      })
    );

    renderLoginPage();

    // Verify traditional form loads
    expect(await screen.findByTestId('login-email-input')).toBeInTheDocument();

    // Google button and divider should NOT be in the DOM once settings resolve
    await waitFor(() => {
      expect(screen.queryByTestId('google-login-btn')).not.toBeInTheDocument();
      expect(screen.queryByTestId('social-divider')).not.toBeInTheDocument();
    });
  });

  it('TC-UI-SOC-05: handles successful Google login, stores auth session, and redirects without reload', async () => {
    const user = userEvent.setup();
    renderLoginPage(['/login?redirect=%2Fcheckout%2FORD-456']);

    const googleBtn = await screen.findByTestId('google-login-btn');
    await user.click(googleBtn);

    await waitFor(() => {
      expect(useAuthStore.getState().isAuthenticated).toBe(true);
      expect(useAuthStore.getState().token).toBe('mock-jwt-token-google-7d');
      expect(useAuthStore.getState().user?.authProvider).toBe('google');
    });

    expect(screen.getByTestId('location-display')).toHaveTextContent('/checkout/ORD-456');
  });

  it('TC-UI-SOC-06: guarantees Zero Cart Loss upon successful Google social login', async () => {
    const user = userEvent.setup();

    // 1. Agregar 3 productos al carrito anónimo
    useCartStore.getState().addItem({
      id: 'prod-101',
      name: 'Serum de Vitamina C',
      priceWhenAdded: 35.0,
      quantity: 1,
    });
    useCartStore.getState().addItem({
      id: 'prod-102',
      name: 'Tónico Botánico',
      priceWhenAdded: 22.0,
      quantity: 2,
    });
    useCartStore.getState().addItem({
      id: 'prod-103',
      name: 'Contorno de Ojos',
      priceWhenAdded: 28.0,
      quantity: 1,
    });

    expect(useCartStore.getState().cart).toHaveLength(3);

    renderLoginPage();

    const googleBtn = await screen.findByTestId('google-login-btn');
    await user.click(googleBtn);

    await waitFor(() => {
      expect(useAuthStore.getState().isAuthenticated).toBe(true);
    });

    // Validar que los 3 productos permanecen intactos
    const cart = useCartStore.getState().cart;
    expect(cart).toHaveLength(3);
    expect(cart[0].id).toBe('prod-101');
    expect(cart[1].id).toBe('prod-102');
    expect(cart[1].quantity).toBe(2);
    expect(cart[2].id).toBe('prod-103');
  });

  it('TC-UI-SOC-08: renders social-error-alert when backend verification fails (HTTP 401)', async () => {
    const user = userEvent.setup();

    server.use(
      http.post('*/storefront/api/auth/social', () => {
        return HttpResponse.json(
          { error: 'Token de Google inválido o correo no verificado.' },
          { status: 401 }
        );
      })
    );

    renderLoginPage();

    const googleBtn = await screen.findByTestId('google-login-btn');
    await user.click(googleBtn);

    const alert = await screen.findByTestId('social-error-alert');
    expect(alert).toBeInTheDocument();
    expect(alert).toHaveTextContent(/No se pudo completar el inicio de sesión con Google. Intenta con tu correo y contraseña./i);

    // Controls remain enabled for user retry
    expect(screen.getByTestId('google-login-btn')).toBeEnabled();
    expect(screen.getByTestId('login-email-input')).toBeEnabled();
  });

  it('TC-UI-SOC-09: renders smart-resume-provider-badge with "Continuar como {Nombre} (Google)" when zelbana-last-auth-provider is google', () => {
    localStorage.setItem('zelbana-last-auth-name', 'Julio');
    localStorage.setItem('zelbana-last-auth-email', 'julio@ejemplo.com');
    localStorage.setItem('zelbana-last-auth-provider', 'google');

    renderLoginPage();

    expect(screen.getByTestId('smart-resume-card')).toBeInTheDocument();
    const badge = screen.getByTestId('smart-resume-provider-badge');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent('Continuar como Julio (Google)');
    expect(badge).toHaveTextContent('(Google)');
  });
});
