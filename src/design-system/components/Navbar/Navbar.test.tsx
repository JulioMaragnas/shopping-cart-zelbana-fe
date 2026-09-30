import { render, screen } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { Navbar } from './Navbar';
import { useCartStore } from '../../../features/cart/store/useCartStore';

describe('Navbar Component', () => {
  beforeEach(() => {
    useCartStore.getState().clearCart();
  });

  it('renders correctly with all base elements', () => {
    render(<Navbar />);
    expect(screen.getByText('[ LOGO ]')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Buscar productos/i)).toBeInTheDocument();
    expect(screen.getByText(/Hola, Julio Cano/i)).toBeInTheDocument();
  });

  it('does not display badge when cart is empty', () => {
    render(<Navbar />);
    const badge = screen.queryByTestId('cart-badge');
    expect(badge).not.toBeInTheDocument();
  });

  it('displays the correct number of items in the cart badge', () => {
    useCartStore.getState().addItem({ id: '1', name: 'Item', priceWhenAdded: 10, quantity: 5 });
    useCartStore.getState().addItem({ id: '2', name: 'Item 2', priceWhenAdded: 20, quantity: 3 });

    render(<Navbar />);
    
    const badge = screen.getByTestId('cart-badge');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent('8');
  });
});
