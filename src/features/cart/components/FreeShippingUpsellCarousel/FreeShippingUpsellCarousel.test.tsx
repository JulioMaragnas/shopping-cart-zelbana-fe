import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FreeShippingUpsellCarousel } from './FreeShippingUpsellCarousel';
import type { ShippingPromotionDTO, UpsellProductDTO } from '../../types';

const mockUpsellProducts: UpsellProductDTO[] = [
  {
    id: 'prod-sweet',
    name: 'Serum Vitamina C',
    thumbnailUrl: '/products/serum.webp',
    salePrice: 16.5,
    discountPercentage: 0,
    categoryId: 'cat-facial',
    categoryName: 'Cuidado Facial',
    isAvailable: true,
    disponible: true,
    maxOrderQuantity: 10,
    coversMissingAmount: true,
  },
  {
    id: 'prod-discount',
    name: 'Tónico Botánico',
    thumbnailUrl: null,
    salePrice: 12.0,
    discountPercentage: 20,
    categoryId: 'cat-tonicos',
    categoryName: 'Tónicos',
    isAvailable: true,
    disponible: true,
    maxOrderQuantity: 10,
    coversMissingAmount: false,
  },
  {
    id: 'prod-regular',
    name: 'Crema Hidratante',
    thumbnailUrl: '/products/crema.webp',
    salePrice: 10.0,
    discountPercentage: 0,
    categoryId: 'cat-cremas',
    categoryName: 'Cremas',
    isAvailable: true,
    disponible: true,
    maxOrderQuantity: 5,
    coversMissingAmount: false,
  },
];

const mockPromotionInProgress: ShippingPromotionDTO = {
  enabled: true,
  threshold: 50.0,
  currentAmount: 35.0,
  missingAmount: 15.0,
  percentage: 70,
  isFreeShippingUnlocked: false,
  upsellProducts: mockUpsellProducts,
};

const mockPromotionUnlocked: ShippingPromotionDTO = {
  enabled: true,
  threshold: 50.0,
  currentAmount: 55.0,
  missingAmount: 0,
  percentage: 100,
  isFreeShippingUnlocked: true,
  upsellProducts: [],
};

