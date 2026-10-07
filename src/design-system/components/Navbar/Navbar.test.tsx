import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach } from 'vitest';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Navbar } from './Navbar';
import { useCartStore } from '../../../features/cart/store/useCartStore';

const LocationDisplay = () => {
  const location = useLocation();
  return <div data-testid="location-display">{location.pathname + location.search}</div>;
};

const createWrapper = (initialEntries = ['/']) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <MemoryRouter initialEntries={initialEntries}>
      <QueryClientProvider client={queryClient}>
        {children}
        <LocationDisplay />
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

  it('TC-PLP-2.1.1: preserves categoryId and resets page=1 when searching text inside an active category', async () => {
    const user = userEvent.setup();
    render(<Navbar />, { wrapper: createWrapper(['/?categoryId=cat-1&page=2']) });

    const input = screen.getByPlaceholderText(/Buscar productos/i);
    await user.type(input, 'baño{Enter}');

    const loc = screen.getByTestId('location-display').textContent || '';
    expect(loc).toContain('categoryId=cat-1');
    expect(loc).toContain('query=ba%C3%B1o');
    expect(loc).toContain('page=1');
  });

  it('TC-PLP-2.1.2 & TC-PLP-2.1.3: preserves active query when selecting a category or selecting Todas las categorías', async () => {
    const user = userEvent.setup();
    render(<Navbar />, { wrapper: createWrapper(['/?query=cacao&page=2']) });

    const input = screen.getByPlaceholderText(/Buscar productos/i) as HTMLInputElement;
    expect(input.value).toBe('cacao');

    const categoriesButton = screen.getByRole('button', { name: /Categorías/i });
    await user.click(categoriesButton);

    const subcatBtn = await screen.findByText(/Jabones Artesanales/i);
    await user.click(subcatBtn);

    let loc = screen.getByTestId('location-display').textContent || '';
    expect(loc).toContain('categoryId=cat-3');
    expect(loc).toContain('query=cacao');
    expect(loc).toContain('page=1');

    // Now open dropdown and select "Todas las categorías" (TC-PLP-2.1.3)
    await user.click(screen.getByRole('button', { name: /Categorías/i }));
    const allCatsBtn = await screen.findByText(/Todas las categorías/i);
    await user.click(allCatsBtn);

    loc = screen.getByTestId('location-display').textContent || '';
    expect(loc).not.toContain('categoryId=');
    expect(loc).toContain('query=cacao');
    expect(loc).toContain('page=1');
  });
});
