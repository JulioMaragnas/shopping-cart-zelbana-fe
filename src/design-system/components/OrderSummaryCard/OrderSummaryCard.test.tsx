import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { OrderSummaryCard } from './OrderSummaryCard';

describe('OrderSummaryCard Component', () => {
  it('renders correctly with given values', () => {
    render(
      <OrderSummaryCard 
        subtotal={1000} 
        itemDiscounts={200} 
        timeDiscounts={50} 
        total={750} 
        onPay={() => {}} 
        isValidating={false} 
        isValid={true} 
      />
    );
    
    expect(screen.getByText('$1000')).toBeInTheDocument();
    expect(screen.getByText('-$200')).toBeInTheDocument();
    expect(screen.getByText('-$50')).toBeInTheDocument();
    expect(screen.getByText('$750')).toBeInTheDocument();
  });

  it('calls onPay when clicked', () => {
    const payMock = vi.fn();
    render(
      <OrderSummaryCard subtotal={100} itemDiscounts={0} timeDiscounts={0} total={100} onPay={payMock} isValidating={false} isValid={true} />
    );
    fireEvent.click(screen.getByRole('button', { name: /pagar/i }));
    expect(payMock).toHaveBeenCalledTimes(1);
  });

  it('disables pay button if validating or not valid', () => {
    const { rerender } = render(
      <OrderSummaryCard subtotal={100} itemDiscounts={0} timeDiscounts={0} total={100} onPay={() => {}} isValidating={true} isValid={true} />
    );
    expect(screen.getByRole('button')).toBeDisabled();
    expect(screen.getByRole('button')).toHaveTextContent('Validando...');

    rerender(
      <OrderSummaryCard subtotal={100} itemDiscounts={0} timeDiscounts={0} total={100} onPay={() => {}} isValidating={false} isValid={false} />
    );
    expect(screen.getByRole('button')).toBeDisabled();
    expect(screen.getByRole('button')).toHaveTextContent('Pagar');
  });
});
