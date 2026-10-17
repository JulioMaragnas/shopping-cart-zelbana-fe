import React from 'react';
import styles from './OrderSummaryCard.module.css';

export interface OrderSummaryProps {
  totalUnits: number;
  total: number;
  onPay: () => void;
  isValidating: boolean;
  isValid: boolean;
  /** Indica si la orden o carrito califica para envío gratis */
  isFreeShippingUnlocked?: boolean;
  /** Monto restante en caso de no alcanzar aún la meta */
  missingAmountForFreeShipping?: number;
}

export function OrderSummaryCard({
  totalUnits,
  total,
  onPay,
  isValidating,
  isValid,
  isFreeShippingUnlocked,
  missingAmountForFreeShipping,
}: OrderSummaryProps) {
  const formattedTotal = `$${total.toFixed(2)}`;

  return (
    <div className={styles.card}>
      <h3 className={styles.title}>Resumen del pedido</h3>

      <div className={styles.row}>
        <span>Productos ({totalUnits} unidades):</span>
        <span>{formattedTotal}</span>
      </div>

      <div className={styles.row} data-testid="summary-shipping-row">
        <span>Envío estimado:</span>
        {isFreeShippingUnlocked ? (
          <span className={styles.freeShippingBadge} data-testid="summary-shipping-free">
            GRATIS ($0.00) 🎉
          </span>
        ) : typeof missingAmountForFreeShipping === 'number' && missingAmountForFreeShipping > 0 ? (
          <span className={styles.pendingShippingText} data-testid="summary-shipping-pending">
            Por calcular <small>(Faltan ${missingAmountForFreeShipping.toFixed(2)})</small>
          </span>
        ) : (
          <span className={styles.pendingShippingText}>Por calcular</span>
        )}
      </div>

      <div className={styles.divider} />

      <div className={styles.totalRow}>
        <span>Total</span>
        <span className={styles.totalValue}>{formattedTotal}</span>
      </div>

      <button
        type="button"
        className={styles.payButton}
        onClick={onPay}
        disabled={!isValid || isValidating}
      >
        {isValidating ? 'Validando...' : 'Pagar'}
      </button>
    </div>
  );
}
