import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import styles from './CartItemRow.module.css';

export interface CartItemProps {
  item: {
    id: string;
    name: string;
    thumbnailUrl?: string | null;
    priceWhenAdded: number;
    quantity: number;
  };
  currentPrice: number;
  discountPercentage?: number;
  availableStock?: number;
  disponible: boolean;
  isDeleted?: boolean;
  validationMessage?: string;
  onRemove: (id: string) => void;
  onChangeQuantity: (id: string, qty: number) => void;
}

export function CartItemRow({
  item,
  currentPrice,
  discountPercentage = 0,
  availableStock,
  disponible,
  isDeleted = false,
  validationMessage,
  onRemove,
  onChangeQuantity,
}: CartItemProps) {
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [item.thumbnailUrl]);

  const priceDropped = !isDeleted && currentPrice > 0 && currentPrice < item.priceWhenAdded;
  const priceIncreased = !isDeleted && currentPrice > item.priceWhenAdded;
  const dropAmount = (item.priceWhenAdded - currentPrice).toFixed(2);
  const lineSubtotal = (currentPrice * item.quantity).toFixed(2);

  const maxStock =
    typeof availableStock === 'number'
      ? Math.max(0, availableStock)
      : Math.max(item.quantity, 10);

  const isSelectDisabled = !disponible || maxStock === 0 || isDeleted;
  const optionCount = maxStock > 0 ? maxStock : 1;
  const quantityOptions = Array.from({ length: optionCount }, (_, idx) => idx + 1);
  const hasExcessQuantity = item.quantity > optionCount;

  const availabilityLabel = isDeleted
    ? 'No disponible'
    : disponible
    ? 'Disponible'
    : 'Agotado';

  return (
    <div className={styles.row}>
      <div className={styles.imageContainer}>
        {item.thumbnailUrl && !imgError ? (
          <img
            src={item.thumbnailUrl}
            alt={item.name}
            className={styles.thumbImg}
            loading="lazy"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className={styles.placeholderImage}>Sin imagen</div>
        )}
      </div>

      <div className={styles.details}>
        <h4 className={styles.title}>
          {isDeleted ? (
            <span>{item.name}</span>
          ) : (
            <Link to={`/products/${item.id}`} className={styles.titleLink}>
              {item.name}
            </Link>
          )}
        </h4>
        <span className={styles.availability}>{availabilityLabel}</span>
        {validationMessage && validationMessage !== 'Stock disponible' && (
          <span className={styles.validationMessage}>⚠️ {validationMessage}</span>
        )}
      </div>

      <div className={styles.priceBlock}>
        {priceDropped && (
          <span className={styles.priceAlert}>
            Bajó ${dropAmount} desde que lo agregaste
          </span>
        )}
        {priceIncreased && (
          <span className={styles.priceAlert}>
            El precio se actualizó a ${currentPrice.toFixed(2)}
          </span>
        )}
        <div className={styles.unitPriceRow}>
          <span className={styles.unitPrice}>${currentPrice.toFixed(2)} c/u</span>
          {discountPercentage > 0 && (
            <span className={styles.discountBadge}>-{discountPercentage}% OFF</span>
          )}
        </div>
        <span className={styles.currentPrice}>${lineSubtotal}</span>
      </div>

      <div className={styles.actions}>
        <button
          type="button"
          className={styles.trashBtn}
          onClick={() => onRemove(item.id)}
          aria-label="Eliminar"
        >
          🗑
        </button>
        <select
          className={styles.quantitySelect}
          value={item.quantity}
          disabled={isSelectDisabled}
          onChange={(e) => onChangeQuantity(item.id, Number(e.target.value))}
          aria-label="Seleccionar cantidad"
        >
          {quantityOptions.map((n) => (
            <option key={n} value={n}>
              Cant. {n}
            </option>
          ))}
          {hasExcessQuantity && (
            <option value={item.quantity} disabled>
              Cant. {item.quantity} (Sin stock)
            </option>
          )}
        </select>
      </div>
    </div>
  );
}
