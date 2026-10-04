import React from 'react';
import { Link } from 'react-router-dom';
import type { Product } from '../types';
import styles from './ProductCard.module.css';

export const ProductCard = ({ product, onAdd }: { product: Product; onAdd?: () => void }) => {
  const { id, name, photos, salePrice, originalPrice, disponible, lowStock } = product;

  return (
    <div className={styles.card}>
      <Link to={`/products/${id}`} className={styles.cardLink} aria-label={`Ver detalle de ${name}`}>
        <div className={styles.imageContainer}>
          <img src={photos[0]} alt={name} className={styles.image} />
          {!disponible && <div className={styles.overlay}>Agotado</div>}
        </div>
      </Link>
      
      <div className={styles.info}>
        <Link to={`/products/${id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
          <h3 className={styles.title}>{name}</h3>
        </Link>
        
        <div className={styles.priceContainer}>
          <span className={styles.salePrice}>${salePrice.toFixed(2)}</span>
          {originalPrice > salePrice && (
            <span className={styles.originalPrice} style={{ textDecoration: 'line-through' }}>
              ${originalPrice.toFixed(2)}
            </span>
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
