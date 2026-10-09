import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '../../../design-system/components/Navbar/Navbar';
import { CartItemRow } from '../../../design-system/components/CartItemRow/CartItemRow';
import { OrderSummaryCard } from '../../../design-system/components/OrderSummaryCard/OrderSummaryCard';
import { useCartStore } from '../store/useCartStore';
import { useCartValidate } from '../api/useCartValidate';
import { useCheckoutReserve } from '../api/useCheckout';
import styles from './CartPage.module.css';
import { Helmet } from 'react-helmet-async';

export function CartPage() {
  const navigate = useNavigate();
  const cart = useCartStore((state) => state.cart);
  const removeItem = useCartStore((state) => state.removeItem);
  const updateQuantity = useCartStore((state) => state.updateQuantity);

  const [reserveError, setReserveError] = useState<string | null>(null);
  const [adjustNotice, setAdjustNotice] = useState<string | null>(null);

  const { data: validationData, isFetching, refetch } = useCartValidate();
  const reserveMutation = useCheckoutReserve();

  const fallbackTotal = cart.reduce((sum, item) => sum + item.priceWhenAdded * item.quantity, 0);
  const total = validationData ? validationData.totalAmount : fallbackTotal;
  const totalUnits = validationData
    ? validationData.items.reduce((sum, item) => sum + item.quantityFulfilled, 0)
    : cart.reduce((sum, item) => sum + item.quantity, 0);

  const isValid = cart.length > 0 && Boolean(validationData?.isValid);
  const hasInvalidItems = Boolean(validationData && !validationData.isValid && cart.length > 0);

  const handleAdjustCart = () => {
    if (!validationData) return;
    let removedAny = false;

    cart.forEach((item) => {
      const vItem = validationData.items.find((v) => v.productId === item.id);
      const isDeletedItem =
        !vItem ||
        vItem.name === 'Producto eliminado' ||
        vItem.message.toLowerCase().includes('no existe');

      if (isDeletedItem || vItem.quantityFulfilled === 0) {
        removeItem(item.id);
        removedAny = true;
      } else if (vItem.quantityFulfilled < item.quantity) {
        updateQuantity(item.id, vItem.quantityFulfilled);
      }
    });

    setAdjustNotice(
      removedAny
        ? 'Hemos ajustado tu carrito al inventario disponible. Los productos agotados o que ya no están en el catálogo fueron removidos.'
        : 'Hemos ajustado tu carrito al inventario disponible.'
    );
  };

  const handlePay = async () => {
    if (!isValid || reserveMutation.isPending) return;
    setReserveError(null);
    setAdjustNotice(null);
    try {
      const response = await reserveMutation.mutateAsync(
        cart.map((item) => ({ productId: item.id, quantity: item.quantity }))
      );
      if (response.success && response.order) {
        navigate(`/checkout/${response.order.id}`, { state: { order: response.order } });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al reservar el inventario';
      setReserveError(msg);
      refetch();
    }
  };

  return (
    <>
      <Helmet>
        <title>Zelbana | Carrito</title>
      </Helmet>

      <Navbar />

      <main className={styles.container}>
        <div className={styles.leftCol}>
          <h2 className={styles.title}>Tu Carrito</h2>

          {reserveError && (
            <div className={styles.errorAlert} role="alert">
              ⚠️ {reserveError}
            </div>
          )}

          {adjustNotice && (
            <div className={styles.statusNotice} role="status">
              ✓ {adjustNotice}
            </div>
          )}

          {hasInvalidItems && (
            <div className={styles.warningBanner}>
              <p className={styles.warningText}>
                ⚠️ Hay productos con stock insuficiente o no disponibles en tu carrito respecto a la cantidad solicitada.
              </p>
              <button
                type="button"
                className={styles.adjustBtn}
                onClick={handleAdjustCart}
              >
                Ajustar carrito al inventario disponible
              </button>
            </div>
          )}

          {cart.length === 0 ? (
            <p className={styles.emptyMessage}>El carrito está vacío.</p>
          ) : (
            cart.map((item) => {
              const vItem = validationData?.items.find((v) => v.productId === item.id);
              const isDeleted = Boolean(
                validationData &&
                  (!vItem ||
                    vItem.name === 'Producto eliminado' ||
                    vItem.message.toLowerCase().includes('no existe'))
              );
              const currentPrice = vItem
                ? vItem.salePrice ?? vItem.unitPrice
                : item.priceWhenAdded;
              const discountPercentage = vItem?.discountPercentage ?? 0;
              const availableStock = vItem
                ? vItem.availableStock ?? vItem.quantityFulfilled
                : undefined;
              const disponible = isDeleted ? false : vItem ? vItem.quantityFulfilled > 0 : true;
              const validationMessage =
                vItem?.message ?? (isDeleted ? 'El producto ya no existe en el catálogo.' : undefined);
              const thumbnailUrl =
                vItem?.thumbnailUrl !== undefined ? vItem.thumbnailUrl : item.thumbnailUrl;

              return (
                <CartItemRow
                  key={item.id}
                  item={{
                    ...item,
                    thumbnailUrl,
                  }}
                  currentPrice={currentPrice}
                  discountPercentage={discountPercentage}
                  availableStock={availableStock}
                  disponible={disponible}
                  isDeleted={isDeleted}
                  validationMessage={validationMessage}
                  onRemove={(id) => {
                    setAdjustNotice(null);
                    removeItem(id);
                  }}
                  onChangeQuantity={(id, qty) => {
                    setAdjustNotice(null);
                    updateQuantity(id, qty);
                  }}
                />
              );
            })
          )}
        </div>

        <div className={styles.rightCol}>
          <OrderSummaryCard
            totalUnits={totalUnits}
            total={total}
            isValidating={isFetching || reserveMutation.isPending}
            isValid={isValid}
            onPay={handlePay}
          />
        </div>
      </main>
    </>
  );
}
