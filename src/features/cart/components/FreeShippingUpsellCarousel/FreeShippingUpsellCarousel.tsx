import React from 'react';
import type { FreeShippingUpsellCarouselProps } from './FreeShippingUpsellCarousel.types';
import styles from './FreeShippingUpsellCarousel.module.css';

export function FreeShippingUpsellCarousel({
  promotion,
  onAddUpsellProduct,
  isAddingId,
}: FreeShippingUpsellCarouselProps) {
  const {
    enabled,
    threshold,
    currentAmount,
    missingAmount,
    percentage,
    isFreeShippingUnlocked,
    upsellProducts = [],
  } = promotion;

  if (!enabled) {
    return null;
  }

  return (
    <section
      className={`${styles.container} ${isFreeShippingUnlocked ? styles.containerUnlocked : ''}`}
      aria-label="Progreso de envío gratis y productos recomendados"
      data-testid="free-shipping-upsell-container"
    >
      {/* 1. Header con Alerta de Progreso */}
      <div className={styles.header}>
        {isFreeShippingUnlocked ? (
          <div
            className={styles.unlockedNotice}
            role="status"
            data-testid="free-shipping-goal-unlocked"
          >
            <span className={styles.celebrationIcon} aria-hidden="true">
              🎉
            </span>
            <span className={styles.unlockedText}>
              ¡Felicidades! Desbloqueaste <strong>ENVÍO GRATIS</strong> en tu pedido
            </span>
          </div>
        ) : (
          <div
            className={styles.missingNotice}
            role="status"
            data-testid="free-shipping-goal-missing"
          >
            <span className={styles.truckIcon} aria-hidden="true">
              🚚
            </span>
            <span className={styles.missingText}>
              ¡Te faltan <strong>${missingAmount.toFixed(2)}</strong> para tener{' '}
              <strong>ENVÍO GRATIS</strong>!
            </span>
            <span className={styles.thresholdMeta}>
              (Meta: ${threshold.toFixed(2)})
            </span>
          </div>
        )}

        {/* 2. Barra de Progreso Semántica */}
        <div
          className={styles.progressTrack}
          role="progressbar"
          aria-valuenow={percentage}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Progreso hacia envío gratis: ${percentage}%`}
          data-testid="free-shipping-progressbar"
        >
          <div
            className={`${styles.progressFill} ${
              isFreeShippingUnlocked ? styles.progressFillUnlocked : ''
            }`}
            style={{ width: `${percentage}%` }}
            data-testid="free-shipping-progress-fill"
          />
        </div>

        <div className={styles.progressMetaRow}>
          <span className={styles.currentAmountText}>
            ${currentAmount.toFixed(2)} alcanzados
          </span>
          <span
            className={styles.percentageText}
            data-testid="free-shipping-percentage-text"
          >
            {percentage}%
          </span>
        </div>
      </div>

      {/* 3. Carrusel Compacto CRO (Solo visible si la meta no ha sido alcanzada y hay productos) */}
      {!isFreeShippingUnlocked && upsellProducts.length > 0 && (
        <div className={styles.carouselSection} data-testid="upsell-carousel-section">
          <div className={styles.carouselHeader}>
            <h3 className={styles.carouselTitle}>
              ✨ Completa tu Envío Gratis en 1 clic
            </h3>
            <p className={styles.carouselSubtitle}>
              Añade una de estas formulaciones recomendadas en stock para no pagar envío
            </p>
          </div>

          <div
            className={styles.carouselTrack}
            role="region"
            aria-label="Carrusel de sugerencias para envío gratis"
            tabIndex={0}
            data-testid="upsell-carousel-track"
          >
            {upsellProducts.map((item) => {
              const isCurrentlyAdding = isAddingId === item.id;
              return (
                <article
                  key={item.id}
                  className={styles.miniCard}
                  data-testid={`upsell-card-${item.id}`}
                >
                  <div className={styles.badgeRow}>
                    {item.coversMissingAmount ? (
                      <span
                        className={styles.badgeFreeShipping}
                        data-testid={`upsell-badge-covers-${item.id}`}
                      >
                        ✨ ¡Te da Envío Gratis!
                      </span>
                    ) : item.discountPercentage > 0 ? (
                      <span
                        className={styles.badgeDiscount}
                        data-testid={`upsell-badge-discount-${item.id}`}
                      >
                        -{item.discountPercentage}% OFF
                      </span>
                    ) : null}
                  </div>

                  <div className={styles.thumbWrapper}>
                    {item.thumbnailUrl ? (
                      <img
                        src={item.thumbnailUrl}
                        alt={item.name}
                        className={styles.thumbImg}
                        loading="lazy"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className={styles.thumbPlaceholder} aria-hidden="true">
                        Sin foto
                      </div>
                    )}
                  </div>

                  <div className={styles.cardInfo}>
                    <h4 className={styles.productName} title={item.name}>
                      {item.name}
                    </h4>
                    <span className={styles.productPrice}>
                      ${item.salePrice.toFixed(2)}
                    </span>
                  </div>

                  <button
                    type="button"
                    className={styles.addBtn}
                    onClick={() => onAddUpsellProduct(item)}
                    disabled={isCurrentlyAdding || !item.disponible}
                    aria-label={`Agregar ${item.name} al carrito`}
                    data-testid={`upsell-add-btn-${item.id}`}
                  >
                    {isCurrentlyAdding ? 'Agregando...' : '+ Agregar'}
                  </button>
                </article>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
