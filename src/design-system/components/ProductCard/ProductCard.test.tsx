import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ProductCard } from './ProductCard';

describe('ProductCard Component', () => {
  const mockProduct = {
    id: '1',
    name: 'Producto de prueba',
    description: 'Descripción breve',
    salePrice: 15000,
    disponible: true,
  };

  it('renders correctly with product data', () => {
    render(<ProductCard product={mockProduct} onAdd={() => {}} />);
    expect(screen.getByText('Producto de prueba')).toBeInTheDocument();
    expect(screen.getByText('Descripción breve')).toBeInTheDocument();
    expect(screen.getByText('$15000')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /add/i })).toBeInTheDocument();
  });

  it('calls onAdd when the button is clicked', () => {
    const onAddMock = vi.fn();
    render(<ProductCard product={mockProduct} onAdd={onAddMock} />);
    
    const addButton = screen.getByRole('button', { name: /add/i });
    fireEvent.click(addButton);
    
    expect(onAddMock).toHaveBeenCalledTimes(1);
  });

  it('disables the add button if the product is not available', () => {
    render(<ProductCard product={{ ...mockProduct, disponible: false }} onAdd={() => {}} />);
    const addButton = screen.getByRole('button', { name: /agotado/i });
    expect(addButton).toBeDisabled();
  });
});
