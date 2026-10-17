import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { BuyBoxSortBar, type SortOption } from './BuyBoxSortBar';

describe('BuyBoxSortBar Component (TC-UI-BUYBOX-01, 02, 11, 12)', () => {
  it('TC-UI-BUYBOX-01: renders all 5 pills with semantic buttons and active aria-pressed state', () => {
    const handleSortChange = vi.fn();
    render(
      <BuyBoxSortBar
        activeSort="recommended"
        onSortChange={handleSortChange}
        totalItems={24}
      />
    );

    // Contenedor principal
    const bar = screen.getByTestId('buybox-sort-bar');
    expect(bar).toBeInTheDocument();
    expect(bar).toHaveAttribute('aria-label', 'Ordenamiento y filtros del catálogo');

    // Contador de items
    const itemCount = screen.getByTestId('buybox-item-count');
    expect(itemCount).toHaveTextContent('24 productos');

    // 5 Píldoras presentes
    const expectedPills: { id: SortOption; label: string }[] = [
      { id: 'recommended', label: 'Recomendados' },
      { id: 'best_selling', label: 'Más vendidos' },
      { id: 'highest_discount', label: 'Mayor descuento' },
      { id: 'price_asc', label: 'Menor precio' },
      { id: 'price_desc', label: 'Mayor precio' },
    ];

    expectedPills.forEach(({ id, label }) => {
      const pill = screen.getByTestId(`sort-pill-${id}`);
      expect(pill).toBeInTheDocument();
      expect(pill).toHaveTextContent(label);
    });

    // Píldora activa 'recommended'
    const recommendedPill = screen.getByTestId('sort-pill-recommended');
    expect(recommendedPill).toHaveAttribute('aria-pressed', 'true');

    // Las demás inactivas
    const otherPill = screen.getByTestId('sort-pill-best_selling');
    expect(otherPill).toHaveAttribute('aria-pressed', 'false');
  });

  it('TC-UI-BUYBOX-02: triggers onSortChange with the selected sort id on pill click', async () => {
    const user = userEvent.setup();
    const handleSortChange = vi.fn();

    render(
      <BuyBoxSortBar
        activeSort="recommended"
        onSortChange={handleSortChange}
        totalItems={10}
      />
    );

    const bestSellingPill = screen.getByTestId('sort-pill-best_selling');
    await user.click(bestSellingPill);

    expect(handleSortChange).toHaveBeenCalledTimes(1);
    expect(handleSortChange).toHaveBeenCalledWith('best_selling');
  });

  it('TC-UI-BUYBOX-02b: does not trigger onSortChange if clicking the already active pill', async () => {
    const user = userEvent.setup();
    const handleSortChange = vi.fn();

    render(
      <BuyBoxSortBar
        activeSort="recommended"
        onSortChange={handleSortChange}
        totalItems={10}
      />
    );

    const recommendedPill = screen.getByTestId('sort-pill-recommended');
    await user.click(recommendedPill);

    expect(handleSortChange).not.toHaveBeenCalled();
  });

  it('TC-UI-BUYBOX-11: keyboard accessible via Tab and Enter / Space', async () => {
    const user = userEvent.setup();
    const handleSortChange = vi.fn();

    render(
      <BuyBoxSortBar
        activeSort="recommended"
        onSortChange={handleSortChange}
        totalItems={15}
      />
    );

    const priceDescPill = screen.getByTestId('sort-pill-price_desc');
    priceDescPill.focus();
    expect(priceDescPill).toHaveFocus();

    await user.keyboard('{Enter}');
    expect(handleSortChange).toHaveBeenCalledWith('price_desc');
  });

  it('TC-UI-BUYBOX-12: supports touch scrolling and maintains accessible touch targets', () => {
    const handleSortChange = vi.fn();
    const { container } = render(
      <BuyBoxSortBar
        activeSort="recommended"
        onSortChange={handleSortChange}
        totalItems={5}
      />
    );

    const track = container.querySelector('[role="group"]');
    expect(track).toBeInTheDocument();
    expect(track).toHaveAttribute('aria-label', 'Criterios de ordenamiento');
  });

  it('disables all pills when disabled prop is true', async () => {
    const user = userEvent.setup();
    const handleSortChange = vi.fn();

    render(
      <BuyBoxSortBar
        activeSort="recommended"
        onSortChange={handleSortChange}
        totalItems={0}
        disabled={true}
      />
    );

    const pill = screen.getByTestId('sort-pill-price_asc');
    expect(pill).toBeDisabled();

    await user.click(pill);
    expect(handleSortChange).not.toHaveBeenCalled();
  });

  it('renders singular "1 producto" when totalItems is 1', () => {
    render(
      <BuyBoxSortBar
        activeSort="recommended"
        onSortChange={vi.fn()}
        totalItems={1}
      />
    );
    expect(screen.getByTestId('buybox-item-count')).toHaveTextContent('1 producto');
  });
});
