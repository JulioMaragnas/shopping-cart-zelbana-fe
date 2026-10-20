import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { OrderSummaryCard } from './OrderSummaryCard';

describe('OrderSummaryCard Component (Fase 4.3)', () => {
  it('TC-CART-4.3.1 & TC-CART-4.3.2: renders coherent total and fulfilled units without fake discount rows', () => {
    render(
      <OrderSummaryCard
        totalUnits={3}
        total={35.5}
        onPay={() => {}}
        isValidating={false}
        isValid={true}
      />
    );

    expect(screen.getByText('Productos (3 unidades):')).toBeInTheDocument();
    expect(screen.getAllByText('$35.50')).toHaveLength(2);
    expect(screen.queryByText(/Descuento de artículo/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Descuento por tiempo limitado/i)).not.toBeInTheDocument();
  });

  it('calls onPay when clicked and valid', () => {
    const payMock = vi.fn();
    render(
      <OrderSummaryCard
        totalUnits={1}
        total={100}
        onPay={payMock}
        isValidating={false}
        isValid={true}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /pagar/i }));
    expect(payMock).toHaveBeenCalledTimes(1);
  });

  it('TC-CART-4.3.4: disables pay button if validating or not valid', () => {
    const { rerender } = render(
      <OrderSummaryCard
        totalUnits={1}
        total={100}
        onPay={() => {}}
        isValidating={true}
        isValid={true}
      />
    );
    expect(screen.getByRole('button')).toBeDisabled();
    expect(screen.getByRole('button')).toHaveTextContent('Validando...');

    rerender(
      <OrderSummaryCard
        totalUnits={1}
        total={100}
        onPay={() => {}}
        isValidating={false}
        isValid={false}
      />
    );
    expect(screen.getByRole('button')).toBeDisabled();
    expect(screen.getByRole('button')).toHaveTextContent('Pagar');
  });

  it('TC-UI-FS-09: renders GRATIS ($0.00) 🎉 badge when isFreeShippingUnlocked is true', () => {
    render(
      <OrderSummaryCard
        totalUnits={2}
        total={60}
        onPay={() => {}}
        isValidating={false}
        isValid={true}
        isFreeShippingUnlocked={true}
      />
    );

    expect(screen.getByTestId('summary-shipping-row')).toBeInTheDocument();
    const freeBadge = screen.getByTestId('summary-shipping-free');
    expect(freeBadge).toHaveTextContent(/GRATIS \(\$0\.00\) 🎉/i);
    expect(screen.queryByTestId('summary-shipping-pending')).not.toBeInTheDocument();
  });

  it('TC-UI-FS-09: renders Por calcular (Faltan $X.XX) when goal is in progress', () => {
    render(
      <OrderSummaryCard
        totalUnits={1}
        total={35}
        onPay={() => {}}
        isValidating={false}
        isValid={true}
        isFreeShippingUnlocked={false}
        missingAmountForFreeShipping={15.0}
      />
    );

    expect(screen.getByTestId('summary-shipping-row')).toBeInTheDocument();
    const pendingText = screen.getByTestId('summary-shipping-pending');
    expect(pendingText).toHaveTextContent(/Por calcular/i);
    expect(pendingText).toHaveTextContent(/\(Faltan \$15\.00\)/i);
    expect(screen.queryByTestId('summary-shipping-free')).not.toBeInTheDocument();
  });

  it('renders standard Por calcular when shipping props are not provided', () => {
    render(
      <OrderSummaryCard
        totalUnits={1}
        total={35}
        onPay={() => {}}
        isValidating={false}
        isValid={true}
      />
    );

    const shippingRow = screen.getByTestId('summary-shipping-row');
    expect(shippingRow).toHaveTextContent(/Por calcular/i);
    expect(screen.queryByTestId('summary-shipping-free')).not.toBeInTheDocument();
    expect(screen.queryByTestId('summary-shipping-pending')).not.toBeInTheDocument();
  });
});
