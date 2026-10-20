import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Navbar } from '../../../design-system/components/Navbar/Navbar';
import { OrderLookupForm } from '../components/OrderLookupForm/OrderLookupForm';
import { OrderHistoryCard } from '../components/OrderHistoryCard/OrderHistoryCard';
import { OrderReceiptModal } from '../components/OrderReceiptModal/OrderReceiptModal';
import { ReorderFeedbackBanner } from '../components/ReorderFeedbackBanner/ReorderFeedbackBanner';
import { usePaidOrders, useOrderLookup } from '../api/useOrders';
import { useReorder } from '../hooks/useReorder';
import { useCartStore } from '../../cart/store/useCartStore';
import type { PaidOrder, OrderLookupQuery } from '../types/orders.types';
import styles from './MyOrdersPage.module.css';

export const MyOrdersPage: React.FC = () => {
  const navigate = useNavigate();
  const openDrawer = useCartStore((state) => state.openDrawer);

  const [storedEmail] = useState<string | null>(() => {
    return typeof window !== 'undefined'
      ? localStorage.getItem('zelbana-customer-email')
      : null;
  });

  const { data: apiOrders = [], isLoading: isLoadingOrders } = usePaidOrders(storedEmail);
  const lookupMutation = useOrderLookup();
  const { reorder, isReordering, feedback } = useReorder();

  const [queriedOrders, setQueriedOrders] = useState<PaidOrder[]>([]);
  const [lookupError, setLookupError] = useState<string | null>(null);

  const handleSearch = async (query: OrderLookupQuery) => {
    setLookupError(null);
    try {
      const order = await lookupMutation.mutateAsync(query);
      if (order && order.status === 'PAID') {
        setQueriedOrders((prev) => {
          const exists = prev.some((o) => o.orderId === order.orderId);
          if (exists) return prev;
          return [order, ...prev];
        });
      }
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : 'No encontramos un pedido pagado asociado a ese número de orden y correo electrónico.';
      setLookupError(msg);
    }
  };

  // Merge and deduplicate orders, strictly keeping only status === 'PAID'
  const mergedOrdersMap = new Map<string, PaidOrder>();
  for (const o of queriedOrders) {
    if (o.status === 'PAID') {
      mergedOrdersMap.set(o.orderId, o);
    }
  }
  for (const o of apiOrders) {
    if (o.status === 'PAID' && !mergedOrdersMap.has(o.orderId)) {
      mergedOrdersMap.set(o.orderId, o);
    }
  }

  const allOrders = Array.from(mergedOrdersMap.values());
  const hasOrders = allOrders.length > 0;
  const isInitialLoading = isLoadingOrders && !hasOrders;

  const [selectedReceiptOrder, setSelectedReceiptOrder] = useState<PaidOrder | null>(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);

  const handleOpenReceipt = (order: PaidOrder) => {
    setSelectedReceiptOrder(order);
    setIsReceiptModalOpen(true);
  };

  const handleCloseReceipt = () => {
    setIsReceiptModalOpen(false);
    setSelectedReceiptOrder(null);
  };

  const handleViewCart = () => {
    if (typeof openDrawer === 'function') {
      openDrawer();
    } else {
      navigate('/cart');
    }
  };

  return (
    <>
      <Helmet>
        <title>Zelbana | Mis Pedidos</title>
      </Helmet>

      <Navbar />

      <main className={styles.pageContainer} data-testid="my-orders-page">
        <div className={styles.mainContent}>
          {/* Breadcrumb accesible */}
          <nav aria-label="Ruta de navegación" className={styles.breadcrumb}>
            <Link to="/" className={styles.breadcrumbLink}>
              Inicio
            </Link>
            <span>/</span>
            <span className={styles.breadcrumbLink}>Mi Cuenta</span>
            <span>/</span>
            <span className={styles.breadcrumbCurrent} aria-current="page">
              Mis Pedidos
            </span>
          </nav>

          {/* Encabezado Principal */}
          <header className={styles.headerSection}>
            <div className={styles.titleRow}>
              <h1 className={styles.title} data-testid="orders-page-title">
                Mis Pedidos
              </h1>
              <span className={styles.contextChip}>Solo pagos confirmados</span>
            </div>
            <p className={styles.subtitle}>
              Consulta el historial de tus compras confirmadas y repite tus rutinas de cuidado personal en 1 clic.
            </p>
          </header>

          {/* Buscador Seguro Anti-Enumeración */}
          <OrderLookupForm
            isLoading={lookupMutation.isPending}
            onSearch={handleSearch}
            errorMessage={lookupError}
          />

          {/* Feedback de Recompra (Toast/Banner Dinámico) */}
          <ReorderFeedbackBanner feedback={feedback} onViewCart={handleViewCart} />

          {/* Estado 1: Loading / Skeleton (CLS = 0) */}
          {isInitialLoading && (
            <div className={styles.ordersSection} aria-busy="true" aria-label="Cargando historial de pedidos">
              <div className={styles.skeletonCard}>
                <div className={styles.skeletonHeader} />
                <div className={styles.skeletonMeta} />
                <div className={styles.skeletonItem} />
                <div className={styles.skeletonFooter} />
              </div>
              <div className={styles.skeletonCard}>
                <div className={styles.skeletonHeader} />
                <div className={styles.skeletonMeta} />
                <div className={styles.skeletonItem} />
                <div className={styles.skeletonFooter} />
              </div>
            </div>
          )}

          {/* Estado 3: Empty State (Sin pedidos pagados) */}
          {!isInitialLoading && !hasOrders && (
            <section
              className={styles.emptyContainer}
              data-testid="orders-empty-state"
              aria-label="Sin pedidos confirmados"
            >
              <div className={styles.emptyIconWrapper} aria-hidden="true">
                📦
              </div>
              <h2 className={styles.emptyTitle}>Aún no tienes pedidos confirmados</h2>
              <p className={styles.emptyDescription}>
                Cuando confirmes una compra en nuestra tienda, tus órdenes aparecerán aquí con su comprobante de pago
                y la opción de repetir tus productos favoritos en 1 clic.
              </p>
              <button
                type="button"
                className={styles.browseBtn}
                onClick={() => navigate('/')}
                data-testid="orders-empty-browse-btn"
              >
                Explorar el catálogo
              </button>
            </section>
          )}

          {/* Estado 2: Populated / Success (Solo órdenes PAID) */}
          {!isInitialLoading && hasOrders && (
            <section className={styles.ordersSection} aria-label="Historial de compras confirmadas">
              <h2 className={styles.ordersHeading}>
                <span>Tus Compras Confirmadas</span>
                <span className={styles.ordersCount}>
                  ({allOrders.length} {allOrders.length === 1 ? 'pedido' : 'pedidos'})
                </span>
              </h2>

              <div className={styles.ordersList}>
                {allOrders.map((order) => (
                  <OrderHistoryCard
                    key={order.orderId}
                    order={order}
                    isReordering={isReordering}
                    onReorder={reorder}
                    onViewVoucher={() => handleOpenReceipt(order)}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      </main>

      <OrderReceiptModal
        isOpen={isReceiptModalOpen}
        onClose={handleCloseReceipt}
        order={selectedReceiptOrder}
      />
    </>
  );
};
