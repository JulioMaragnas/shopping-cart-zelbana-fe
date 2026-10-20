import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GoogleSocialButton } from '../GoogleSocialButton';
import { SocialDivider } from '../SocialDivider';
import { SmartResumeCard } from '../SmartResumeCard';

describe('GoogleSocialButton & Social Components Unit Tests (TC-UI-SOC-04, TC-UI-SOC-07, TC-UI-SOC-09, TC-UI-SOC-10)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    delete (window as any).__mockGoogleDismiss;
    delete (window as any).__mockGoogleError;
    delete (window as any).google;
  });

  it('TC-UI-SOC-04: Estado de verificación (Loading) - disabled, spinner and aria-busy', async () => {
    const user = userEvent.setup();
    const onSuccess = vi.fn();

    render(
      <GoogleSocialButton
        mode="login"
        isLoading={true}
        onSuccess={onSuccess}
      />
    );

    const button = screen.getByTestId('google-login-btn');
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByTestId('google-btn-spinner')).toBeInTheDocument();

    await user.click(button);
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it('TC-UI-SOC-07: Pop-up cerrado por la usuaria (popup_closed_by_user) triggers onDismiss without errors', async () => {
    const user = userEvent.setup();
    const onSuccess = vi.fn();
    const onDismiss = vi.fn();
    const onError = vi.fn();

    (window as any).__mockGoogleDismiss = true;

    render(
      <GoogleSocialButton
        mode="login"
        onSuccess={onSuccess}
        onDismiss={onDismiss}
        onError={onError}
      />
    );

    const button = screen.getByTestId('google-login-btn');
    await user.click(button);

    expect(onDismiss).toHaveBeenCalledTimes(1);
    expect(onSuccess).not.toHaveBeenCalled();
    expect(onError).not.toHaveBeenCalled();
  });

  it('TC-UI-SOC-07: Handles GIS prompt dismiss notification when window.google is defined', async () => {
    const user = userEvent.setup();
    const onSuccess = vi.fn();
    const onDismiss = vi.fn();

    const mockPrompt = vi.fn((callback) => {
      callback({
        isDismissedMoment: () => true,
        getDismissedReason: () => 'popup_closed_by_user',
      });
    });

    (window as any).google = {
      accounts: {
        id: {
          initialize: vi.fn(),
          prompt: mockPrompt,
        },
      },
    };

    render(
      <GoogleSocialButton
        mode="login"
        clientId="test-client-id"
        onSuccess={onSuccess}
        onDismiss={onDismiss}
      />
    );

    const button = screen.getByTestId('google-login-btn');
    await user.click(button);

    expect((window as any).google.accounts.id.initialize).toHaveBeenCalled();
    expect(mockPrompt).toHaveBeenCalled();
    expect(onDismiss).toHaveBeenCalledTimes(1);
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it('TC-UI-SOC-10: Accesibilidad WCAG 2.1 AA y Teclado - Tab focus, Enter and Space activation', async () => {
    const user = userEvent.setup();
    const onSuccess = vi.fn();

    render(
      <GoogleSocialButton
        mode="login"
        onSuccess={onSuccess}
      />
    );

    const button = screen.getByTestId('google-login-btn');
    expect(button).toHaveAttribute('aria-label', 'Continuar con Google');

    // Navegación con Tab
    await user.tab();
    expect(button).toHaveFocus();

    // Activación con tecla Enter
    await user.keyboard('{Enter}');
    expect(onSuccess).toHaveBeenCalledTimes(1);

    // Activación con tecla Space
    await user.keyboard(' ');
    expect(onSuccess).toHaveBeenCalledTimes(2);
  });

  it('renders correctly in register mode with appropriate aria-label and text', () => {
    render(
      <GoogleSocialButton
        mode="register"
        onSuccess={vi.fn()}
      />
    );

    const button = screen.getByTestId('google-register-btn');
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute('aria-label', 'Registrarse con Google');
    expect(button).toHaveTextContent('Registrarse con Google');
  });

  it('renders SocialDivider with default and custom labels', () => {
    const { rerender } = render(<SocialDivider />);
    expect(screen.getByTestId('social-divider')).toBeInTheDocument();
    expect(screen.getByTestId('social-divider-text')).toHaveTextContent('o con tu correo');

    rerender(<SocialDivider label="o regístrate con correo" />);
    expect(screen.getByTestId('social-divider-text')).toHaveTextContent('o regístrate con correo');
  });

  it('TC-UI-SOC-09: SmartResumeCard displays smart-resume-provider-badge when provider is google', () => {
    render(
      <SmartResumeCard
        name="Julio"
        email="julio@ejemplo.com"
        provider="google"
        onContinue={vi.fn()}
        onChangeAccount={vi.fn()}
      />
    );

    const badge = screen.getByTestId('smart-resume-provider-badge');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent('Continuar como Julio (Google)');
    expect(badge).toHaveTextContent('(Google)');
  });
});
