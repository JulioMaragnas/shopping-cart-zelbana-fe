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
});
