import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import { CartItemRow, type CartItemProps } from './CartItemRow';

const renderRow = (props: Partial<CartItemProps> = {}) => {
  const defaultProps: CartItemProps = {
    item: {
      id: '1',
      name: 'Jabón Cacao y Avena',
      thumbnailUrl: '/products/prod-1-thumb.webp?X-Amz-Signature=abc',
      priceWhenAdded: 15,
      quantity: 2,
    },
    currentPrice: 15,
    discountPercentage: 20,
    availableStock: 8,
    disponible: true,
    isDeleted: false,
    onRemove: () => {},
    onChangeQuantity: () => {},
    ...props,
  };

  return render(
    <MemoryRouter>
      <CartItemRow {...defaultProps} />
    </MemoryRouter>
  );
};

describe('CartItemRow Component (Fases 4.1 y 4.2)', () => {
  it('TC-CART-4.1.1: renders thumbnailUrl image, links title to PDP, and does not render checkbox or "img" placeholder', () => {
    renderRow();

    const img = screen.getByRole('img', { name: 'Jabón Cacao y Avena' });
    expect(img).toHaveAttribute('src', '/products/prod-1-thumb.webp?X-Amz-Signature=abc');

    const link = screen.getByRole('link', { name: 'Jabón Cacao y Avena' });
    expect(link).toHaveAttribute('href', '/products/1');

    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
    expect(screen.queryByText('img')).not.toBeInTheDocument();
  });

  it('TC-CART-4.1.2: shows "Sin imagen" fallback when thumbnailUrl is null or fails with onError', () => {
    const { unmount } = renderRow({
      item: {
        id: '1',
        name: 'Jabón Cacao',
        thumbnailUrl: null,
        priceWhenAdded: 15,
        quantity: 1,
      },
    });
    expect(screen.getByText('Sin imagen')).toBeInTheDocument();
    unmount();

    renderRow();
    const img = screen.getByRole('img', { name: 'Jabón Cacao y Avena' });
    fireEvent.error(img);
    expect(screen.getByText('Sin imagen')).toBeInTheDocument();
  });

  it('TC-CART-4.1.3 & TC-CART-4.1.4: displays official -X% OFF badge without fake crossed-out price, and hides badge when discountPercentage is 0', () => {
    const { unmount } = renderRow({ currentPrice: 15, discountPercentage: 20 });

    expect(screen.getByText('$15.00 c/u')).toBeInTheDocument();
    expect(screen.getByText('$30.00')).toBeInTheDocument(); // 2 * 15.00 line subtotal
    expect(screen.getByText('-20% OFF')).toBeInTheDocument();
    // Ensure old fake price (15 * 1.3 = 20) is never rendered
    expect(screen.queryByText('$20')).not.toBeInTheDocument();
    unmount();

    renderRow({ currentPrice: 22, discountPercentage: 0 });
    expect(screen.getByText('$22.00 c/u')).toBeInTheDocument();
    expect(screen.queryByText(/% OFF/i)).not.toBeInTheDocument();
  });

  it('TC-CART-4.1.5: shows price change alert when currentPrice differs from priceWhenAdded', () => {
    const { unmount } = renderRow({
      item: { id: '1', name: 'Jabón Cacao', priceWhenAdded: 20, quantity: 1 },
      currentPrice: 15,
    });
    expect(screen.getByText(/Bajó \$5\.00 desde que lo agregaste/i)).toBeInTheDocument();
    unmount();

    renderRow({
      item: { id: '1', name: 'Jabón Cacao', priceWhenAdded: 15, quantity: 1 },
      currentPrice: 18,
    });
    expect(screen.getByText(/El precio se actualizó a \$18\.00/i)).toBeInTheDocument();
  });

  it('TC-CART-4.2.1 & TC-CART-4.2.2: dynamically renders <select> options up to availableStock (e.g. 8 or 3)', () => {
    const { unmount } = renderRow({ availableStock: 8 });
    const options8 = screen.getAllByRole('option');
    expect(options8).toHaveLength(8);
    expect(options8[7]).toHaveTextContent('Cant. 8');
    unmount();

    renderRow({
      item: { id: '1', name: 'Jabón Cacao', priceWhenAdded: 15, quantity: 1 },
      availableStock: 3,
    });
    const options3 = screen.getAllByRole('option');
    expect(options3).toHaveLength(3);
    expect(options3[2]).toHaveTextContent('Cant. 3');
  });

  it('TC-CART-4.2.3: shows current requested quantity as disabled "(Sin stock)" option when item.quantity > availableStock', () => {
    renderRow({
      item: { id: '1', name: 'Jabón Cacao', priceWhenAdded: 15, quantity: 5 },
      availableStock: 2,
      validationMessage: 'Stock parcial: solo quedan 2',
    });

    const select = screen.getByRole('combobox') as HTMLSelectElement;
    expect(select.value).toBe('5');
    expect(screen.getByRole('option', { name: 'Cant. 5 (Sin stock)' })).toBeDisabled();
    expect(screen.getByRole('option', { name: 'Cant. 2' })).not.toBeDisabled();
    expect(screen.getByText(/Stock parcial: solo quedan 2/i)).toBeInTheDocument();
  });

  it('TC-CART-4.2.4: disables <select> and hides PDP link when item is out of stock or deleted from catalog', () => {
    renderRow({
      disponible: false,
      availableStock: 0,
      isDeleted: true,
      validationMessage: 'El producto ya no existe en el catálogo.',
    });

    expect(screen.getByRole('combobox')).toBeDisabled();
    expect(screen.getByText('No disponible')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Jabón Cacao y Avena' })).not.toBeInTheDocument();
  });

  it('calls onRemove and onChangeQuantity callbacks', () => {
    const removeMock = vi.fn();
    const changeMock = vi.fn();
    renderRow({ onRemove: removeMock, onChangeQuantity: changeMock });

    fireEvent.click(screen.getByLabelText('Eliminar'));
    expect(removeMock).toHaveBeenCalledWith('1');

    fireEvent.change(screen.getByRole('combobox'), { target: { value: '4' } });
    expect(changeMock).toHaveBeenCalledWith('1', 4);
  });
});
