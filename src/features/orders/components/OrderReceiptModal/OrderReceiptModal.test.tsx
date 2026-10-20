import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { OrderReceiptModal } from './OrderReceiptModal';
import type { OrderReceiptData } from '../../types/receipt';
import type { PaidOrder } from '../../types/orders.types';

describe('OrderReceiptModal Component (TC-UI-POL-01 a TC-UI-POL-04)', () => {
  const mockReceiptData: OrderReceiptData = {
    orderId: 'ORD-1792515707463',
    createdAt: '2026-10-20T12:16:00.000Z',
    status: 'PAID',
    paymentMethod: {
      type: 'CREDIT_CARD',
      brand: 'Visa',
      lastFourDigits: '4242',
    },
    customer: {
      name: 'Julio Cano',
      email: 'julio.cano@ejemplo.com',
      phone: '+57 300 123 4567',
    },
    shippingAddress: {
      street: 'Cra 43A # 1-50, Apto 402',
      city: 'Medellín',
      department: 'Antioquia',
      notes: 'Entregar en portería principal',
    },
    financialSummary: {
      subtotal: 94.0,
      discounts: 0,
      shippingCost: 0,
      isFreeShipping: true,
      totalPaid: 94.0,
    },
    items: [
      {
        productId: 'prod-1',
        name: 'Serum Facial Hialurónico 50ml',
        thumbnailUrl: '/serum.webp',
        quantity: 2,
        unitPrice: 28.0,
        subtotal: 56.0,
      },
      {
        productId: 'prod-2',
        name: 'Óleo Reparador Rosa Mosqueta 30ml',
        thumbnailUrl: '/oleo.webp',
        quantity: 1,
        unitPrice: 38.0,
        subtotal: 38.0,
      },
    ],
  };

  const mockPaidOrder: PaidOrder = {
    orderId: 'ORD-1760731845000',
    customerEmail: 'maria@email.com',
    shippingAddress: 'Calle 93 # 14-20, Apto 402, Bogotá',
    createdAt: '2026-10-14T15:42:00.000Z',
    status: 'PAID',
    subtotalAmount: 142500,
    totalAmount: 142500,
    currency: 'COP',
    items: [
      {
        productId: '1',
        name: 'Serum Niacinamida 10%',
        thumbnailUrl: '/thumb1.webp',
        quantity: 1,
        salePrice: 62000,
      },
    ],
  };

  let printSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    printSpy = vi.spyOn(window, 'print').mockImplementation(() => {});
  });

  afterEach(() => {
    printSpy.mockRestore();
  });

  it('TC-UI-POL-01: renders modal with valid PAID order and all required testids', () => {
    render(
      <OrderReceiptModal
        isOpen={true}
        onClose={vi.fn()}
        order={mockReceiptData}
      />
    );

    expect(screen.getByTestId('receipt-modal')).toBeInTheDocument();
    expect(screen.getByTestId('receipt-order-id')).toHaveTextContent('ORD-1792515707463');
    expect(screen.getByTestId('receipt-status-badge')).toHaveTextContent(/Pago Confirmado/i);
    expect(screen.getByTestId('receipt-customer-name')).toHaveTextContent('Julio Cano');
    expect(screen.getByTestId('receipt-shipping-address')).toHaveTextContent('Cra 43A # 1-50, Apto 402, Medellín, Antioquia');
    expect(screen.getAllByTestId('receipt-item-row')).toHaveLength(2);
    expect(screen.getByTestId('receipt-total-paid')).toHaveTextContent('94.00');
    expect(screen.getByTestId('receipt-print-btn')).toBeInTheDocument();
  });

  it('TC-UI-POL-02: triggers window.print() when clicking print button', () => {
    render(
      <OrderReceiptModal
        isOpen={true}
        onClose={vi.fn()}
        order={mockReceiptData}
      />
    );

    const printBtn = screen.getByTestId('receipt-print-btn');
    fireEvent.click(printBtn);

    expect(printSpy).toHaveBeenCalledTimes(1);
  });

  it('TC-UI-POL-03: closes modal via close button, backdrop click, and Escape key', () => {
    const onClose = vi.fn();
    const { rerender } = render(
      <OrderReceiptModal
        isOpen={true}
        onClose={onClose}
        order={mockReceiptData}
      />
    );

    // 1. Close button
    const closeBtn = screen.getByTestId('receipt-modal-close-btn');
    fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalledTimes(1);

    // 2. Escape key
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(2);

    // 3. Backdrop click
    const backdrop = screen.getByTestId('receipt-modal-backdrop');
    fireEvent.click(backdrop);
    expect(onClose).toHaveBeenCalledTimes(3);

    // When isOpen is false, does not render
    rerender(
      <OrderReceiptModal
        isOpen={false}
        onClose={onClose}
        order={mockReceiptData}
      />
    );
    expect(screen.queryByTestId('receipt-modal')).not.toBeInTheDocument();
  });

  it('TC-UI-POL-04: renders free shipping badge when free shipping is unlocked', () => {
    render(
      <OrderReceiptModal
        isOpen={true}
        onClose={vi.fn()}
        order={mockReceiptData}
      />
    );

    const freeShippingBadge = screen.getByTestId('receipt-free-shipping-badge');
    expect(freeShippingBadge).toBeInTheDocument();
    expect(freeShippingBadge).toHaveTextContent(/GRATIS/i);
  });

  it('adapts PaidOrder format smoothly and displays customer information', () => {
    render(
      <OrderReceiptModal
        isOpen={true}
        onClose={vi.fn()}
        order={mockPaidOrder}
      />
    );

    expect(screen.getByTestId('receipt-order-id')).toHaveTextContent('ORD-1760731845000');
    expect(screen.getByTestId('receipt-shipping-address')).toHaveTextContent('Calle 93 # 14-20, Apto 402, Bogotá');
    expect(screen.getAllByTestId('receipt-item-row')).toHaveLength(1);
  });

  it('displays loading skeleton state when isLoading is true', () => {
    render(
      <OrderReceiptModal
        isOpen={true}
        onClose={vi.fn()}
        order={null}
        isLoading={true}
      />
    );

    expect(screen.getByRole('status')).toHaveAttribute('aria-busy', 'true');
  });

  it('displays empty state alert when order has no items', () => {
    render(
      <OrderReceiptModal
        isOpen={true}
        onClose={vi.fn()}
        order={{ ...mockReceiptData, items: [] }}
      />
    );

    expect(screen.getByRole('alert')).toHaveTextContent(/no registra productos/i);
  });

  it('displays error state when order is null and not loading', () => {
    render(
      <OrderReceiptModal
        isOpen={true}
        onClose={vi.fn()}
        order={null}
        isLoading={false}
      />
    );

    expect(screen.getByRole('alert')).toHaveTextContent(/No pudimos cargar los detalles fiscales/i);
  });
});
