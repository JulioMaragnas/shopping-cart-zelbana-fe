import React from 'react';
import { ProductCard } from './ProductCard';
import type { Product } from '../types';
import styles from './ProductGrid.module.css';

interface ProductGridProps {
  products: Product[];
  isLoading: boolean;
  query: string;
  onAdd: (product: Product) => void;
  onClearFilters?: () => void;
}

export const ProductGrid = ({ products, isLoading, query, onAdd, onClearFilters }: ProductGridProps) => {
  if (isLoading) {
    return (
      <div className={styles.grid} data-testid="catalog-skeleton-grid">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className={styles.skeletonCard} />
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className={styles.emptyState} data-testid="catalog-empty-state">
        <h2 className={styles.emptyTitle}>
          {query ? `Sin resultados para "${query}"` : 'No hay productos disponibles'}
        </h2>
        <p className={styles.emptyDesc}>
          Intenta verificar la ortografía, buscar términos más generales o limpiar los filtros activos.
        </p>
        {onClearFilters && (
          <button
            type="button"
            className={styles.clearFiltersBtn}
            onClick={onClearFilters}
            data-testid="clear-filters-btn"
          >
            ✕ Limpiar filtros
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={styles.grid}>
      {products.map(product => (
        <ProductCard key={product.id} product={product} onAdd={() => onAdd(product)} />
      ))}
    </div>
  );
};
