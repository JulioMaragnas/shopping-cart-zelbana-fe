import React from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Navbar } from '../../../design-system/components/Navbar/Navbar';
import { useOrderDetail } from '../api/useCheckout';
import styles from './OrderSuccessPage.module.css';

export function OrderSuccessPage() {
  const { orderId = '' } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const stateOrder = location.state?.order;
  const stateTotal = location.state?.totalAmount;

  const { data: order } = useOrderDetail(orderId, stateOrder);

  const totalPaid = order?.totalAmount ?? stateTotal ?? (stateOrder?.totalAmount ?? 0);
  const shippingAddress =
    order?.shippingAddress || stateOrder?.shippingAddress || 'Dirección registrada del comprador';
  const customerEmail =
    order?.customerEmail || stateOrder?.customerEmail || 'correo@ejemplo.com';

  return (
    <>
      <Helmet>
        <title>Zelbana | Orden Confirmada</title>
      </Helmet>

      <Navbar />

      <main className={styles.container}>
        <div className={styles.card}>
          <div className={styles.iconWrapper} aria-hidden="true">
            ✓
          </div>
          <h1 className={styles.title}>¡Gracias por tu compra!</h1>
          <p className={styles.subtitle}>
            Tu pago ha sido procesado exitosamente y la orden ha sido consolidada en el Kardex.
          </p>

          <section className={styles.detailsBox}>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Número de Orden</span>
              <span className={`${styles.detailValue} ${styles.orderId}`}>{orderId}</span>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Total Pagado</span>
              <span className={styles.detailValue}>${Number(totalPaid).toFixed(2)}</span>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Dirección de Entrega</span>
              <span className={styles.detailValue}>{shippingAddress}</span>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Comprobante</span>
              <span className={styles.detailValue}>Enviado a {customerEmail}</span>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Estado</span>
              <span className={styles.statusPaid}>Pago consolidado</span>
            </div>
          </section>

          <button
            type="button"
            className={styles.continueButton}
            onClick={() => navigate('/')}
          >
            Seguir comprando
          </button>
        </div>
      </main>
    </>
  );
}

