import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { RegisterPage } from './RegisterPage';
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

const renderRegisterPage = (initialEntries = ['/register']) => {
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
        <RegisterPage />
        <LocationTracker />
      </MemoryRouter>
    </QueryClientProvider>
  );
};

describe('RegisterPage Component (TC-UI-AUTH-08 .. TC-UI-AUTH-11, TC-UI-SOC-02, TC-UI-SOC-03)', () => {
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

  it('TC-UI-AUTH-08: renders initial registration form with empty inputs, meter and enabled submit button', () => {
    renderRegisterPage();

    expect(screen.getByTestId('register-card')).toBeInTheDocument();
    expect(screen.getByTestId('register-name-input')).toBeInTheDocument();
    expect(screen.getByTestId('register-email-input')).toBeInTheDocument();
    expect(screen.getByTestId('register-password-input')).toBeInTheDocument();
    expect(screen.getByTestId('register-password-strength-meter')).toBeInTheDocument();
    expect(screen.getByTestId('register-password-strength-label')).toHaveTextContent(/Mínimo 8 caracteres/i);
    expect(screen.getByTestId('register-newsletter-checkbox')).toBeInTheDocument();
    expect(screen.getByTestId('register-submit-btn')).toBeEnabled();
    expect(screen.getByTestId('register-to-login-link')).toBeInTheDocument();
  });

  it('TC-UI-AUTH-09: updates password strength meter in real time (<8 chars débil, >=8 chars óptimo)', async () => {
    const user = userEvent.setup();
    renderRegisterPage();

    const passwordInput = screen.getByTestId('register-password-input');
    const label = screen.getByTestId('register-password-strength-label');
    const meter = screen.getByTestId('register-password-strength-meter');

    // 1. Escribir menos de 8 caracteres
    await user.type(passwordInput, 'abc12');
    expect(label).toHaveTextContent(/Débil/i);
    expect(meter).toHaveAttribute('aria-valuenow', '33');

    // 2. Completar a 8 o más caracteres
    await user.type(passwordInput, '345!A');
    expect(label).toHaveTextContent(/Óptimo/i);
    expect(parseInt(meter.getAttribute('aria-valuenow') || '0', 10)).toBeGreaterThanOrEqual(80);
  });

  it('TC-UI-AUTH-10: successful registration triggers immediate auto-login and redirects to ?redirect= path', async () => {
    const user = userEvent.setup();
    renderRegisterPage(['/register?redirect=/checkout/ORD-777']);

    const nameInput = screen.getByTestId('register-name-input');
    const emailInput = screen.getByTestId('register-email-input');
    const passwordInput = screen.getByTestId('register-password-input');
    const submitBtn = screen.getByTestId('register-submit-btn');

    await user.type(nameInput, 'Julio Cano');
    await user.type(emailInput, 'julio.nuevo@ejemplo.com');
    await user.type(passwordInput, 'Password123!');
    await user.click(submitBtn);

    await waitFor(() => {
      // Auto-Login in useAuthStore
      expect(useAuthStore.getState().isAuthenticated).toBe(true);
      expect(useAuthStore.getState().token).toBe('mock-jwt-token-registered-7d');
      expect(useAuthStore.getState().user?.name).toBe('Julio Cano');
      expect(useAuthStore.getState().user?.email).toBe('julio.nuevo@ejemplo.com');

      // Redirect without forcing secondary login
      expect(screen.getByTestId('location-display').textContent).toBe('/checkout/ORD-777');
    });
  });

  it('TC-UI-AUTH-11: shows error alert on 409 conflict when email is already registered', async () => {
    const user = userEvent.setup();
    renderRegisterPage();

    const nameInput = screen.getByTestId('register-name-input');
    const emailInput = screen.getByTestId('register-email-input');
    const passwordInput = screen.getByTestId('register-password-input');
    const submitBtn = screen.getByTestId('register-submit-btn');

    await user.type(nameInput, 'Persona Existente');
    await user.type(emailInput, 'existente@ejemplo.com');
    await user.type(passwordInput, 'Password123!');
    await user.click(submitBtn);

    const alert = await screen.findByTestId('register-error-alert');
    expect(alert).toBeInTheDocument();
    expect(alert).toHaveTextContent(/Ya existe una cuenta con este correo/i);

    // useAuthStore remains unauthenticated
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });

  it('preserves ?redirect= target in login link', () => {
    renderRegisterPage(['/register?redirect=%2Fcheckout%2FORD-123']);
    const loginLink = screen.getByTestId('register-to-login-link');
    expect(loginLink).toHaveAttribute('href', '/login?redirect=%2Fcheckout%2FORD-123');
  });

  it('TC-UI-SOC-02: renders google-register-btn with text "Registrarse con Google", social-divider with "o regístrate con correo", and traditional register inputs', async () => {
    renderRegisterPage();

    const googleBtn = await screen.findByTestId('google-register-btn');
    expect(googleBtn).toBeInTheDocument();
    expect(googleBtn).toHaveTextContent('Registrarse con Google');

    const divider = screen.getByTestId('social-divider');
    expect(divider).toBeInTheDocument();
    expect(screen.getByTestId('social-divider-text')).toHaveTextContent('o regístrate con correo');

    // Traditional inputs exist
    expect(screen.getByTestId('register-name-input')).toBeInTheDocument();
    expect(screen.getByTestId('register-email-input')).toBeInTheDocument();
    expect(screen.getByTestId('register-password-input')).toBeInTheDocument();
    expect(screen.getByTestId('register-submit-btn')).toBeInTheDocument();
  });

  it('TC-UI-SOC-03: hides google-register-btn and social-divider when enabledSocialProviders is empty or googleClientId is empty', async () => {
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

    renderRegisterPage();

    // Traditional form loads
    expect(await screen.findByTestId('register-name-input')).toBeInTheDocument();

    // Google button and divider should NOT be in the DOM once settings resolve
    await waitFor(() => {
      expect(screen.queryByTestId('google-register-btn')).not.toBeInTheDocument();
      expect(screen.queryByTestId('social-divider')).not.toBeInTheDocument();
    });
  });
});
