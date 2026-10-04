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

  const { data: validationData, isFetching, refetch } = useCartValidate();
  const reserveMutation = useCheckoutReserve();

  const subtotal = cart.reduce((sum, item) => sum + item.priceWhenAdded * item.quantity, 0);
  const total = validationData ? validationData.totalAmount : subtotal;
  const itemDiscounts = Math.max(0, subtotal - total);
  const timeDiscounts = 0;
  const isValid = cart.length > 0 && (validationData ? validationData.isValid : false);

  const handleAdjustCart = () => {
    if (!validationData?.items) return;
    validationData.items.forEach((vItem) => {
      if (vItem.quantityFulfilled === 0) {
        removeItem(vItem.productId);
      } else if (vItem.quantityFulfilled < vItem.quantityRequested) {
        updateQuantity(vItem.productId, vItem.quantityFulfilled);
      }
    });
  };

  const handlePay = async () => {
    if (!isValid || reserveMutation.isPending) return;
    setReserveError(null);
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

  const hasPartialStock =
    validationData &&
    !validationData.isValid &&
    validationData.items.some((i) => i.quantityFulfilled < i.quantityRequested);

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

          {hasPartialStock && (
            <div className={styles.warningBanner}>
              <p className={styles.warningText}>
                ⚠️ Hay productos con stock insuficiente en tu pedido respecto a la cantidad solicitada.
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
              const currentPrice = vItem ? vItem.unitPrice : item.priceWhenAdded;
              const disponible = vItem ? vItem.quantityFulfilled > 0 : true;
              const validationMessage = vItem?.message;

              return (
                <CartItemRow
                  key={item.id}
                  item={item}
                  currentPrice={currentPrice}
                  disponible={disponible}
                  validationMessage={validationMessage}
                  onRemove={removeItem}
                  onChangeQuantity={updateQuantity}
                />
              );
            })
          )}
        </div>

        <div className={styles.rightCol}>
          <OrderSummaryCard
            subtotal={subtotal}
            itemDiscounts={itemDiscounts}
            timeDiscounts={timeDiscounts}
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