describe('FreeShippingUpsellCarousel Component', () => {
  it('returns null when promotion is disabled (enabled = false)', () => {
    const disabledPromotion: ShippingPromotionDTO = {
      ...mockPromotionInProgress,
      enabled: false,
    };

    render(
      <FreeShippingUpsellCarousel
        promotion={disabledPromotion}
        onAddUpsellProduct={vi.fn()}
      />
    );

    expect(screen.queryByTestId('free-shipping-upsell-container')).not.toBeInTheDocument();
  });

  it('TC-UI-FS-05 & TC-UI-FS-11: renders in-progress state with missing notice, progressbar, and upsell carousel', () => {
    render(
      <FreeShippingUpsellCarousel
        promotion={mockPromotionInProgress}
        onAddUpsellProduct={vi.fn()}
      />
    );

    expect(screen.getByTestId('free-shipping-upsell-container')).toBeInTheDocument();

    const missingNotice = screen.getByTestId('free-shipping-goal-missing');
    expect(missingNotice).toHaveTextContent(/¡Te faltan \$15\.00 para tener ENVÍO GRATIS!/i);
    expect(missingNotice).toHaveTextContent(/\(Meta: \$50\.00\)/i);

    const progressbar = screen.getByRole('progressbar');
    expect(progressbar).toHaveAttribute('aria-valuenow', '70');
    expect(progressbar).toHaveAttribute('aria-valuemin', '0');
    expect(progressbar).toHaveAttribute('aria-valuemax', '100');
    expect(progressbar).toHaveAttribute('aria-label', 'Progreso hacia envío gratis: 70%');

    const fill = screen.getByTestId('free-shipping-progress-fill');
    expect(fill).toHaveStyle({ width: '70%' });

    expect(screen.getByTestId('free-shipping-percentage-text')).toHaveTextContent('70%');
    expect(screen.getByText(/\$35\.00 alcanzados/i)).toBeInTheDocument();

    expect(screen.getByTestId('upsell-carousel-section')).toBeInTheDocument();
    expect(screen.getByTestId('upsell-carousel-track')).toBeInTheDocument();
    expect(screen.getAllByRole('article')).toHaveLength(3);
  });

  it('TC-UI-FS-06: renders "✨ ¡Te da Envío Gratis!" badge for sweet spot item and "-XX% OFF" for discounted item', () => {
    render(
      <FreeShippingUpsellCarousel
        promotion={mockPromotionInProgress}
        onAddUpsellProduct={vi.fn()}
      />
    );

    // Sweet spot item (coversMissingAmount = true)
    const sweetBadge = screen.getByTestId('upsell-badge-covers-prod-sweet');
    expect(sweetBadge).toHaveTextContent(/✨ ¡Te da Envío Gratis!/i);

    // Discount item (coversMissingAmount = false, discountPercentage = 20)
    const discountBadge = screen.getByTestId('upsell-badge-discount-prod-discount');
    expect(discountBadge).toHaveTextContent(/-20% OFF/i);

    // Regular item (no badge)
    expect(screen.queryByTestId('upsell-badge-covers-prod-regular')).not.toBeInTheDocument();
    expect(screen.queryByTestId('upsell-badge-discount-prod-regular')).not.toBeInTheDocument();
  });

  it('TC-UI-FS-07: triggers onAddUpsellProduct on button click and renders "Agregando..." when isAddingId matches', () => {
    const handleAdd = vi.fn();
    const { rerender } = render(
      <FreeShippingUpsellCarousel
        promotion={mockPromotionInProgress}
        onAddUpsellProduct={handleAdd}
      />
    );

    const addBtn = screen.getByTestId('upsell-add-btn-prod-sweet');
    expect(addBtn).toHaveTextContent('+ Agregar');
    expect(addBtn).toBeEnabled();

    fireEvent.click(addBtn);
    expect(handleAdd).toHaveBeenCalledTimes(1);
    expect(handleAdd).toHaveBeenCalledWith(mockUpsellProducts[0]);

    // Rerender con isAddingId activado
    rerender(
      <FreeShippingUpsellCarousel
        promotion={mockPromotionInProgress}
        onAddUpsellProduct={handleAdd}
        isAddingId="prod-sweet"
      />
    );

    const disabledBtn = screen.getByTestId('upsell-add-btn-prod-sweet');
    expect(disabledBtn).toHaveTextContent('Agregando...');
    expect(disabledBtn).toBeDisabled();
  });

  it('TC-UI-FS-08: renders unlocked state at 100% and folds/hides upsell carousel section without CLS', () => {
    render(
      <FreeShippingUpsellCarousel
        promotion={mockPromotionUnlocked}
        onAddUpsellProduct={vi.fn()}
      />
    );

    const unlockedNotice = screen.getByTestId('free-shipping-goal-unlocked');
    expect(unlockedNotice).toHaveTextContent(/¡Felicidades! Desbloqueaste ENVÍO GRATIS en tu pedido/i);

    const progressbar = screen.getByRole('progressbar');
    expect(progressbar).toHaveAttribute('aria-valuenow', '100');

    const fill = screen.getByTestId('free-shipping-progress-fill');
    expect(fill).toHaveStyle({ width: '100%' });

    // El carrusel debe estar plegado (no estar en el DOM)
    expect(screen.queryByTestId('upsell-carousel-section')).not.toBeInTheDocument();
  });

  it('renders progress bar without carousel if upsellProducts is empty but goal is in progress', () => {
    const emptyUpsellPromotion: ShippingPromotionDTO = {
      ...mockPromotionInProgress,
      upsellProducts: [],
    };

    render(
      <FreeShippingUpsellCarousel
        promotion={emptyUpsellPromotion}
        onAddUpsellProduct={vi.fn()}
      />
    );

    expect(screen.getByTestId('free-shipping-goal-missing')).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    expect(screen.queryByTestId('upsell-carousel-section')).not.toBeInTheDocument();
  });

  it('TC-UI-FS-12: carousel track has region role, accessible label and tabindex for mobile and keyboard navigation', () => {
    render(
      <FreeShippingUpsellCarousel
        promotion={mockPromotionInProgress}
        onAddUpsellProduct={vi.fn()}
      />
    );

    const track = screen.getByTestId('upsell-carousel-track');
    expect(track).toHaveAttribute('role', 'region');
    expect(track).toHaveAttribute('aria-label', 'Carrusel de sugerencias para envío gratis');
    expect(track).toHaveAttribute('tabindex', '0');
  });
});
