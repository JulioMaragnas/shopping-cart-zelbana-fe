import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MobileStickyPdpBar } from './MobileStickyPdpBar';

describe('MobileStickyPdpBar Component', () => {
  const defaultProps = {
    name: 'Serum Niacinamida 10%',
    thumbnailUrl: '/products/niacinamida.webp',
    salePrice: 15.0,
    lowStock: false,
    quantity: 1,
    maxOrderQuantity: 10,
    remainingAvailable: 5,
    isPurchaseDisabled: false,
    buttonLabel: 'Agregar al Carrito',
    onQuantityChange: vi.fn(),
    onAddToCart: vi.fn(),
  };

  it('renders correctly with all semantic data-testid attributes', () => {
    render(<MobileStickyPdpBar {...defaultProps} />);

    expect(screen.getByTestId('mobile-sticky-pdp-bar')).toBeInTheDocument();
    expect(screen.getByTestId('mobile-sticky-pdp-thumb')).toBeInTheDocument();
    expect(screen.getByTestId('mobile-sticky-pdp-price')).toHaveTextContent('$15.00');
    expect(screen.getByTestId('mobile-sticky-pdp-qty-stepper')).toBeInTheDocument();
    expect(screen.getByTestId('mobile-sticky-pdp-add-btn')).toBeInTheDocument();
    expect(screen.getByText('Serum Niacinamida 10%')).toBeInTheDocument();
  });

  it('renders low stock badge when lowStock is true', () => {
    render(<MobileStickyPdpBar {...defaultProps} lowStock={true} />);

    const badge = screen.getByTestId('mobile-sticky-pdp-low-stock-badge');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent(/¡Pocas unidades!/i);
  });

  it('does not render low stock badge when lowStock is false', () => {
    render(<MobileStickyPdpBar {...defaultProps} lowStock={false} />);
    expect(screen.queryByTestId('mobile-sticky-pdp-low-stock-badge')).not.toBeInTheDocument();
  });

  it('increments and decrements quantity through onQuantityChange', async () => {
    const user = userEvent.setup();
    const onQuantityChange = vi.fn();
    render(<MobileStickyPdpBar {...defaultProps} quantity={2} onQuantityChange={onQuantityChange} />);

    const stepper = screen.getByTestId('mobile-sticky-pdp-qty-stepper');
    const decBtn = stepper.querySelector('button[aria-label="Disminuir"]') as HTMLButtonElement;
    const incBtn = stepper.querySelector('button[aria-label="Aumentar"]') as HTMLButtonElement;

    await user.click(decBtn);
    expect(onQuantityChange).toHaveBeenCalledWith(1);

    await user.click(incBtn);
    expect(onQuantityChange).toHaveBeenCalledWith(3);
  });

  it('disables add button and stepper buttons when isPurchaseDisabled is true', () => {
    render(
      <MobileStickyPdpBar
        {...defaultProps}
        isPurchaseDisabled={true}
        buttonLabel="Agotado"
      />
    );

    const addBtn = screen.getByTestId('mobile-sticky-pdp-add-btn');
    expect(addBtn).toBeDisabled();
    expect(addBtn).toHaveTextContent('Agotado');

    const stepper = screen.getByTestId('mobile-sticky-pdp-qty-stepper');
    const buttons = stepper.querySelectorAll('button');
    buttons.forEach((btn) => {
      expect(btn).toBeDisabled();
    });
  });

  it('triggers onAddToCart when add button is clicked', async () => {
    const user = userEvent.setup();
    const onAddToCart = vi.fn();
    render(<MobileStickyPdpBar {...defaultProps} onAddToCart={onAddToCart} />);

    const addBtn = screen.getByTestId('mobile-sticky-pdp-add-btn');
    await user.click(addBtn);

    expect(onAddToCart).toHaveBeenCalledTimes(1);
  });
});
