import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import type { Product } from '../types';
import { useCartStore } from '../../cart/store/useCartStore';
import styles from './ProductCard.module.css';

export const ProductCard = ({ product, onAdd }: { product: Product; onAdd?: () => void }) => {
  const {
    id,
    name,
    thumbnailUrl,
    photos,
    salePrice,
    discountPercentage = 0,
    disponible,
    lowStock,
    maxOrderQuantity = 1,
  } = product;

  const cart = useCartStore((state) => state.cart);
  const quantityInCart = cart.find((item) => item.id === id)?.quantity ?? 0;

  const resolvedThumbnail = thumbnailUrl ?? (photos && photos.length > 0 ? photos[0] : null);
  const [hasImageError, setHasImageError] = useState(false);
  const [justAdded, setJustAdded] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setHasImageError(false);
  }, [resolvedThumbnail]);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  const isAvailable = disponible && maxOrderQuantity > 0;
  const isLimitReached = isAvailable && quantityInCart >= maxOrderQuantity;
  const isButtonDisabled = !isAvailable || isLimitReached;

  const handleAddClick = () => {
    if (isButtonDisabled) return;
    if (onAdd) {
      onAdd();
    }
    setJustAdded(true);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    timerRef.current = setTimeout(() => {
      setJustAdded(false);
    }, 1500);
  };

  let buttonText = 'Agregar al Carrito';
  if (!isAvailable) {
    buttonText = 'Agotado';
  } else if (justAdded) {
    buttonText = '✓ ¡Agregado!';
  } else if (isLimitReached) {
    buttonText = 'Máximo en carrito';
  }

  return (
    <div className={styles.card}>
      <Link to={`/products/${id}`} className={styles.cardLink} aria-label={`Ver detalle de ${name}`}>
        <div className={styles.imageContainer}>
          {resolvedThumbnail && !hasImageError ? (
            <img
              src={resolvedThumbnail}
              alt={name}
              loading="lazy"
              onError={() => setHasImageError(true)}
              className={styles.image}
            />
          ) : (
            <div className={styles.placeholderImage}>Sin imagen</div>
          )}
          {!isAvailable && <div className={styles.overlay}>Agotado</div>}
        </div>
      </Link>

      <div className={styles.info}>
        <Link to={`/products/${id}`} className={styles.titleLink}>
          <h3 className={styles.title}>{name}</h3>
        </Link>

        <div className={styles.priceContainer}>
          <span className={styles.salePrice}>${salePrice.toFixed(2)}</span>
          {discountPercentage > 0 && (
            <span className={styles.discountBadge}>-{discountPercentage}% OFF</span>
          )}
        </div>

        {lowStock && isAvailable && (
          <span className={styles.lowStockBadge}>¡Pocas unidades disponibles!</span>
        )}

        {quantityInCart > 0 && (
          <span className={styles.cartStatusNote} role="status" aria-live="polite">
            En tu carrito: {quantityInCart}
          </span>
        )}

        {isLimitReached && (
          <span className={styles.limitReachedNote} role="alert">
            Has alcanzado el límite disponible
          </span>
        )}

        <button
          type="button"
          className={`${styles.addToCart} ${justAdded ? styles.addedBtn : ''} ${
            isButtonDisabled && !justAdded ? styles.disabledBtn : ''
          }`}
          disabled={isButtonDisabled}
          onClick={handleAddClick}
        >
          {buttonText}
        </button>
      </div>
    </div>
  );
};
