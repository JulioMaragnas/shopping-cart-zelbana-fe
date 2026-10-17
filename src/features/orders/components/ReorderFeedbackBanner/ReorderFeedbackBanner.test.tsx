import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ReorderFeedbackBanner } from './ReorderFeedbackBanner';
import type { ReorderFeedback } from '../../types/orders.types';

describe('ReorderFeedbackBanner Component', () => {
  it('renders nothing when feedback is null', () => {
    const { container } = render(<ReorderFeedbackBanner feedback={null} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders partial feedback banner with amber styling and view cart link', () => {
    const onViewCart = vi.fn();
    const feedback: ReorderFeedback = {
      type: 'partial',
      message: '⚠️ Agregamos 2 productos a tu carrito. "Exfoliante Corporal Café & Coco" está agotado hoy.',
      addedCount: 2,
      outOfStockItems: ['Exfoliante Corporal Café & Coco'],
    };

    render(<ReorderFeedbackBanner feedback={feedback} onViewCart={onViewCart} />);

    const banner = screen.getByTestId('reorder-feedback-banner');
    expect(banner).toBeInTheDocument();
    expect(banner).toHaveAttribute('role', 'alert');
    expect(banner).toHaveTextContent(/Agregamos 2 productos/i);

    const viewCartLink = screen.getByTestId('reorder-banner-view-cart-link');
    expect(viewCartLink).toBeInTheDocument();
    fireEvent.click(viewCartLink);
    expect(onViewCart).toHaveBeenCalledTimes(1);
  });

  it('renders success feedback banner', () => {
    const feedback: ReorderFeedback = {
      type: 'success',
      message: '✓ ¡Agregamos todos los productos de tu pedido al carrito!',
      addedCount: 3,
      outOfStockItems: [],
    };

    render(<ReorderFeedbackBanner feedback={feedback} />);

    const banner = screen.getByTestId('reorder-feedback-banner');
    expect(banner).toBeInTheDocument();
    expect(banner).toHaveTextContent(/Agregamos todos los productos/i);
  });

  it('renders out_of_stock feedback banner without view cart link', () => {
    const feedback: ReorderFeedback = {
      type: 'out_of_stock',
      message: 'Lo sentimos, los productos de este pedido se encuentran agotados temporalmente.',
      addedCount: 0,
      outOfStockItems: ['Item 1'],
    };

    render(<ReorderFeedbackBanner feedback={feedback} />);

    const banner = screen.getByTestId('reorder-feedback-banner');
    expect(banner).toBeInTheDocument();
    expect(screen.queryByTestId('reorder-banner-view-cart-link')).not.toBeInTheDocument();
  });
});
