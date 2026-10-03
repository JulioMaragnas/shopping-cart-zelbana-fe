import { render, screen } from '@testing-library/react';
import { ProductCard } from './ProductCard';
import type { Product } from '../types';
import { describe, it, expect } from 'vitest';
import React from 'react';

const mockProduct: Product = {
  id: '1',
  name: 'Jabón Cacao',
  description: 'Jabón artesanal',
  photos: ['https://via.placeholder.com/150'],
  salePrice: 15.50,
  originalPrice: 20.00,
  disponible: true,
  lowStock: false,
};

describe('ProductCard Component', () => {
  it('renders normal product data', () => {
    render(<ProductCard product={mockProduct} />);
    expect(screen.getByText('Jabón Cacao')).toBeInTheDocument();
    expect(screen.getByText('$15.50')).toBeInTheDocument();
  });

  it('renders original price strikethrough if originalPrice > salePrice', () => {
    render(<ProductCard product={mockProduct} />);
    const originalPrice = screen.getByText('$20.00');
    expect(originalPrice).toBeInTheDocument();
    expect(originalPrice).toHaveStyle('text-decoration: line-through');
  });

  it('does not render original price if originalPrice is equal or lower than salePrice', () => {
    render(<ProductCard product={{ ...mockProduct, originalPrice: 15.50 }} />);
    // Debería mostrar el de venta, pero no el viejo tachado.
    const prices = screen.getAllByText('$15.50');
    expect(prices).toHaveLength(1);
  });

  it('shows low stock warning badge if lowStock is true', () => {
    render(<ProductCard product={{ ...mockProduct, lowStock: true }} />);
    expect(screen.getByText('¡Pocas unidades disponibles!')).toBeInTheDocument();
  });

  it('disables Add to Cart button and changes text to "Agotado" if disponible is false', () => {
    render(<ProductCard product={{ ...mockProduct, disponible: false }} />);
    const button = screen.getByRole('button', { name: /agotado/i });
    expect(button).toBeDisabled();
  });
});
