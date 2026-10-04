import React from 'react';
import type { Product } from '../types';
import styles from './ProductCard.module.css';

export const ProductCard = ({ product, onAdd }: { product: Product, onAdd?: () => void }) => {
  const { name, photos, salePrice, originalPrice, disponible, lowStock } = product;

  return (
    <div className={styles.card}>
      <div className={styles.imageContainer}>
        <img src={photos[0]} alt={name} className={styles.image} />
        {!disponible && <div className={styles.overlay}>Agotado</div>}
      </div>
      
      <div className={styles.info}>
        <h3 className={styles.title}>{name}</h3>
        
        <div className={styles.priceContainer}>
          <span className={styles.salePrice}>${salePrice.toFixed(2)}</span>
          {originalPrice > salePrice && (
            <span className={styles.originalPrice}>${originalPrice.toFixed(2)}</span>
          )}
        </div>
        
        {lowStock && (
          <span className={styles.lowStockBadge}>¡Pocas unidades disponibles!</span>
        )}

        <button 
          className={`${styles.addToCart} ${!disponible ? styles.disabledBtn : ''}`}
          disabled={!disponible}
          onClick={onAdd}
        >
          {disponible ? 'Agregar al Carrito' : 'Agotado'}
        </button>
      </div>
    </div>
  );
};
