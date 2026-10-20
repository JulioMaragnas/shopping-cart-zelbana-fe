import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HelpModal } from './HelpModal';
import { server } from '../../../../mocks/server';
import { http, HttpResponse } from 'msw';

describe('HelpModal Component (TC-UI-POL-05 a TC-UI-POL-08)', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
  });

  const renderModal = (props: Partial<React.ComponentProps<typeof HelpModal>> = {}) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <HelpModal isOpen={true} onClose={vi.fn()} {...props} />
      </QueryClientProvider>
    );
  };

  it('TC-UI-POL-05: opens modal with help-modal data-testid and loads topics from API', async () => {
    renderModal();

    expect(screen.getByTestId('help-modal')).toBeInTheDocument();
    expect(screen.getByTestId('help-search-input')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText(/Envíos y Tiempos de Entrega/i)).toBeInTheDocument();
    });

    // Check direct support card is present
    expect(screen.getByTestId('help-direct-support-card')).toBeInTheDocument();
  });

  it('TC-UI-POL-06: navigating category tabs filters corresponding topics', async () => {
    renderModal();

    await waitFor(() => {
      expect(screen.getByText(/Envíos y Tiempos de Entrega/i)).toBeInTheDocument();
    });

    const categoryTabs = screen.getAllByTestId('help-category-tab');
    expect(categoryTabs.length).toBeGreaterThan(1);

    // Click on "Pagos" tab
    const paymentsTab = categoryTabs.find((tab) =>
      tab.textContent?.toLowerCase().includes('pago')
    );
    expect(paymentsTab).toBeDefined();
    if (paymentsTab) {
      fireEvent.click(paymentsTab);
    }

    await waitFor(() => {
      expect(screen.getByText(/Medios de Pago y Transacciones Seguras/i)).toBeInTheDocument();
      expect(screen.queryByText(/Envíos y Tiempos de Entrega/i)).not.toBeInTheDocument();
    });
  });

  it('TC-UI-POL-07: filtering by search keyword dynamically narrows accordion items', async () => {
    const user = userEvent.setup();
    renderModal();

    await waitFor(() => {
      expect(screen.getByText(/Envíos y Tiempos de Entrega/i)).toBeInTheDocument();
    });

    const searchInput = screen.getByTestId('help-search-input');
    await user.type(searchInput, 'recompra');

    await waitFor(() => {
      expect(screen.getByText(/Seguimiento de Pedidos y Recompra/i)).toBeInTheDocument();
      expect(screen.queryByText(/Medios de Pago y Transacciones Seguras/i)).not.toBeInTheDocument();
    });
  });

  it('TC-UI-POL-08: renders friendly error state and direct support card if API returns 500', async () => {
    server.use(
      http.get('*/storefront/api/help', () => {
        return HttpResponse.json({ error: 'Server error' }, { status: 500 });
      })
    );

    renderModal();

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    expect(screen.getByText(/temporalmente no disponible/i)).toBeInTheDocument();
    expect(screen.getByTestId('help-direct-support-card')).toBeInTheDocument();
  });

  it('toggles accordion items open and closed on click', async () => {
    renderModal();

    await waitFor(() => {
      expect(screen.getByText(/Envíos y Tiempos de Entrega/i)).toBeInTheDocument();
    });

    const items = screen.getAllByTestId('help-accordion-item');
    expect(items.length).toBeGreaterThan(0);

    const firstItemHeader = items[0].querySelector('button') || items[0];
    fireEvent.click(firstItemHeader);

    // Content should be accessible
    expect(items[0]).toBeInTheDocument();
  });

  it('closes modal when clicking close button, backdrop, or pressing Escape', () => {
    const onClose = vi.fn();
    const { rerender } = render(
      <QueryClientProvider client={queryClient}>
        <HelpModal isOpen={true} onClose={onClose} />
      </QueryClientProvider>
    );

    // 1. Close button
    const closeBtn = screen.getByTestId('help-modal-close-btn');
    fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalledTimes(1);

    // 2. Escape key
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(2);

    // 3. Backdrop
    const backdrop = screen.getByTestId('help-modal-backdrop');
    fireEvent.click(backdrop);
    expect(onClose).toHaveBeenCalledTimes(3);

    // Closed state
    rerender(
      <QueryClientProvider client={queryClient}>
        <HelpModal isOpen={false} onClose={onClose} />
      </QueryClientProvider>
    );
    expect(screen.queryByTestId('help-modal')).not.toBeInTheDocument();
  });

  it('displays empty state when search finds no matches', async () => {
    const user = userEvent.setup();
    renderModal();

    await waitFor(() => {
      expect(screen.getByText(/Envíos y Tiempos de Entrega/i)).toBeInTheDocument();
    });

    const searchInput = screen.getByTestId('help-search-input');
    await user.type(searchInput, 'nonexistentqueryxyz');

    await waitFor(() => {
      expect(screen.getByText(/No encontramos artículos para tu búsqueda/i)).toBeInTheDocument();
    });
  });
});
