import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Navbar } from '../../../design-system/components/Navbar/Navbar';
import { useQueryClient } from '@tanstack/react-query';
import { useCartStore } from '../store/useCartStore';
import { useCheckoutConfirm, useCheckoutCancel, useOrderDetail } from '../api/useCheckout';
import type { OrderDetail, OrderItem } from '../types';
import styles from './CheckoutPage.module.css';

export function CheckoutPage() {
  const { orderId = '' } = useParams<{ orderId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const clearCart = useCartStore((state) => state.clearCart);
  const cart = useCartStore((state) => state.cart);

  const initialOrder: OrderDetail | undefined = location.state?.order;
  const initialTotal =
    initialOrder?.totalAmount ??
    cart.reduce((sum, item) => sum + item.priceWhenAdded * item.quantity, 0);

  const { data: order, isLoading, isError, error } = useOrderDetail(orderId, initialOrder);


  // Auto-redirect si la orden ya está consolidada (PAID)
  useEffect(() => {
    if (order?.status === 'PAID') {
      navigate(`/order-success/${orderId}`, {
        state: { orderId, order },
        replace: true,
      });
    }
  }, [order?.status, orderId, navigate, order]);

  // Expiration calculation basada estrictamente en el expiresAt del servidor
  const expiresAt = order?.expiresAt || initialOrder?.expiresAt;
  const [secondsRemaining, setSecondsRemaining] = useState<number>(() => {
    if (!expiresAt) return 15 * 60;
    const diff = Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000);
    return Math.max(0, diff);
  });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const confirmMutation = useCheckoutConfirm();
  const cancelMutation = useCheckoutCancel();

  useEffect(() => {
    if (!expiresAt) return;

    const checkRemaining = () => {
      const diff = Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000);
      const remaining = Math.max(0, diff);
      setSecondsRemaining(remaining);
      return remaining;
    };

    if (checkRemaining() <= 0) return;

    const timer = setInterval(() => {
      const remaining = checkRemaining();
      if (remaining <= 0) {
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [expiresAt]);

  const isExpired =
    (secondsRemaining <= 0 || order?.status === 'EXPIRED' || order?.status === 'CANCELLED') &&
    !confirmMutation.isPending;

  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  const isUrgent = secondsRemaining > 0 && secondsRemaining <= 3 * 60;

  const handleConfirm = async () => {
    if (isExpired || confirmMutation.isPending) return;
    setErrorMessage(null);
    try {
      await confirmMutation.mutateAsync({
        orderId,
        shippingAddress: order?.shippingAddress ?? undefined,
        shippingCoordinates: order?.shippingCoordinates ?? undefined,
        customerEmail: order?.customerEmail ?? undefined,
      });
      await queryClient.invalidateQueries({ queryKey: ['catalogSearch'] });
      await queryClient.invalidateQueries({ queryKey: ['productDetail'] });
      await queryClient.invalidateQueries({ queryKey: ['orderDetail', orderId] });
      clearCart();
      navigate(`/order-success/${orderId}`, {
        state: { orderId, totalAmount: order?.totalAmount ?? initialTotal, order },
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al confirmar el pago';
      setErrorMessage(msg);
    }
  };

  const handleCancel = async () => {
    if (cancelMutation.isPending) return;
    setErrorMessage(null);
    try {
      await cancelMutation.mutateAsync(orderId);
      await queryClient.invalidateQueries({ queryKey: ['catalogSearch'] });
      await queryClient.invalidateQueries({ queryKey: ['orderDetail', orderId] });
      navigate('/cart');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al cancelar la reserva';
      setErrorMessage(msg);
      navigate('/cart');
    }
  };

  if (isLoading && !order && !initialOrder) {
    return (
      <>
        <Helmet>
          <title>Zelbana | Checkout</title>
        </Helmet>
        <Navbar />
        <main className={styles.container}>
          <div className={styles.card}>
            <p>Cargando información de tu reserva...</p>
          </div>
        </main>
      </>
    );
  }

  if (isError && !order && !initialOrder) {
    return (
      <>
        <Helmet>
          <title>Zelbana | Checkout</title>
        </Helmet>
        <Navbar />
        <main className={styles.container}>
          <div className={styles.alertBox} role="alert">
            <h4>Orden no encontrada</h4>
            <p>{error?.message || 'No fue posible cargar los datos de la orden.'}</p>
            <button type="button" className={styles.payButton} onClick={() => navigate('/cart')}>
              Volver al carrito
            </button>
          </div>
        </main>
      </>
    );
  }

  const currentOrder: OrderDetail | undefined = order || initialOrder;
  const items: OrderItem[] = currentOrder?.items || [];
  const currentTotal = currentOrder?.totalAmount ?? initialTotal;

  return (
    <>
      <Helmet>
        <title>Zelbana | Checkout</title>
      </Helmet>

      <Navbar />

      <main className={styles.container}>
        <div className={styles.layout}>
          {/* Columna Izquierda: Candado 15 min, productos reservados y entrega */}
          <div className={styles.leftCol}>
            <div className={styles.card}>
              <header className={styles.header}>
                <h1 className={styles.title}>Reserva y Pago</h1>
                <p className={styles.subtitle}>
                  Completa tu transacción para asegurar definitivamente tus artículos.
                </p>
                <div className={styles.orderBadgeRow}>
                  <span className={styles.orderId}>Orden: {orderId}</span>
                  <span className={styles.statusBadge}>
                    {isExpired ? 'EXPIRADA' : currentOrder?.status || 'RESERVED'}
                  </span>
                </div>
              </header>

              {isExpired ? (
                <div className={styles.alertBox} role="alert">
                  <h4>⚠️ Tu tiempo de reserva expiró</h4>
                  <p>
                    Los productos han sido liberados del Kardex y devueltos al stock público. Por favor, revisa la disponibilidad nuevamente en tu carrito.
                  </p>
                  <button
                    type="button"
                    className={styles.payButton}
                    onClick={() => navigate('/cart')}
                  >
                    Volver al carrito
                  </button>
                </div>
              ) : (
                <>
                  <div className={`${styles.timerBox} ${isUrgent ? styles.timerBoxUrgent : ''}`}>
                    <p className={styles.timerLabel}>Tiempo restante de reserva</p>
                    <div
                      className={`${styles.timerCountdown} ${isUrgent ? styles.timerCountdownUrgent : ''}`}
                      data-testid="countdown-timer"
                    >
                      {formattedTime}
                    </div>
                    <p className={styles.timerExplanation}>
                      Tus artículos están reservados por 15 minutos en el Kardex. Si el contador llega a cero, serán liberados automáticamente para otros compradores.
                    </p>
                  </div>

                  {errorMessage && (
                    <div className={styles.alertBox} role="alert">
                      <p>{errorMessage}</p>
                    </div>
                  )}

                  <div className={styles.deliverySection}>
                    <h2 className={styles.sectionTitle}>Datos de entrega confirmados</h2>
                    <div className={styles.deliveryInfoBox}>
                      <span>
                        <strong>Dirección:</strong>{' '}
                        {currentOrder?.shippingAddress || 'Dirección registrada del comprador'}
                      </span>
                      <span>
                        <strong>Comprobante:</strong>{' '}
                        {currentOrder?.customerEmail || 'correo@ejemplo.com'}
                      </span>
                    </div>
                  </div>

                  {items.length > 0 && (
                    <div className={styles.itemsSection}>
                      <h2 className={styles.sectionTitle}>Artículos reservados</h2>
                      <div className={styles.itemsList}>
                        {items.map((item) => (
                          <div key={item.productId} className={styles.itemRow}>
                            {item.thumbnailUrl ? (
                              <img
                                src={item.thumbnailUrl}
                                alt={item.name}
                                className={styles.itemThumb}
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                }}
                              />
                            ) : (
                              <div className={styles.itemThumbPlaceholder}>Sin foto</div>
                            )}
                            <div className={styles.itemInfo}>
                              <span className={styles.itemName}>{item.name}</span>
                              <span className={styles.itemQty}>Cantidad: {item.quantity}</span>
                            </div>
                            <span className={styles.itemPrice}>
                              ${(item.lineTotal || item.salePrice * item.quantity).toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Columna Derecha: Sticky Summary Card (Estilo Mercado Libre) */}
          {!isExpired && (
            <aside className={styles.rightCol}>
              <div className={styles.stickyCard}>
                <h2 className={styles.summaryTitle}>Resumen de la compra</h2>

                <div className={styles.breakdownList}>
                  {items.map((item) => (
                    <div key={item.productId} className={styles.breakdownRow}>
                      <span className={styles.breakdownName}>
                        {item.name} {item.quantity > 1 ? `(x${item.quantity})` : ''}
                      </span>
                      <span className={styles.breakdownPrice}>
                        ${(item.lineSubtotal || item.unitPrice * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}

                  {currentOrder && currentOrder.discountAmount > 0 && (
                    <div className={styles.breakdownDiscountRow}>
                      <span>Descuento</span>
                      <span className={styles.discountAmount}>
                        -${currentOrder.discountAmount.toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>

                <div className={styles.divider} />

                <div className={styles.totalRow}>
                  <span className={styles.totalLabel}>Total a pagar</span>
                  <span className={styles.totalValue}>${currentTotal.toFixed(2)}</span>
                </div>

                <div className={styles.actions}>
                  <button
                    type="button"
                    className={styles.payButton}
                    onClick={handleConfirm}
                    disabled={confirmMutation.isPending || cancelMutation.isPending}
                  >
                    {confirmMutation.isPending ? 'Procesando pago...' : 'Confirmar y Pagar (Simular)'}
                  </button>
                  <button
                    type="button"
                    className={styles.cancelButton}
                    onClick={handleCancel}
                    disabled={confirmMutation.isPending || cancelMutation.isPending}
                  >
                    {cancelMutation.isPending ? 'Cancelando...' : 'Cancelar reserva'}
                  </button>
                </div>
              </div>
            </aside>
          )}
        </div>
      </main>
    </>
  );
}

