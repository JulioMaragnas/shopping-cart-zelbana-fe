import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ProductCard } from './ProductCard';
import { useCartStore } from '../../cart/store/useCartStore';
import type { Product } from '../types';

const mockProduct: Product = {
  id: '1',
  name: 'Jabón Cacao',
  description: 'Jabón artesanal',
  thumbnailUrl: '/products/prod-1-thumb.webp?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Signature=abc',
  photos: [],
  salePrice: 15.5,
  discountPercentage: 20,
  categoryId: 'cat-3',
  categoryName: 'Jabones Artesanales',
  disponible: true,
  lowStock: false,
  maxOrderQuantity: 5,
};

const renderCard = (product: Product, onAdd?: () => void) => {
  return render(
    <MemoryRouter>
      <ProductCard product={product} onAdd={onAdd} />
    </MemoryRouter>
  );
};

describe('ProductCard Component (Fases 2.2, 2.3, 2.4)', () => {
  beforeEach(() => {
    useCartStore.getState().clearCart();
  });

  it('TC-PLP-2.2.2: renders thumbnailUrl with lazy loading', () => {
    renderCard(mockProduct);
    const img = screen.getByRole('img', { name: 'Jabón Cacao' });
    expect(img).toHaveAttribute('src', mockProduct.thumbnailUrl);
    expect(img).toHaveAttribute('loading', 'lazy');
  });

  it('TC-PLP-2.2.3: renders fallback placeholder when thumbnailUrl is null or empty', () => {
    renderCard({ ...mockProduct, thumbnailUrl: null });
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(screen.getByText('Sin imagen')).toBeInTheDocument();
  });

  it('TC-PLP-2.2.4: switches to fallback placeholder when image fails to load (onError)', () => {
    renderCard(mockProduct);
    const img = screen.getByRole('img', { name: 'Jabón Cacao' });
    fireEvent.error(img);

    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(screen.getByText('Sin imagen')).toBeInTheDocument();
  });

  it('TC-PLP-2.3.2: displays salePrice and -X% OFF badge when discountPercentage > 0 without strikethrough price', () => {
    renderCard(mockProduct);
    expect(screen.getByText('$15.50')).toBeInTheDocument();
    expect(screen.getByText('-20% OFF')).toBeInTheDocument();
  });

  it('TC-PLP-2.3.3: does not render -X% OFF badge when discountPercentage is 0', () => {
    renderCard({ ...mockProduct, discountPercentage: 0 });
    expect(screen.getByText('$15.50')).toBeInTheDocument();
    expect(screen.queryByText(/% OFF/i)).not.toBeInTheDocument();
  });

  it('shows low stock warning badge if lowStock is true', () => {
    renderCard({ ...mockProduct, lowStock: true });
    expect(screen.getByText('¡Pocas unidades disponibles!')).toBeInTheDocument();
  });

  it('TC-PLP-2.4.2: shows temporary confirmation feedback on click and displays quantity in cart indicator', () => {
    const onAddMock = vi.fn(() => {
      useCartStore.getState().addItem({
        id: mockProduct.id,
        name: mockProduct.name,
        thumbnailUrl: mockProduct.thumbnailUrl,
        priceWhenAdded: mockProduct.salePrice,
        quantity: 1,
      });
    });

    renderCard(mockProduct, onAddMock);
    const button = screen.getByRole('button', { name: /Agregar al Carrito/i });
    fireEvent.click(button);

    expect(onAddMock).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button', { name: /¡Agregado!/i })).toBeInTheDocument();
    expect(screen.getByText(/En tu carrito: 1/i)).toBeInTheDocument();
  });

  it('TC-PLP-2.4.3: disables button with "Máximo en carrito" when quantityInCart >= maxOrderQuantity', () => {
    useCartStore.getState().addItem({
      id: mockProduct.id,
      name: mockProduct.name,
      thumbnailUrl: mockProduct.thumbnailUrl,
      priceWhenAdded: mockProduct.salePrice,
      quantity: 2,
    });

    renderCard({ ...mockProduct, maxOrderQuantity: 2 });

    const button = screen.getByRole('button', { name: /Máximo en carrito/i });
    expect(button).toBeDisabled();
    expect(screen.getByText(/Has alcanzado el límite disponible/i)).toBeInTheDocument();
  });

  it('TC-PLP-2.4.4: disables Add to Cart button and shows "Agotado" when disponible is false', () => {
    renderCard({ ...mockProduct, disponible: false, maxOrderQuantity: 0 });
    const button = screen.getByRole('button', { name: /Agotado/i });
    expect(button).toBeDisabled();
  });
});
