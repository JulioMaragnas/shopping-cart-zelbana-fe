import React from 'react';
import { ProductCard } from './ProductCard';
import type { Product } from '../types';
import styles from './ProductGrid.module.css';

interface ProductGridProps {
  products: Product[];
  isLoading: boolean;
  query: string;
  onAdd: (product: Product) => void;
}

export const ProductGrid = ({ products, isLoading, query, onAdd }: ProductGridProps) => {
  if (isLoading) {
    return (
      <div className={styles.grid}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className={styles.skeletonCard} />
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className={styles.emptyState}>
        <h2 className={styles.emptyTitle}>Sin resultados para "{query}"</h2>
        <p className={styles.emptyDesc}>
          Intenta verificar la ortografía o usar palabras más generales.
        </p>
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
