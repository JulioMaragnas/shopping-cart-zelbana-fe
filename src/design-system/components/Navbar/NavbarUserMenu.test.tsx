import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { NavbarUserMenu } from './NavbarUserMenu';

describe('NavbarUserMenu Component (TC-UI-AUTH-12)', () => {
  const mockUser = {
    id: 'usr-1',
    name: 'Julio Cano',
    email: 'julio@ejemplo.com',
  };

  const renderComponent = (onLogout = vi.fn()) => {
    return {
      onLogout,
      ...render(
        <MemoryRouter>
          <NavbarUserMenu user={mockUser} onLogout={onLogout} />
        </MemoryRouter>
      ),
    };
  };

  it('renders dropdown button with user initials and greeting', () => {
    renderComponent();

    const triggerBtn = screen.getByTestId('navbar-user-dropdown-btn');
    expect(triggerBtn).toBeInTheDocument();
    expect(triggerBtn).toHaveTextContent('JC');
    expect(triggerBtn).toHaveTextContent('Hola, Julio');
    expect(triggerBtn).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByTestId('navbar-user-dropdown-menu')).not.toBeInTheDocument();
  });

  it('toggles dropdown menu on click', async () => {
    const user = userEvent.setup();
    renderComponent();

    const triggerBtn = screen.getByTestId('navbar-user-dropdown-btn');
    await user.click(triggerBtn);

    expect(triggerBtn).toHaveAttribute('aria-expanded', 'true');
    const menu = screen.getByTestId('navbar-user-dropdown-menu');
    expect(menu).toBeInTheDocument();
    expect(screen.getByText('Julio Cano')).toBeInTheDocument();
    expect(screen.getByText('julio@ejemplo.com')).toBeInTheDocument();
    expect(screen.getByTestId('navbar-user-orders-link')).toBeInTheDocument();
    expect(screen.getByTestId('navbar-user-logout-btn')).toBeInTheDocument();

    // Clicking again closes menu
    await user.click(triggerBtn);
    expect(screen.queryByTestId('navbar-user-dropdown-menu')).not.toBeInTheDocument();
  });

  it('calls onLogout and closes menu when clicking logout button', async () => {
    const user = userEvent.setup();
    const onLogout = vi.fn();
    renderComponent(onLogout);

    const triggerBtn = screen.getByTestId('navbar-user-dropdown-btn');
    await user.click(triggerBtn);

    const logoutBtn = screen.getByTestId('navbar-user-logout-btn');
    await user.click(logoutBtn);

    expect(onLogout).toHaveBeenCalledTimes(1);
    expect(screen.queryByTestId('navbar-user-dropdown-menu')).not.toBeInTheDocument();
  });

  it('closes dropdown menu when pressing Escape key', async () => {
    const user = userEvent.setup();
    renderComponent();

    const triggerBtn = screen.getByTestId('navbar-user-dropdown-btn');
    await user.click(triggerBtn);
    expect(screen.getByTestId('navbar-user-dropdown-menu')).toBeInTheDocument();

    await user.keyboard('{Escape}');
    expect(screen.queryByTestId('navbar-user-dropdown-menu')).not.toBeInTheDocument();
  });
});
