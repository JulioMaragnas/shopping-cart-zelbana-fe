import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Navbar } from '../../../design-system/components/Navbar/Navbar';
import { useQueryClient } from '@tanstack/react-query';
import { useCartStore } from '../store/useCartStore';
import { useCheckoutConfirm, useCheckoutCancel } from '../api/useCheckout';
import styles from './CheckoutPage.module.css';

export function CheckoutPage() {
  const { orderId = '' } = useParams<{ orderId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const clearCart = useCartStore((state) => state.clearCart);
  const cart = useCartStore((state) => state.cart);

  const orderState = location.state?.order;
  const initialTotal = orderState?.totalAmount ?? cart.reduce((sum, item) => sum + item.priceWhenAdded * item.quantity, 0);

  // Expiration calculation
  const [expiresAt] = useState<string>(
    () => orderState?.expiresAt || new Date(Date.now() + 15 * 60 * 1000).toISOString()
  );
  const [secondsRemaining, setSecondsRemaining] = useState<number>(() => {
    const diff = Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000);
    return Math.max(0, diff);
  });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const confirmMutation = useCheckoutConfirm();
  const cancelMutation = useCheckoutCancel();

  useEffect(() => {
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

  const isExpired = secondsRemaining <= 0;
  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  const isUrgent = secondsRemaining > 0 && secondsRemaining <= 3 * 60;

  const handleConfirm = async () => {
    if (isExpired || confirmMutation.isPending) return;
    setErrorMessage(null);
    try {
      await confirmMutation.mutateAsync(orderId);
      await queryClient.invalidateQueries({ queryKey: ['catalogSearch'] });
      await queryClient.invalidateQueries({ queryKey: ['productDetail'] });
      clearCart();
      navigate(`/order-success/${orderId}`, {
        state: { orderId, totalAmount: initialTotal },
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
      navigate('/cart');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al cancelar la reserva';
      setErrorMessage(msg);
      // Even if server error occurs, user can still go back to cart
      navigate('/cart');
    }
  };

  return (
    <>
      <Helmet>
        <title>Zelbana | Checkout</title>
      </Helmet>

      <Navbar />

      <main className={styles.container}>
        <div className={styles.card}>
          <header className={styles.header}>
            <h1 className={styles.title}>Reserva y Pago</h1>
            <p className={styles.subtitle}>
              Completa tu transacción para asegurar definitivamente tus artículos.
            </p>
            <div className={styles.orderBadgeRow}>
              <span className={styles.orderId}>Orden: {orderId}</span>
              <span className={styles.statusBadge}>
                {isExpired ? 'EXPIRADA' : (orderState?.status || 'RESERVED')}
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

              <section className={styles.summarySection}>
                <span className={styles.summaryLabel}>Total a pagar</span>
                <span className={styles.summaryTotal}>${initialTotal.toFixed(2)}</span>
              </section>

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
            </>
          )}
        </div>
      </main>
    </>
  );
}
