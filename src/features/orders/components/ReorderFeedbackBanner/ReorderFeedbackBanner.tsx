import React from 'react';
import type { ReorderFeedback } from '../../types/orders.types';
import styles from './ReorderFeedbackBanner.module.css';

interface ReorderFeedbackBannerProps {
  feedback: ReorderFeedback | null;
  onViewCart?: () => void;
}

export const ReorderFeedbackBanner: React.FC<ReorderFeedbackBannerProps> = ({
  feedback,
  onViewCart,
}) => {
  if (!feedback) return null;

  const styleClass =
    feedback.type === 'success'
      ? styles.success
      : feedback.type === 'partial'
      ? styles.partial
      : styles.error;

  const canViewCart = (feedback.type === 'success' || feedback.type === 'partial') && Boolean(onViewCart);

  return (
    <aside
      className={`${styles.banner} ${styleClass}`}
      role="alert"
      aria-live="polite"
      data-testid="reorder-feedback-banner"
    >
      <div className={styles.messageContent}>
        <span>{feedback.message}</span>
      </div>

      {canViewCart && (
        <button
          type="button"
          className={styles.viewCartBtn}
          onClick={onViewCart}
          data-testid="reorder-banner-view-cart-link"
        >
          Ver Carrito →
        </button>
      )}
    </aside>
  );
};
