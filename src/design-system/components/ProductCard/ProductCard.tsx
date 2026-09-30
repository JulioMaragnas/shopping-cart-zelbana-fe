import React from 'react';
import styles from './ProductCard.module.css';

interface Product {
  id: string;
  name: string;
  description: string;
  salePrice: number;
  disponible: boolean;
}

interface ProductCardProps {
  product: Product;
  onAdd: () => void;
}

export function ProductCard({ product, onAdd }: ProductCardProps) {
  return (
    <div className={styles.card}>
      <div className={styles.imagePlaceholder}>imagen producto</div>
      <h3 className={styles.title}>{product.name}</h3>
      <p className={styles.description}>{product.description}</p>
      <span className={styles.price}>${product.salePrice}</span>
      
      <div className={styles.footer}>
        <span className={styles.quantity}>cant: 1</span>
        <button 
          className={styles.addButton} 
          onClick={onAdd}
          disabled={!product.disponible}
        >
          {product.disponible ? 'add' : 'Agotado'}
        </button>
      </div>
    </div>
  );
}
