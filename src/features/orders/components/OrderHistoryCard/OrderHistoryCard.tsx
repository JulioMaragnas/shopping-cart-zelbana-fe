import React from 'react';
import { Link } from 'react-router-dom';
import type { OrderHistoryCardProps } from './OrderHistoryCard.types';
import styles from './OrderHistoryCard.module.css';

export const OrderHistoryCard: React.FC<OrderHistoryCardProps> = ({
  order,
  isReordering,
  onReorder,
  onViewVoucher,
}) => {
  const formattedDate = (() => {
    try {
      const d = new Date(order.createdAt);
      if (isNaN(d.getTime())) return order.createdAt;
      return d.toLocaleDateString('es-CO', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return order.createdAt;
    }
  })();

  const formattedTotal = `$${Number(order.totalAmount).toLocaleString('es-CO')} ${order.currency || 'COP'}`;

  return (
    <article
      className={styles.card}
      aria-labelledby={`order-title-${order.orderId}`}
      data-testid={`order-card-${order.orderId}`}
    >
      <header className={styles.header}>
        <div className={styles.headerInfo}>
          <span id={`order-title-${order.orderId}`} className={styles.orderId}>
            {order.orderId}
          </span>
          <span className={styles.dotSeparator}>•</span>
          <time className={styles.orderDate} dateTime={order.createdAt}>
            {formattedDate}
          </time>
        </div>

        <span
          className={styles.emeraldBadge}
          role="status"
          aria-label="Estado del pedido: Pago Confirmado"
          data-testid={`order-status-badge-${order.orderId}`}
        >
          ✓ Pago Confirmado
        </span>
      </header>

      <section className={styles.metaGrid}>
        <div className={styles.metaItem}>
          <span className={styles.metaLabel}>Entrega en</span>
          <span className={styles.metaValue}>{order.shippingAddress}</span>
        </div>

        <div className={styles.metaItem}>
          <span className={styles.metaLabel}>Comprobante a</span>
          <span className={styles.metaValue}>{order.customerEmail}</span>
        </div>

        <div className={styles.metaItem}>
          <span className={styles.metaLabel}>Total Pagado</span>
          <span
            className={styles.totalAmount}
            data-testid={`order-total-amount-${order.orderId}`}
          >
            {formattedTotal}
          </span>
        </div>
      </section>

      <div className={styles.itemsList}>
        {order.items.map((item) => (
          <div
            key={item.productId}
            className={styles.itemRow}
            data-testid={`order-product-item-${order.orderId}-${item.productId}`}
          >
            <div className={styles.itemLeft}>
              {item.thumbnailUrl ? (
                <img
                  src={item.thumbnailUrl}
                  alt={item.name}
                  className={styles.thumb}
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              ) : (
                <div className={styles.thumbPlaceholder}>Sin foto</div>
              )}

              <div className={styles.itemInfo}>
                <Link to={`/products/${item.productId}`} className={styles.productLink}>
                  {item.name}
                </Link>
                <div className={styles.itemDetails}>
                  <span>Cantidad: {item.quantity}</span>
                  {item.isAvailableToday === false && (
                    <span
                      className={styles.outOfStockBadge}
                      data-testid={`order-product-out-of-stock-badge-${item.productId}`}
                    >
                      ⚠️ Agotado hoy
                    </span>
                  )}
                </div>
              </div>
            </div>

            <span className={styles.itemPrice}>
              ${Number(item.salePrice * item.quantity).toLocaleString('es-CO')}
            </span>
          </div>
        ))}
      </div>

      <footer className={styles.footer}>
        <button
          type="button"
          className={styles.voucherBtn}
          onClick={() => onViewVoucher?.(order.orderId)}
          data-testid={`view-voucher-link-${order.orderId}`}
        >
          📄 Ver comprobante detallado
        </button>

        <button
          type="button"
          className={styles.reorderBtn}
          onClick={() => onReorder(order)}
          disabled={isReordering}
          aria-busy={isReordering}
          aria-disabled={isReordering}
          aria-label={`Volver a comprar los productos del pedido ${order.orderId}`}
          data-testid={`reorder-button-${order.orderId}`}
        >
          {isReordering ? '⏳ Verificando stock...' : '🔄 Volver a comprar'}
        </button>
      </footer>
    </article>
  );
};
