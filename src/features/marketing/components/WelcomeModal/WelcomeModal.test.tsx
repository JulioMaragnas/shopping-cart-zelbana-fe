import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WelcomeModal } from './WelcomeModal';

describe('WelcomeModal Component (TC-UI-POL-09 a TC-UI-POL-10)', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('TC-UI-POL-09: mounts automatically for first-time visitor when localStorage is clean', () => {
    render(<WelcomeModal />);

    expect(screen.getByTestId('welcome-modal')).toBeInTheDocument();
    expect(screen.getByTestId('welcome-modal-close-btn')).toBeInTheDocument();
    expect(screen.getByTestId('welcome-modal-cta-btn')).toBeInTheDocument();

    // Verifies brand value and free shipping communication
    expect(screen.getByText(/Envío GRATIS/i)).toBeInTheDocument();
    expect(screen.getByText(/\$50/)).toBeInTheDocument();
  });

  it('TC-UI-POL-10: closing modal via CTA button saves zelbana-welcome-dismissed in localStorage and unmounts', () => {
    const onExplore = vi.fn();
    const { rerender } = render(<WelcomeModal onExplore={onExplore} />);

    const ctaBtn = screen.getByTestId('welcome-modal-cta-btn');
    fireEvent.click(ctaBtn);

    expect(localStorage.getItem('zelbana-welcome-dismissed')).toBe('true');
    expect(onExplore).toHaveBeenCalledTimes(1);
    expect(screen.queryByTestId('welcome-modal')).not.toBeInTheDocument();

    // Rerendering when dismissed produces null
    rerender(<WelcomeModal />);
    expect(screen.queryByTestId('welcome-modal')).not.toBeInTheDocument();
  });

  it('closing modal via close button (✕) saves zelbana-welcome-dismissed in localStorage', () => {
    const onDismiss = vi.fn();
    render(<WelcomeModal onDismiss={onDismiss} />);

    const closeBtn = screen.getByTestId('welcome-modal-close-btn');
    fireEvent.click(closeBtn);

    expect(localStorage.getItem('zelbana-welcome-dismissed')).toBe('true');
    expect(onDismiss).toHaveBeenCalledTimes(1);
    expect(screen.queryByTestId('welcome-modal')).not.toBeInTheDocument();
  });

  it('closing modal via Escape key dismisses and saves to localStorage', () => {
    render(<WelcomeModal />);

    expect(screen.getByTestId('welcome-modal')).toBeInTheDocument();

    fireEvent.keyDown(window, { key: 'Escape' });

    expect(localStorage.getItem('zelbana-welcome-dismissed')).toBe('true');
    expect(screen.queryByTestId('welcome-modal')).not.toBeInTheDocument();
  });

  it('does not render when zelbana-welcome-dismissed is already set to true in localStorage', () => {
    localStorage.setItem('zelbana-welcome-dismissed', 'true');
    render(<WelcomeModal />);

    expect(screen.queryByTestId('welcome-modal')).not.toBeInTheDocument();
  });
});
