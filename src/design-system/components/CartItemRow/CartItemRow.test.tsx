import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { CartItemRow } from './CartItemRow';

describe('CartItemRow Component', () => {
  const mockItem = {
    id: '1',
    name: 'Test Product',
    priceWhenAdded: 150000,
    quantity: 1
  };

  it('renders correctly and shows price drop alert if currentPrice is lower', () => {
    render(<CartItemRow item={mockItem} currentPrice={100000} disponible={true} onRemove={() => {}} onChangeQuantity={() => {}} />);
    
    expect(screen.getByText('Test Product')).toBeInTheDocument();
    expect(screen.getByText('Disponible')).toBeInTheDocument();
    expect(screen.getByText('-$50000 que cuando se agregó')).toBeInTheDocument();
    expect(screen.getByText('$100000')).toBeInTheDocument();
  });

  it('calls onRemove when trash is clicked', () => {
    const removeMock = vi.fn();
    render(<CartItemRow item={mockItem} currentPrice={150000} disponible={true} onRemove={removeMock} onChangeQuantity={() => {}} />);
    
    fireEvent.click(screen.getByLabelText('Eliminar'));
    expect(removeMock).toHaveBeenCalledWith('1');
  });

  it('calls onChangeQuantity when select changes', () => {
    const changeMock = vi.fn();
    render(<CartItemRow item={mockItem} currentPrice={150000} disponible={true} onRemove={() => {}} onChangeQuantity={changeMock} />);
    
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: '3' } });
    expect(changeMock).toHaveBeenCalledWith('1', 3);
  });
});
