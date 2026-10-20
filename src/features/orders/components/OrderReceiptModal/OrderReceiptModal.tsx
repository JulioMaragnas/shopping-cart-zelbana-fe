import React, { useEffect, useRef } from 'react';
import type { OrderReceiptModalProps } from '../../types/receipt';
import styles from './OrderReceiptModal.module.css';

export const OrderReceiptModal: React.FC<OrderReceiptModalProps> = ({
  isOpen,
  onClose,
  order,
  isLoading = false,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Estado 1: Loading / Skeleton
  if (isLoading) {
    return (
      <div
        className={styles.backdrop}
        onClick={handleBackdropClick}
        data-testid="receipt-modal-backdrop"
      >
        <div
          className={styles.modalContent}
          role="status"
          aria-busy="true"
          aria-label="Cargando comprobante de compra..."
          data-testid="receipt-modal"
          ref={modalRef}
        >
          <div className={styles.skeletonContainer}>
            <div className={styles.skeletonBar} style={{ width: '60%' }} />
            <div className={styles.skeletonBar} style={{ width: '90%', height: '80px' }} />
            <div className={styles.skeletonBar} style={{ width: '100%', height: '120px' }} />
            <div className={styles.skeletonBar} style={{ width: '40%', alignSelf: 'flex-end' }} />
          </div>
        </div>
      </div>
    );
  }

  // Estado 4: Error State (orden nula o corrupta)
  if (!order) {
    return (
      <div
        className={styles.backdrop}
        onClick={handleBackdropClick}
        data-testid="receipt-modal-backdrop"
      >
        <div
          className={styles.modalContent}
          role="alert"
          aria-live="assertive"
          data-testid="receipt-modal"
          ref={modalRef}
        >
          <div className={styles.header}>
            <div className={styles.brandInfo}>
              <h2 className={styles.brandTitle}>ZELBANA</h2>
              <span className={styles.brandSubtitle}>Comprobante Oficial de Compra</span>
            </div>
            <button
              type="button"
              className={styles.closeBtn}
              onClick={onClose}
              aria-label="Cerrar comprobante"
              data-testid="receipt-modal-close-btn"
            >
              ✕
            </button>
          </div>
          <div className={styles.alertContainer}>
            <div className={styles.alertIcon} aria-hidden="true">⚠️</div>
            <h3 className={styles.alertTitle}>Comprobante no disponible</h3>
            <p className={styles.alertMessage}>
              No pudimos cargar los detalles fiscales del comprobante. Intenta nuevamente.
            </p>
            <button
              type="button"
              className={styles.secondaryBtn}
              onClick={onClose}
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    );
  }

  const items = order.items || [];

  // Estado 3: Empty State (orden sin ítems)
  if (items.length === 0) {
    return (
      <div
        className={styles.backdrop}
        onClick={handleBackdropClick}
        data-testid="receipt-modal-backdrop"
      >
        <div
          className={styles.modalContent}
          role="alert"
          data-testid="receipt-modal"
          ref={modalRef}
        >
          <div className={styles.header}>
            <div className={styles.brandInfo}>
              <h2 className={styles.brandTitle}>ZELBANA</h2>
              <span className={styles.brandSubtitle}>Comprobante Oficial de Compra</span>
            </div>
            <button
              type="button"
              className={styles.closeBtn}
              onClick={onClose}
              aria-label="Cerrar comprobante"
              data-testid="receipt-modal-close-btn"
            >
              ✕
            </button>
          </div>
          <div className={styles.alertContainer}>
            <div className={styles.alertIcon} aria-hidden="true">📦</div>
            <h3 className={styles.alertTitle}>Orden sin productos</h3>
            <p className={styles.alertMessage}>
              Esta orden no registra productos asociados.
            </p>
            <button
              type="button"
              className={styles.secondaryBtn}
              onClick={onClose}
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Estado 2: Populated / Success
  const orderId = order.orderId || (order as any).id || '';
  const customerName =
    (order as any).customer?.name ||
    (order as any).customerName ||
    (typeof window !== 'undefined' ? localStorage.getItem('zelbana-customer-name') : null) ||
    'Cliente Zelbana';
  const customerEmail =
    (order as any).customer?.email || (order as any).customerEmail || '';
  const customerPhone =
    (order as any).customer?.phone || (order as any).customerPhone || '';

  const formattedAddress = (() => {
    const addr = order.shippingAddress;
    if (!addr) return 'Dirección no especificada';
    if (typeof addr === 'string') return addr;
    return `${addr.street}, ${addr.city}, ${addr.department}${addr.notes ? ` (${addr.notes})` : ''}`;
  })();

  const formattedDate = (() => {
    try {
      const d = new Date(order.createdAt);
      if (isNaN(d.getTime())) return order.createdAt;
      return d.toLocaleDateString('es-CO', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return order.createdAt;
    }
  })();

  const paymentLastFour =
    (order as any).paymentMethod?.lastFourDigits || '4242';
  const paymentBrand = (order as any).paymentMethod?.brand || 'Tarjeta';

  const rawSubtotal =
    (order as any).financialSummary?.subtotal ??
    (order as any).subtotalAmount ??
    items.reduce(
      (sum, it: any) => sum + (it.salePrice || it.unitPrice || 0) * it.quantity,
      0
    );

  const rawDiscounts =
    (order as any).financialSummary?.discounts ??
    (order as any).discountAmount ??
    0;

  const rawShipping =
    (order as any).financialSummary?.shippingCost ??
    (order as any).shippingCost ??
    0;

  const isFreeShipping =
    (order as any).financialSummary?.isFreeShipping ??
    (order as any).isFreeShipping ??
    (rawSubtotal >= 50 || rawShipping === 0);

  const rawTotal =
    (order as any).financialSummary?.totalPaid ??
    (order as any).totalAmount ??
    Math.max(0, rawSubtotal - rawDiscounts + rawShipping);

  return (
    <div
      className={styles.backdrop}
      onClick={handleBackdropClick}
      data-testid="receipt-modal-backdrop"
    >
      <div
        className={styles.modalContent}
        role="dialog"
        aria-modal="true"
        aria-labelledby="receipt-order-id-label"
        data-testid="receipt-modal"
        ref={modalRef}
      >
        {/* Header */}
        <header className={styles.header}>
          <div className={styles.brandInfo}>
            <h2 className={styles.brandTitle}>ZELBANA</h2>
            <span className={styles.brandSubtitle}>Comprobante Oficial de Compra</span>
          </div>

          <div className={styles.headerActions}>
            <span
              className={styles.statusBadge}
              data-testid="receipt-status-badge"
              role="status"
            >
              ✓ Pago Confirmado
            </span>
            <button
              type="button"
              className={styles.closeBtn}
              onClick={onClose}
              aria-label="Cerrar comprobante"
              data-testid="receipt-modal-close-btn"
            >
              ✕
            </button>
          </div>
        </header>

        {/* Body */}
        <div className={styles.body}>
          {/* Metadata Grid */}
          <div className={styles.metaGrid}>
            <div className={styles.metaBlock}>
              <span className={styles.metaLabel} id="receipt-order-id-label">
                No. de Orden
              </span>
              <span className={styles.metaValue} data-testid="receipt-order-id">
                {orderId}
              </span>
            </div>

            <div className={styles.metaBlock}>
              <span className={styles.metaLabel}>Fecha y Hora</span>
              <span className={styles.metaValue}>{formattedDate}</span>
            </div>

            <div className={styles.metaBlock}>
              <span className={styles.metaLabel}>Método de Pago</span>
              <span className={styles.metaValue}>
                {paymentBrand} •••• {paymentLastFour}
              </span>
            </div>
          </div>

          {/* Parties Grid (Compradora & Entrega) */}
          <div className={styles.partiesGrid}>
            <div className={styles.partyCard}>
              <h3 className={styles.partyTitle}>Datos de la Compradora</h3>
              <p className={styles.partyText} data-testid="receipt-customer-name">
                {customerName}
              </p>
              {customerEmail && <p className={styles.partyText}>{customerEmail}</p>}
              {customerPhone && <p className={styles.partyText}>{customerPhone}</p>}
            </div>

            <div className={styles.partyCard}>
              <h3 className={styles.partyTitle}>Dirección de Entrega</h3>
              <p className={styles.partyText} data-testid="receipt-shipping-address">
                {formattedAddress}
              </p>
            </div>
          </div>

          {/* Items Table */}
          <div className={styles.itemsSection}>
            <h3 className={styles.sectionTitle}>Artículos Facturados</h3>
            <table className={styles.itemsTable} aria-label="Tabla de artículos facturados">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th style={{ textAlign: 'center' }}>Cant.</th>
                  <th style={{ textAlign: 'right' }}>Precio Unit.</th>
                  <th style={{ textAlign: 'right' }}>Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item: any) => {
                  const thumb = item.thumbnailUrl || item.imageUrl;
                  const unitPrice = Number(item.salePrice ?? item.unitPrice ?? 0);
                  const lineSubtotal = Number(item.subtotal ?? unitPrice * item.quantity);

                  return (
                    <tr
                      key={item.productId}
                      data-testid="receipt-item-row"
                    >
                      <td>
                        <div className={styles.itemProductCell}>
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
                            <div className={styles.itemPlaceholder}>Item</div>
                          )}
                          <span style={{ fontWeight: 500 }}>{item.name}</span>
                        </div>
                      </td>
                      <td style={{ textAlign: 'center' }}>{item.quantity}</td>
                      <td style={{ textAlign: 'right' }}>
                        ${unitPrice.toFixed(2)}
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 600 }}>
                        ${lineSubtotal.toFixed(2)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Financial Breakdown */}
          <div className={styles.summarySection}>
            <div className={styles.summaryCard}>
              <div className={styles.summaryRow}>
                <span>Subtotal:</span>
                <span>${rawSubtotal.toFixed(2)}</span>
              </div>

              {rawDiscounts > 0 && (
                <div className={styles.summaryRow}>
                  <span>Descuentos:</span>
                  <span style={{ color: '#059669' }}>-${rawDiscounts.toFixed(2)}</span>
                </div>
              )}

              <div className={styles.summaryRow}>
                <span>Envío Nacional:</span>
                {isFreeShipping ? (
                  <span
                    className={styles.freeShippingBadge}
                    data-testid="receipt-free-shipping-badge"
                  >
                    GRATIS (Superó $50.00)
                  </span>
                ) : (
                  <span>${rawShipping.toFixed(2)}</span>
                )}
              </div>

              <div className={styles.summaryDivider} />

              <div className={styles.totalRow}>
                <span>Total Pagado:</span>
                <span data-testid="receipt-total-paid">
                  ${rawTotal.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className={styles.footer} data-testid="receipt-modal-footer">
          <div className={styles.securityNote}>
            <span>🔒 Transacción certificada y confirmada de forma segura</span>
          </div>

          <div className={styles.actions}>
            <button
              type="button"
              className={styles.secondaryBtn}
              onClick={onClose}
            >
              Cerrar
            </button>

            <button
              type="button"
              className={styles.printBtn}
              onClick={handlePrint}
              data-testid="receipt-print-btn"
            >
              🖨️ Imprimir / Guardar en PDF
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
};
