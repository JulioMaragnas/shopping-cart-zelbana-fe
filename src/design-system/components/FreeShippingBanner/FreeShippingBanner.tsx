import React from 'react';
import { Link } from 'react-router-dom';
import { useStoreSettings } from '../../../features/catalog/api/useStoreSettings';
import { useCartStore } from '../../../features/cart/store/useCartStore';
import styles from './FreeShippingBanner.module.css';

export interface FreeShippingBannerProps {
  className?: string;
}

export function FreeShippingBanner({ className }: FreeShippingBannerProps) {
  const { data: settings } = useStoreSettings();
  const cart = useCartStore((state) => state.cart);

  if (!settings?.freeShippingEnabled) {
    return null;
  }

  const threshold = settings.freeShippingThreshold;
  const currentTotal = cart.reduce((sum, item) => sum + item.priceWhenAdded * item.quantity, 0);
  const isCartEmpty = cart.length === 0;
  const isUnlocked = !isCartEmpty && currentTotal >= threshold;
  const missingAmount = Math.max(0, threshold - currentTotal);
  const percentage = Math.min(100, Math.round((currentTotal / threshold) * 100));

  return (
    <aside
      className={`${styles.banner} ${isUnlocked ? styles.bannerUnlocked : ''} ${className ?? ''}`}
      aria-label="Promoción de Envío Gratis"
      data-testid="free-shipping-banner"
    >
      <div className={styles.content}>
        {isCartEmpty ? (
          <p className={styles.text} data-testid="free-shipping-banner-empty">
            🚚 <span className={styles.highlight}>Envío GRATIS</span> en todos los pedidos superiores a{' '}
            <strong>${threshold.toFixed(2)}</strong>
          </p>
        ) : isUnlocked ? (
          <div className={styles.unlockedRow} data-testid="free-shipping-banner-unlocked">
            <p className={styles.text}>
              🎉 ¡Tienes <span className={styles.highlightUnlocked}>ENVÍO GRATIS</span> desbloqueado en tu carrito!
            </p>
            <Link to="/cart" className={styles.actionLink} data-testid="banner-cart-link">
              Ir a pagar →
            </Link>
          </div>
        ) : (
          <div className={styles.inProgressRow} data-testid="free-shipping-banner-progress">
            <p className={styles.text}>
              🚚 ¡Te faltan <strong>${missingAmount.toFixed(2)}</strong> para tener{' '}
              <span className={styles.highlight}>ENVÍO GRATIS</span>!
            </p>
            <div
              className={styles.miniProgressTrack}
              role="progressbar"
              aria-valuenow={percentage}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`Progreso de envío gratis: ${percentage}%`}
            >
              <div
                className={styles.miniProgressFill}
                style={{ width: `${percentage}%` }}
              />
            </div>
            <Link to="/cart" className={styles.actionLink} data-testid="banner-cart-link">
              Ver carrito →
            </Link>
          </div>
        )}
      </div>
    </aside>
  );
}
