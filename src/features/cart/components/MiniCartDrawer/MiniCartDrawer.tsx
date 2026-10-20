import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useCartStore } from '../../store/useCartStore';
import { useCartValidate } from '../../api/useCartValidate';
import { useStoreSettings } from '../../../catalog/api/useStoreSettings';
import type { MiniCartDrawerProps } from './MiniCartDrawer.types';
import type { CartItem } from '../../store/useCartStore';
import type { UpsellProductDTO } from '../../types';
import styles from './MiniCartDrawer.module.css';

export function MiniCartDrawer({ className }: MiniCartDrawerProps) {
  const location = useLocation();
  const navigate = useNavigate();

  const cart = useCartStore((state) => state.cart);
  const isDrawerOpen = useCartStore((state) => state.isDrawerOpen);
  const closeDrawer = useCartStore((state) => state.closeDrawer);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const removeItem = useCartStore((state) => state.removeItem);
  const addItem = useCartStore((state) => state.addItem);

  const { data: storeSettings } = useStoreSettings();
  const {
    data: validationData,
    isFetching,
    isError,
    refetch,
  } = useCartValidate();

  // 1. Auto-close when navigating to /cart or /checkout/*
  useEffect(() => {
    if (isDrawerOpen && (location.pathname === '/cart' || location.pathname.startsWith('/checkout'))) {
      closeDrawer();
    }
  }, [location.pathname, isDrawerOpen, closeDrawer]);

  // 2. Lock body scroll and handle Escape key
  useEffect(() => {
    if (!isDrawerOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeDrawer();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isDrawerOpen, closeDrawer]);

  if (!isDrawerOpen) {
    return null;
  }

  // Calculations
  const fallbackTotal = cart.reduce((sum, item) => sum + item.priceWhenAdded * item.quantity, 0);
  const total = validationData ? validationData.totalAmount : fallbackTotal;
  const totalUnits = validationData
    ? validationData.items.reduce((sum, item) => sum + item.quantityFulfilled, 0)
    : cart.reduce((sum, item) => sum + item.quantity, 0);

  const isValid = cart.length > 0 && Boolean(validationData?.isValid);
  const hasInvalidItems = Boolean(validationData && !validationData.isValid && cart.length > 0);

  // Free shipping promotion calculations
  const freeShippingEnabled =
    storeSettings?.freeShippingEnabled !== false &&
    (validationData?.shippingPromotion ? validationData.shippingPromotion.enabled : storeSettings?.freeShippingEnabled ?? true);
  const threshold = storeSettings?.freeShippingThreshold ?? 50.0;
  const shippingPromotion = validationData?.shippingPromotion;

  const currentShippingAmount = shippingPromotion ? shippingPromotion.currentAmount : total;
  const missingShippingAmount = shippingPromotion
    ? shippingPromotion.missingAmount
    : Math.max(0, threshold - currentShippingAmount);
  const shippingPercentage = shippingPromotion
    ? shippingPromotion.percentage
    : Math.min(100, Math.round((currentShippingAmount / threshold) * 100));
  const isFreeShippingUnlocked = shippingPromotion
    ? shippingPromotion.isFreeShippingUnlocked
    : currentShippingAmount >= threshold;

  const handleAdjustCart = () => {
    if (!validationData) return;

    cart.forEach((item) => {
      const vItem = validationData.items.find((v) => v.productId === item.id);
      const isDeletedItem =
        !vItem ||
        vItem.name === 'Producto eliminado' ||
        vItem.message.toLowerCase().includes('no existe');

      if (isDeletedItem || vItem.quantityFulfilled === 0) {
        removeItem(item.id);
      } else if (vItem.quantityFulfilled < item.quantity) {
        updateQuantity(item.id, vItem.quantityFulfilled);
      }
    });
  };

  const handleDecrease = (item: CartItem) => {
    if (item.quantity > 1) {
      updateQuantity(item.id, item.quantity - 1);
    } else {
      removeItem(item.id);
    }
  };

  const handleIncrease = (item: CartItem, maxStock?: number) => {
    if (maxStock !== undefined && item.quantity >= maxStock) {
      return;
    }
    updateQuantity(item.id, item.quantity + 1);
  };

  const handleAddUpsell = (product: UpsellProductDTO) => {
    addItem({
      id: product.id,
      name: product.name,
      thumbnailUrl: product.thumbnailUrl,
      priceWhenAdded: product.salePrice,
      quantity: 1,
    });
  };

  const handleCheckout = () => {
    closeDrawer();
    navigate('/cart');
  };

  const handleViewFullCart = () => {
    closeDrawer();
    navigate('/cart');
  };

  return (
    <>
      <div
        className={styles.backdrop}
        data-testid="mini-cart-backdrop"
        onClick={closeDrawer}
        aria-hidden="true"
      />

      <aside
        className={`${styles.drawer} ${className ?? ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="mini-cart-title"
        data-testid="mini-cart-drawer"
      >
        {/* Header */}
        <div className={styles.header}>
          <h2 id="mini-cart-title" className={styles.title} data-testid="mini-cart-title">
            Tu Carrito ({totalUnits})
          </h2>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={closeDrawer}
            aria-label="Cerrar carrito"
            data-testid="mini-cart-close-btn"
          >
            ✕
          </button>
        </div>

        {/* Free Shipping Progress (Épica 09) */}
        {freeShippingEnabled && (
          <div
            className={styles.freeShippingProgress}
            data-testid="mini-cart-free-shipping-progress"
          >
            <div className={styles.freeShippingNotice}>
              {isFreeShippingUnlocked ? (
                <span>🎉 ¡Felicidades! Tienes ENVÍO GRATIS</span>
              ) : (
                <span>
                  🚚 ¡Te faltan <strong>${missingShippingAmount.toFixed(2)}</strong> para tener{' '}
                  <strong>ENVÍO GRATIS</strong>!
                </span>
              )}
            </div>

            <div
              className={styles.progressTrack}
              role="progressbar"
              aria-valuenow={shippingPercentage}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`Progreso de envío gratis: ${shippingPercentage}%`}
            >
              <div
                className={`${styles.progressFill} ${
                  isFreeShippingUnlocked ? styles.progressFillUnlocked : ''
                }`}
                style={{ width: `${shippingPercentage}%` }}
              />
            </div>

            <div className={styles.progressMeta}>
              <span>${currentShippingAmount.toFixed(2)} alcanzados</span>
              <span>{shippingPercentage}%</span>
            </div>
          </div>
        )}

        {/* Scrollable Body */}
        <div className={`${styles.body} ${isFetching ? styles.bodyValidating : ''}`}>
          {/* Error Banner */}
          {isError && cart.length > 0 && (
            <div className={styles.errorBanner} data-testid="mini-cart-error-banner" role="alert">
              <span>⚠️ No pudimos actualizar los precios y stock de tu carrito</span>
              <button
                type="button"
                className={styles.retryBtn}
                onClick={() => refetch()}
                data-testid="mini-cart-retry-btn"
              >
                Reintentar validación
              </button>
            </div>
          )}

          {/* Warning Banner / Stock Issue */}
          {hasInvalidItems && (
            <div className={styles.warningBanner} role="alert">
              <span>⚠️ Hay productos con stock insuficiente respecto a la cantidad solicitada.</span>
              <button
                type="button"
                className={styles.adjustBtn}
                onClick={handleAdjustCart}
                data-testid="mini-cart-adjust-stock-btn"
              >
                Ajustar carrito
              </button>
            </div>
          )}

          {/* Empty State */}
          {cart.length === 0 ? (
            <div className={styles.emptyState} data-testid="mini-cart-empty-state">
              <span className={styles.emptyIcon} aria-hidden="true">
                🛍️
              </span>
              <h3 className={styles.emptyTitle}>Tu carrito está vacío</h3>
              <p className={styles.emptyDesc}>
                {freeShippingEnabled
                  ? `Agrega tus productos favoritos y recibe envío gratis en compras superiores a $${threshold.toFixed(2)}.`
                  : 'Explora nuestro catálogo y agrega formulaciones a tu carrito.'}
              </p>
              <button
                type="button"
                className={styles.exploreBtn}
                onClick={closeDrawer}
                data-testid="mini-cart-explore-btn"
              >
                Explorar productos
              </button>
            </div>
          ) : (
            <>
              {/* Populated Items List */}
              <div className={styles.itemList}>
                {cart.map((item) => {
                  const vItem = validationData?.items.find((v) => v.productId === item.id);
                  const isDeleted = Boolean(
                    validationData &&
                      (!vItem ||
                        vItem.name === 'Producto eliminado' ||
                        vItem.message.toLowerCase().includes('no existe'))
                  );
                  const price = vItem
                    ? vItem.salePrice ?? vItem.unitPrice
                    : item.priceWhenAdded;
                  const availableStock = vItem
                    ? vItem.availableStock ?? vItem.quantityFulfilled
                    : undefined;
                  const isOutOfStock = isDeleted || (vItem ? vItem.quantityFulfilled === 0 : false);
                  const isStockShortage =
                    Boolean(vItem && vItem.quantityFulfilled < item.quantity && !isOutOfStock);
                  const thumb = vItem?.thumbnailUrl !== undefined ? vItem.thumbnailUrl : item.thumbnailUrl;
                  const isIncreaseDisabled =
                    availableStock !== undefined && item.quantity >= availableStock;

                  return (
                    <div
                      key={item.id}
                      className={`${styles.itemCard} ${
                        isOutOfStock ? styles.itemCardDanger : isStockShortage ? styles.itemCardWarning : ''
                      }`}
                      data-testid={`mini-cart-item-${item.id}`}
                    >
                      {thumb ? (
                        <img
                          src={thumb}
                          alt={item.name}
                          className={styles.itemThumb}
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className={styles.itemThumbPlaceholder}>Sin foto</div>
                      )}

                      <div className={styles.itemDetails}>
                        <h4 className={styles.itemName} title={item.name}>
                          {item.name}
                        </h4>
                        <div className={styles.itemPriceRow}>
                          <span className={styles.itemPrice}>${price.toFixed(2)}</span>
                          <span>· Sub: ${(price * item.quantity).toFixed(2)}</span>
                        </div>

                        {isOutOfStock && (
                          <span className={styles.stockBadgeDanger}>Producto agotado</span>
                        )}
                        {isStockShortage && vItem && (
                          <span className={styles.stockBadgeWarning}>
                            {vItem.message || `Solo quedan ${vItem.quantityFulfilled} unidades disponibles`}
                          </span>
                        )}

                        <div className={styles.itemControls}>
                          <div className={styles.stepper}>
                            <button
                              type="button"
                              className={styles.stepperBtn}
                              onClick={() => handleDecrease(item)}
                              data-testid={`mini-cart-decrease-qty-${item.id}`}
                              aria-label={`Disminuir cantidad de ${item.name}`}
                            >
                              -
                            </button>
                            <span className={styles.stepperQty}>{item.quantity}</span>
                            <button
                              type="button"
                              className={styles.stepperBtn}
                              onClick={() => handleIncrease(item, availableStock)}
                              disabled={isIncreaseDisabled}
                              data-testid={`mini-cart-increase-qty-${item.id}`}
                              aria-label={`Aumentar cantidad de ${item.name}`}
                            >
                              +
                            </button>
                          </div>

                          <button
                            type="button"
                            className={styles.removeBtn}
                            onClick={() => removeItem(item.id)}
                            data-testid={`mini-cart-remove-item-${item.id}`}
                            aria-label={`Eliminar ${item.name}`}
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* CRO Upsell Carousel */}
              {freeShippingEnabled &&
                shippingPromotion &&
                !isFreeShippingUnlocked &&
                missingShippingAmount > 0 &&
                shippingPromotion.upsellProducts &&
                shippingPromotion.upsellProducts.length > 0 && (
                  <div
                    className={styles.upsellSection}
                    data-testid="mini-cart-upsell-carousel"
                  >
                    <h4 className={styles.upsellTitle}>
                      ✨ Completa tu Envío Gratis en 1 clic
                    </h4>
                    <div className={styles.upsellTrack}>
                      {shippingPromotion.upsellProducts.map((uItem) => (
                        <div key={uItem.id} className={styles.upsellCard}>
                          {uItem.thumbnailUrl ? (
                            <img
                              src={uItem.thumbnailUrl}
                              alt={uItem.name}
                              className={styles.upsellThumb}
                            />
                          ) : (
                            <div className={styles.upsellThumbPlaceholder}>Sin foto</div>
                          )}
                          <span className={styles.upsellName} title={uItem.name}>
                            {uItem.name}
                          </span>
                          <span className={styles.upsellPrice}>${uItem.salePrice.toFixed(2)}</span>
                          {uItem.coversMissingAmount && (
                            <span className={styles.upsellBadge}>✨ ¡Te da Envío Gratis!</span>
                          )}
                          <button
                            type="button"
                            className={styles.upsellAddBtn}
                            onClick={() => handleAddUpsell(uItem)}
                            data-testid={`mini-cart-upsell-add-btn-${uItem.id}`}
                          >
                            + Agregar
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
            </>
          )}
        </div>

        {/* Fixed Footer */}
        {cart.length > 0 && (
          <div className={styles.footer}>
            <div className={styles.shippingRow}>
              <span>Envío estimado:</span>
              <span>
                {isFreeShippingUnlocked
                  ? 'GRATIS ($0.00) 🎉'
                  : freeShippingEnabled
                  ? `Faltan $${missingShippingAmount.toFixed(2)} para Envío Gratis`
                  : 'Calculado al pagar'}
              </span>
            </div>

            <div className={styles.totalRow}>
              <span>Total estimado:</span>
              <span className={styles.totalAmount} data-testid="mini-cart-total-amount">
                ${total.toFixed(2)}
              </span>
            </div>

            <button
              type="button"
              className={styles.checkoutBtn}
              onClick={handleCheckout}
              disabled={!isValid || isFetching || cart.length === 0}
              data-testid="mini-cart-checkout-btn"
            >
              {isFetching ? 'Validando inventario...' : `Ir a Pagar ($${total.toFixed(2)})`}
            </button>

            <button
              type="button"
              className={styles.viewFullCartLink}
              onClick={handleViewFullCart}
              data-testid="mini-cart-view-full-cart-link"
            >
              Ver carrito completo
            </button>

            <span className={styles.securityNote}>
              🔒 Compra 100% Segura & Encriptada
            </span>
          </div>
        )}
      </aside>
    </>
  );
}
