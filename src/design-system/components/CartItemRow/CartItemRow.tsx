import React from 'react';
import styles from './CartItemRow.module.css';

export interface CartItemProps {
  item: {
    id: string;
    name: string;
    priceWhenAdded: number;
    quantity: number;
  };
  currentPrice: number;
  disponible: boolean;
  validationMessage?: string;
  onRemove: (id: string) => void;
  onChangeQuantity: (id: string, qty: number) => void;
}

export function CartItemRow({ item, currentPrice, disponible, validationMessage, onRemove, onChangeQuantity }: CartItemProps) {
  // Mock logic to show discounts if currentPrice < priceWhenAdded
  const priceDropped = currentPrice < item.priceWhenAdded;
  const dropAmount = item.priceWhenAdded - currentPrice;
  const originalPriceFake = Math.round(currentPrice * 1.3); // Fake 30% discount for UI
  const discountPercent = Math.round(((originalPriceFake - currentPrice) / originalPriceFake) * 100);

  return (
    <div className={styles.row}>
      <input
        type="checkbox"
        className={styles.checkbox}
        defaultChecked
        aria-label="Seleccionar producto"
      />
      <div className={styles.image}>img</div>
      
      <div className={styles.details}>
        <h4 className={styles.title}>{item.name}</h4>
        <span className={styles.availability}>
          {disponible ? 'Disponible' : 'Agotado'}
        </span>
        {validationMessage && validationMessage !== 'Stock disponible' && (
          <span className={styles.validationMessage}>
            ⚠️ {validationMessage}
          </span>
        )}
      </div>

      <div className={styles.priceBlock}>
        {priceDropped && (
          <span className={styles.priceAlert}>-${dropAmount} que cuando se agregó</span>
        )}
        <div className={styles.oldPriceRow}>
          <span className={styles.crossedOut}>${originalPriceFake}</span>
          <span className={styles.discountBadge}>-{discountPercent}%</span>
        </div>
        <span className={styles.currentPrice}>${currentPrice}</span>
      </div>

      <div className={styles.actions}>
        <button 
          className={styles.trashBtn} 
          onClick={() => onRemove(item.id)}
          aria-label="Eliminar"
        >
          🗑
        </button>
        <select 
          className={styles.quantitySelect} 
          value={item.quantity} 
          onChange={(e) => onChangeQuantity(item.id, Number(e.target.value))}
          aria-label="Seleccionar cantidad"
        >
          {[1,2,3,4,5,6].map(n => (
            <option key={n} value={n}>Cant. {n}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
