import React from 'react';
import type { MobileStickyPdpBarProps } from './MobileStickyPdpBar.types';
import styles from './MobileStickyPdpBar.module.css';

export function MobileStickyPdpBar({
  name,
  thumbnailUrl,
  salePrice,
  lowStock,
  quantity,
  remainingAvailable,
  isPurchaseDisabled,
  buttonLabel,
  onQuantityChange,
  onAddToCart,
}: MobileStickyPdpBarProps) {
  const currentQty = typeof quantity === 'number' && quantity >= 1 ? quantity : 1;

  const handleDecrease = () => {
    if (isPurchaseDisabled || currentQty <= 1) return;
    onQuantityChange(currentQty - 1);
  };

  const handleIncrease = () => {
    if (isPurchaseDisabled) return;
    const maxSelectable = remainingAvailable > 0 ? remainingAvailable : 1;
    if (currentQty >= maxSelectable) return;
    onQuantityChange(currentQty + 1);
  };

  const isDecreaseDisabled = isPurchaseDisabled || currentQty <= 1;
  const isIncreaseDisabled = isPurchaseDisabled || (remainingAvailable > 0 && currentQty >= remainingAvailable);

  return (
    <aside className={styles.stickyBarContainer} data-testid="mobile-sticky-pdp-bar">
      <div className={styles.leftSection}>
        {thumbnailUrl ? (
          <img
            src={thumbnailUrl}
            alt={name}
            className={styles.thumb}
            data-testid="mobile-sticky-pdp-thumb"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        ) : (
          <div className={styles.thumbPlaceholder} data-testid="mobile-sticky-pdp-thumb">
            Sin foto
          </div>
        )}

        <div className={styles.info}>
          <span className={styles.name} title={name}>
            {name}
          </span>
          <div className={styles.priceRow}>
            <span className={styles.price} data-testid="mobile-sticky-pdp-price">
              ${salePrice.toFixed(2)}
            </span>
            {lowStock && (
              <span
                className={styles.lowStockBadge}
                data-testid="mobile-sticky-pdp-low-stock-badge"
              >
                ¡Pocas unidades!
              </span>
            )}
          </div>
        </div>
      </div>

      <div className={styles.rightSection}>
        <div className={styles.stepper} data-testid="mobile-sticky-pdp-qty-stepper">
          <button
            type="button"
            className={styles.stepperBtn}
            onClick={handleDecrease}
            disabled={isDecreaseDisabled}
            aria-label="Disminuir"
          >
            -
          </button>
          <span className={styles.stepperQty}>{quantity}</span>
          <button
            type="button"
            className={styles.stepperBtn}
            onClick={handleIncrease}
            disabled={isIncreaseDisabled}
            aria-label="Aumentar"
          >
            +
          </button>
        </div>

        <button
          type="button"
          className={styles.addBtn}
          onClick={onAddToCart}
          disabled={isPurchaseDisabled}
          data-testid="mobile-sticky-pdp-add-btn"
        >
          {buttonLabel}
        </button>
      </div>
    </aside>
  );
}
