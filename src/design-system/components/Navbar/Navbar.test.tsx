import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach } from 'vitest';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Navbar } from './Navbar';
import { useCartStore } from '../../../features/cart/store/useCartStore';
import { useAuthStore } from '../../../features/auth/store/useAuthStore';

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
    localStorage.clear();
    useAuthStore.setState({
      token: null,
      user: null,
      isAuthenticated: false,
    });
    useCartStore.getState().clearCart();
    useCartStore.getState().closeDrawer();
  });

  it('renders correctly with all base elements and defaults to auth links', () => {
    render(<Navbar />, { wrapper: createWrapper() });
    expect(screen.getByText('[ LOGO ]')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Buscar productos/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Categorías/i })).toBeInTheDocument();
    expect(screen.getByTestId('navbar-auth-links')).toBeInTheDocument();
    expect(screen.getByTestId('navbar-help-btn')).toBeInTheDocument();
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

  describe('Mini-Cart Drawer integration (TDD-FE-MC-04, TDD-FE-MC-05)', () => {
    it('TDD-FE-MC-04: clicking cart-button in catalog routes intercepts navigation and toggles drawer', async () => {
      const user = userEvent.setup();
      render(<Navbar />, { wrapper: createWrapper(['/']) });

      expect(useCartStore.getState().isDrawerOpen).toBe(false);

      const cartBtn = screen.getByTestId('cart-button');
      await user.click(cartBtn);

      expect(useCartStore.getState().isDrawerOpen).toBe(true);
      expect(screen.getByTestId('location-display').textContent).toBe('/');
    });

    it('TDD-FE-MC-05: clicking cart-button in /cart or /checkout routes does not open drawer', async () => {
      const user = userEvent.setup();
      render(<Navbar />, { wrapper: createWrapper(['/cart']) });

      expect(useCartStore.getState().isDrawerOpen).toBe(false);

      const cartBtn = screen.getByTestId('cart-button');
      await user.click(cartBtn);

      expect(useCartStore.getState().isDrawerOpen).toBe(false);
      expect(screen.getByTestId('location-display').textContent).toBe('/cart');
    });
  });

  describe('Mis Pedidos navigation (TDD-FE-ORD-02 / TC-UI-ORD-10)', () => {
    it('renders Mis Pedidos link with data-testid="nav-link-my-orders" and navigates to /orders', async () => {
      const user = userEvent.setup();
      render(<Navbar />, { wrapper: createWrapper(['/']) });

      const ordersLink = screen.getByTestId('nav-link-my-orders');
      expect(ordersLink).toBeInTheDocument();
      expect(ordersLink).toHaveTextContent(/Mis Pedidos/i);

      await user.click(ordersLink);
      expect(screen.getByTestId('location-display').textContent).toBe('/orders');
    });
  });

  describe('Dynamic Guest Identity & Help Center (TC-UI-POL-11, TC-UI-POL-12)', () => {
    it('TC-UI-POL-11: renders "Hola, {primerNombre}" with data-testid="navbar-greeting" when customer name exists in localStorage', () => {
      localStorage.setItem('zelbana-customer-name', 'Julio Cano');
      render(<Navbar />, { wrapper: createWrapper(['/']) });

      const greeting = screen.getByTestId('navbar-greeting');
      expect(greeting).toBeInTheDocument();
      expect(greeting).toHaveTextContent('Hola, Julio');
      expect(screen.queryByTestId('navbar-auth-links')).not.toBeInTheDocument();
    });

    it('TC-UI-POL-12: renders login and register links with data-testid="navbar-auth-links" when visitor is anonymous', () => {
      render(<Navbar />, { wrapper: createWrapper(['/']) });

      const authLinks = screen.getByTestId('navbar-auth-links');
      expect(authLinks).toBeInTheDocument();
      expect(screen.getByText(/Iniciar Sesión/i)).toBeInTheDocument();
      expect(screen.getByText(/Registrarse/i)).toBeInTheDocument();
      expect(screen.queryByTestId('navbar-greeting')).not.toBeInTheDocument();
    });

    it('opens HelpModal when clicking navbar-help-btn', async () => {
      const user = userEvent.setup();
      render(<Navbar />, { wrapper: createWrapper(['/']) });

      const helpBtn = screen.getByTestId('navbar-help-btn');
      expect(helpBtn).toBeInTheDocument();

      await user.click(helpBtn);

      await waitFor(() => {
        expect(screen.getByTestId('help-modal')).toBeInTheDocument();
      });
    });

    it('TC-UI-AUTH-12: renders NavbarUserMenu when user is authenticated, and toggles dropdown', async () => {
      const user = userEvent.setup();
      useAuthStore.setState({
        token: 'valid-jwt',
        user: { id: 'usr-1', name: 'Julio Cano', email: 'julio@ejemplo.com' },
        isAuthenticated: true,
      });

      render(<Navbar />, { wrapper: createWrapper(['/']) });

      expect(screen.getByTestId('navbar-user-dropdown-btn')).toBeInTheDocument();
      expect(screen.getByText('Hola, Julio')).toBeInTheDocument();
      expect(screen.queryByTestId('navbar-auth-links')).not.toBeInTheDocument();

      // Click to open dropdown
      await user.click(screen.getByTestId('navbar-user-dropdown-btn'));
      expect(screen.getByTestId('navbar-user-dropdown-menu')).toBeInTheDocument();
      expect(screen.getByTestId('navbar-user-orders-link')).toBeInTheDocument();
      expect(screen.getByTestId('navbar-user-logout-btn')).toBeInTheDocument();

      // Logout
      await user.click(screen.getByTestId('navbar-user-logout-btn'));
      expect(useAuthStore.getState().isAuthenticated).toBe(false);
      expect(screen.getByTestId('navbar-auth-links')).toBeInTheDocument();
    });
  });
});

