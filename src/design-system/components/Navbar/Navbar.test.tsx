import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Navbar } from './Navbar';
import { useCartStore } from '../../../features/cart/store/useCartStore';

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <MemoryRouter>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </MemoryRouter>
  );
};

describe('Navbar Component', () => {
  beforeEach(() => {
    useCartStore.getState().clearCart();
  });

  it('renders correctly with all base elements', () => {
    render(<Navbar />, { wrapper: createWrapper() });
    expect(screen.getByText('[ LOGO ]')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Buscar productos/i)).toBeInTheDocument();
    expect(screen.getByText(/Hola, Julio Cano/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Categorías/i })).toBeInTheDocument();
  });

  it('does not display badge when cart is empty', () => {
    render(<Navbar />, { wrapper: createWrapper() });
    const badge = screen.queryByTestId('cart-badge');
    expect(badge).not.toBeInTheDocument();
  });

  it('displays the correct number of items in the cart badge', () => {
    useCartStore.getState().addItem({ id: '1', name: 'Item', priceWhenAdded: 10, quantity: 5 });
    useCartStore.getState().addItem({ id: '2', name: 'Item 2', priceWhenAdded: 20, quantity: 3 });

    render(<Navbar />, { wrapper: createWrapper() });

    const badge = screen.getByTestId('cart-badge');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent('8');
  });

  it('toggles category dropdown and displays category tree', async () => {
    const user = userEvent.setup();
    render(<Navbar />, { wrapper: createWrapper() });

    const categoriesButton = screen.getByRole('button', { name: /Categorías/i });
    await user.click(categoriesButton);

    await waitFor(() => {
      expect(screen.getByText(/Cuidado Corporal/i)).toBeInTheDocument();
      expect(screen.getByText(/Jabones Artesanales/i)).toBeInTheDocument();
      expect(screen.getByText(/Sales de Baño/i)).toBeInTheDocument();
      expect(screen.getByText(/Cuidado Facial/i)).toBeInTheDocument();
    });

    // Clicking again closes dropdown
    await user.click(categoriesButton);
    expect(screen.queryByText(/Jabones Artesanales/i)).not.toBeInTheDocument();
  });
});
