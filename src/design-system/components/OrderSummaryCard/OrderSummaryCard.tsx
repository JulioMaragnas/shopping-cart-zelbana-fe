import React from 'react';
import styles from './OrderSummaryCard.module.css';

interface OrderSummaryProps {
  subtotal: number;
  itemDiscounts: number;
  timeDiscounts: number;
  total: number;
  onPay: () => void;
  isValidating: boolean;
  isValid: boolean;
}

export function OrderSummaryCard({ subtotal, itemDiscounts, timeDiscounts, total, onPay, isValidating, isValid }: OrderSummaryProps) {
  return (
    <div className={styles.card}>
      <h3 className={styles.title}>Resumen del pedido</h3>
      
      <div className={styles.row}>
        <span>Total de artículos:</span>
        <span>${subtotal}</span>
      </div>
      
      <div className={styles.row}>
        <span>Descuento de artículo(s):</span>
        <span className={styles.discountValue}>-${itemDiscounts}</span>
      </div>
      
      <div className={styles.row}>
        <span>Descuento por tiempo limitado:</span>
        <span className={styles.discountValue}>-${timeDiscounts}</span>
      </div>
      
      <div className={styles.divider} />
      
      <div className={styles.totalRow}>
        <span>Total</span>
        <span className={styles.totalValue}>${total}</span>
      </div>
      
      <button 
        className={styles.payButton} 
        onClick={onPay}
        disabled={!isValid || isValidating}
      >
        {isValidating ? 'Validando...' : 'Pagar'}
      </button>
    </div>
  );
}
