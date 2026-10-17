import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { OrderLookupForm } from './OrderLookupForm';

describe('OrderLookupForm Component (TC-UI-ORD-03, TC-UI-ORD-04, TC-UI-ORD-05)', () => {
  it('TC-UI-ORD-03: renders accessible inputs and prevents submit with empty fields or invalid email', () => {
    const onSearch = vi.fn();
    render(<OrderLookupForm isLoading={false} onSearch={onSearch} />);

    const form = screen.getByTestId('order-lookup-form');
    expect(form).toBeInTheDocument();
    expect(form).toHaveAttribute('role', 'search');

    const orderIdInput = screen.getByTestId('order-lookup-order-id-input');
    const emailInput = screen.getByTestId('order-lookup-email-input');
    const submitBtn = screen.getByTestId('order-lookup-submit-btn');

    // Attempt submit while empty
    fireEvent.click(submitBtn);
    expect(onSearch).not.toHaveBeenCalled();

    // Fill order ID with valid format, but invalid email
    fireEvent.change(orderIdInput, { target: { value: 'ORD-1760731845000' } });
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
    fireEvent.click(submitBtn);

    expect(onSearch).not.toHaveBeenCalled();
    expect(emailInput).toHaveAttribute('aria-invalid', 'true');
  });

  it('TC-UI-ORD-04: triggers onSearch with sanitized query on valid inputs', () => {
    const onSearch = vi.fn();
    render(<OrderLookupForm isLoading={false} onSearch={onSearch} />);

    const orderIdInput = screen.getByTestId('order-lookup-order-id-input');
    const emailInput = screen.getByTestId('order-lookup-email-input');
    const submitBtn = screen.getByTestId('order-lookup-submit-btn');

    fireEvent.change(orderIdInput, { target: { value: '  ORD-1760731845000  ' } });
    fireEvent.change(emailInput, { target: { value: '  Maria@Email.com  ' } });

    fireEvent.click(submitBtn);

    expect(onSearch).toHaveBeenCalledWith({
      orderId: 'ORD-1760731845000',
      email: 'maria@email.com',
    });
  });

  it('TC-UI-ORD-05: renders generic error message anti-enumeration when errorMessage is provided', () => {
    const onSearch = vi.fn();
    const errorText =
      'No encontramos un pedido pagado asociado a ese número de orden y correo electrónico.';

    render(
      <OrderLookupForm
        isLoading={false}
        onSearch={onSearch}
        errorMessage={errorText}
      />
    );

    const errorMsg = screen.getByTestId('order-lookup-error-message');
    expect(errorMsg).toBeInTheDocument();
    expect(errorMsg).toHaveTextContent(errorText);
    expect(errorMsg).toHaveAttribute('role', 'alert');
  });

  it('displays loading state on submit button and disables inputs while loading', () => {
    const onSearch = vi.fn();
    render(<OrderLookupForm isLoading={true} onSearch={onSearch} />);

    const submitBtn = screen.getByTestId('order-lookup-submit-btn');
    expect(submitBtn).toBeDisabled();
    expect(submitBtn).toHaveTextContent(/Buscando/i);

    const orderIdInput = screen.getByTestId('order-lookup-order-id-input');
    const emailInput = screen.getByTestId('order-lookup-email-input');
    expect(orderIdInput).toBeDisabled();
    expect(emailInput).toBeDisabled();
  });
});
