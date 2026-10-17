import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { OrderHistoryCard } from './OrderHistoryCard';
import type { PaidOrder } from '../../types/orders.types';

describe('OrderHistoryCard Component (TC-UI-ORD-02, TC-UI-ORD-07)', () => {
  const mockOrder: PaidOrder = {
    orderId: 'ORD-1760731845000',
    customerEmail: 'maria@email.com',
    shippingAddress: 'Calle 93 # 14-20, Apto 402, Bogotá',
    createdAt: '2026-10-14T15:42:00.000Z',
    paidAt: '2026-10-14T15:42:00.000Z',
    status: 'PAID',
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
      {
        productId: '3',
        name: 'Exfoliante Corporal Café & Coco',
        thumbnailUrl: null,
        quantity: 1,
        salePrice: 45500,
        isAvailableToday: false,
      },
    ],
  };

  const renderCard = (props: Partial<React.ComponentProps<typeof OrderHistoryCard>> = {}) => {
    return render(
      <MemoryRouter>
        <OrderHistoryCard
          order={mockOrder}
          isReordering={false}
          onReorder={vi.fn()}
          {...props}
        />
      </MemoryRouter>
    );
  };

  it('TC-UI-ORD-02: renders emerald status badge with "✓ Pago Confirmado"', () => {
    renderCard();

    expect(screen.getByTestId('order-card-ORD-1760731845000')).toBeInTheDocument();

    const badge = screen.getByTestId('order-status-badge-ORD-1760731845000');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent(/✓ Pago Confirmado/i);
    expect(badge).toHaveAttribute('role', 'status');
  });

  it('renders order metadata: id, address, email, and formatted total amount', () => {
    renderCard();

    expect(screen.getByText(/ORD-1760731845000/i)).toBeInTheDocument();
    expect(screen.getByText(/Calle 93 # 14-20, Apto 402, Bogotá/i)).toBeInTheDocument();
    expect(screen.getByText(/maria@email.com/i)).toBeInTheDocument();

    const totalEl = screen.getByTestId('order-total-amount-ORD-1760731845000');
    expect(totalEl).toBeInTheDocument();
    expect(totalEl).toHaveTextContent(/142/);
  });

  it('renders purchased items with quantities, prices, and out-of-stock badge when applicable', () => {
    renderCard();

    const item1 = screen.getByTestId('order-product-item-ORD-1760731845000-1');
    expect(item1).toBeInTheDocument();
    expect(item1).toHaveTextContent(/Serum Niacinamida 10%/i);

    const item3 = screen.getByTestId('order-product-item-ORD-1760731845000-3');
    expect(item3).toBeInTheDocument();
    expect(item3).toHaveTextContent(/Exfoliante Corporal Café & Coco/i);

    const outOfStockBadge = screen.getByTestId('order-product-out-of-stock-badge-3');
    expect(outOfStockBadge).toBeInTheDocument();
    expect(outOfStockBadge).toHaveTextContent(/Agotado hoy/i);
  });

  it('triggers onReorder callback when clicking reorder button', () => {
    const onReorder = vi.fn();
    renderCard({ onReorder });

    const reorderBtn = screen.getByTestId('reorder-button-ORD-1760731845000');
    expect(reorderBtn).toBeInTheDocument();
    expect(reorderBtn).toHaveTextContent(/Volver a comprar/i);

    fireEvent.click(reorderBtn);
    expect(onReorder).toHaveBeenCalledWith(mockOrder);
  });

  it('disables reorder button and displays checking stock state when isReordering is true', () => {
    renderCard({ isReordering: true });

    const reorderBtn = screen.getByTestId('reorder-button-ORD-1760731845000');
    expect(reorderBtn).toBeDisabled();
    expect(reorderBtn).toHaveTextContent(/Verificando stock/i);
  });

  it('renders view voucher link and invokes callback if provided', () => {
    const onViewVoucher = vi.fn();
    renderCard({ onViewVoucher });

    const voucherLink = screen.getByTestId('view-voucher-link-ORD-1760731845000');
    expect(voucherLink).toBeInTheDocument();
    expect(voucherLink).toHaveTextContent(/Ver comprobante/i);

    fireEvent.click(voucherLink);
    expect(onViewVoucher).toHaveBeenCalledWith('ORD-1760731845000');
  });
});
