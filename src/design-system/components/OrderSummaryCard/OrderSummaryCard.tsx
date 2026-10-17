import React from 'react';
import styles from './OrderSummaryCard.module.css';

export interface OrderSummaryProps {
  totalUnits: number;
  total: number;
  onPay: () => void;
  isValidating: boolean;
  isValid: boolean;
}

export function OrderSummaryCard({
  totalUnits,
  total,
  onPay,
  isValidating,
  isValid,
}: OrderSummaryProps) {
  const formattedTotal = `$${total.toFixed(2)}`;

  return (
    <div className={styles.card}>
      <h3 className={styles.title}>Resumen del pedido</h3>

      <div className={styles.row}>
        <span>Productos ({totalUnits} unidades):</span>
        <span>{formattedTotal}</span>
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
