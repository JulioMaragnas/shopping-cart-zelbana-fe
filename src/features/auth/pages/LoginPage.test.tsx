import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { LoginPage } from './LoginPage';
import { useAuthStore } from '../store/useAuthStore';
import { useCartStore } from '../../cart/store/useCartStore';

const LocationTracker = () => {
  const location = useLocation();
  return <div data-testid="location-display">{location.pathname + location.search}</div>;
};

const renderLoginPage = (initialEntries = ['/login']) => {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <LoginPage />
      <LocationTracker />
    </MemoryRouter>
  );
};

describe('LoginPage Component (TC-UI-AUTH-01 .. TC-UI-AUTH-07)', () => {
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
});
