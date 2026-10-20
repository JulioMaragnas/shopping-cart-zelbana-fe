import React, { useState, useEffect } from 'react';
import styles from './WelcomeModal.module.css';

export interface WelcomeModalProps {
  onDismiss?: () => void;
  onExplore?: () => void;
}

export const WelcomeModal: React.FC<WelcomeModalProps> = ({
  onDismiss,
  onExplore,
}) => {
  const [isVisible, setIsVisible] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('zelbana-welcome-dismissed') !== 'true';
  });

  useEffect(() => {
    if (!isVisible) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose('dismiss');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isVisible]);

  const handleClose = (action: 'dismiss' | 'explore') => {
    try {
      localStorage.setItem('zelbana-welcome-dismissed', 'true');
    } catch {
      // Ignore storage errors in restricted contexts
    }

    setIsVisible(false);

    if (action === 'explore') {
      onExplore?.();
    } else {
      onDismiss?.();
    }
  };

  if (!isVisible) return null;

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      handleClose('dismiss');
    }
  };

  return (
    <div
      className={styles.backdrop}
      onClick={handleBackdropClick}
      data-testid="welcome-modal-backdrop"
    >
      <div
        className={styles.modalContent}
        role="dialog"
        aria-modal="true"
        aria-labelledby="welcome-modal-title"
        data-testid="welcome-modal"
      >
        <header className={styles.header}>
          <span className={styles.brandBadge}>Bienvenida a Zelbana</span>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={() => handleClose('dismiss')}
            aria-label="Cerrar bienvenida"
            data-testid="welcome-modal-close-btn"
          >
            ✕
          </button>
        </header>

        <div>
          <h2 id="welcome-modal-title" className={styles.title}>
            Descubre el poder de la cosmética botánica natural
          </h2>
          <p className={styles.subtitle}>
            Fórmulas limpias con extractos vegetales certificados para el cuidado integral de tu piel.
          </p>
        </div>

        <div className={styles.benefitsList}>
          <div className={styles.benefitItem}>
            <span className={styles.benefitCheck} aria-hidden="true">✓</span>
            <span>100% extractos vegetales y fórmulas limpias certificadas.</span>
          </div>

          <div className={styles.benefitItem}>
            <span className={styles.benefitCheck} aria-hidden="true">✓</span>
            <span>
              <strong>Envío GRATIS garantizado</strong> en compras mayores a $50.00.
            </span>
          </div>

          <div className={styles.benefitItem}>
            <span className={styles.benefitCheck} aria-hidden="true">✓</span>
            <span>Despacho ágil en 24 a 48 horas en empaque biodegradable.</span>
          </div>
        </div>

        <div className={styles.actions}>
          <button
            type="button"
            className={styles.primaryCta}
            onClick={() => handleClose('explore')}
            data-testid="welcome-modal-cta-btn"
          >
            Explorar Catálogo →
          </button>

          <button
            type="button"
            className={styles.secondaryLink}
            onClick={() => handleClose('dismiss')}
          >
            Ya conozco la tienda (No volver a mostrar)
          </button>
        </div>
      </div>
    </div>
  );
};
