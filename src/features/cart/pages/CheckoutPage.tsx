import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Navbar } from '../../../design-system/components/Navbar/Navbar';
import { useQueryClient } from '@tanstack/react-query';
import { useCartStore } from '../store/useCartStore';
import { useCheckoutConfirm, useCheckoutCancel, useOrderDetail } from '../api/useCheckout';
import { useUserAddresses, useCreateUserAddress } from '../api/useAddresses';
import { useStoreSettings } from '../../catalog/api/useStoreSettings';
import { AddressMapPicker } from '../components/AddressMapPicker/AddressMapPicker';
import type { OrderDetail, OrderItem, AddressQuickChip, ShippingCoordinates } from '../types';
import styles from './CheckoutPage.module.css';

const QUICK_CHIPS: AddressQuickChip[] = ['Casa', 'Oficina', 'Padres', 'Pareja'];

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
  const { data: savedAddresses = [] } = useUserAddresses();
  const { data: storeSettings } = useStoreSettings();
  const createAddressMutation = useCreateUserAddress();

  // Estados de Dirección de Entrega (Fase 5.4)
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [isChangingAddress, setIsChangingAddress] = useState(false);
  const [isAddingNewAddress, setIsAddingNewAddress] = useState(false);

  // Formulario de nueva dirección
  const [selectedChip, setSelectedChip] = useState<AddressQuickChip | 'Otro'>('Casa');
  const [customLabel, setCustomLabel] = useState('');
  const [receiverName, setReceiverName] = useState('');
  const [receiverPhone, setReceiverPhone] = useState('');
  const [city, setCity] = useState('Medellín');
  const [department, setDepartment] = useState('Antioquia');
  const [addressLine, setAddressLine] = useState('');
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [coordinates, setCoordinates] = useState<ShippingCoordinates | null>(null);
  const [isDefaultAddress, setIsDefaultAddress] = useState(true); // Marcado por default (TC-ADDR-2)

  // Estado de Correo Electrónico para comprobante (Épica 11)
  const [customerEmail, setCustomerEmail] = useState<string>(() => {
    const stored = typeof window !== 'undefined' ? localStorage.getItem('zelbana-customer-email') : null;
    if (stored) return stored;
    if (initialOrder?.customerEmail) return initialOrder.customerEmail;
    return 'guest@zelbana.com';
  });

  useEffect(() => {
    if ((!customerEmail || customerEmail === 'guest@zelbana.com') && order?.customerEmail) {
      setCustomerEmail(order.customerEmail);
    }
  }, [order?.customerEmail, customerEmail]);

  // Sincronizar dirección seleccionada inicial
  useEffect(() => {
    if (savedAddresses.length > 0) {
      if (!selectedAddressId) {
        const defaultAddr = savedAddresses.find((a) => a.isDefault) || savedAddresses[0];
        setSelectedAddressId(defaultAddr.id);
        setIsAddingNewAddress(false);
      }
    } else {
      setIsAddingNewAddress(true);
    }
  }, [savedAddresses, selectedAddressId]);

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

  // Validación de Dirección: obligatoria antes de confirmar compra (TC-ORD-ADDR-1)
  const activeSavedAddress = savedAddresses.find((a) => a.id === selectedAddressId);
  const isFormValid = Boolean(
    receiverName.trim() &&
    receiverPhone.trim() &&
    city.trim() &&
    department.trim() &&
    addressLine.trim()
  );

  const isAddressValid = isAddingNewAddress
    ? isFormValid
    : Boolean(activeSavedAddress);

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isEmailValid = emailRegex.test(customerEmail.trim());

  const handleConfirm = async () => {
    if (isExpired || !isAddressValid || !isEmailValid || confirmMutation.isPending) return;
    setErrorMessage(null);

    let finalShippingAddress = '';
    let finalCoordinates: ShippingCoordinates | null = null;
    const finalEmail = customerEmail.trim().toLowerCase();

    if (!isAddingNewAddress && activeSavedAddress) {
      finalShippingAddress = `${activeSavedAddress.addressLine}, ${activeSavedAddress.city}, ${activeSavedAddress.department} (Recibe: ${activeSavedAddress.receiverName} - ${activeSavedAddress.receiverPhone})${activeSavedAddress.additionalInfo ? ` [${activeSavedAddress.additionalInfo}]` : ''}`;
      finalCoordinates = activeSavedAddress.coordinates ?? null;
    } else {
      const label = selectedChip === 'Otro' ? (customLabel.trim() || 'Principal') : selectedChip;
      finalShippingAddress = `${addressLine.trim()}, ${city.trim()}, ${department.trim()} (Recibe: ${receiverName.trim()} - ${receiverPhone.trim()})${additionalInfo.trim() ? ` [${additionalInfo.trim()}]` : ''}`;
      finalCoordinates = coordinates;

      // Guardar dirección en la libreta si el usuario lo desea
      if (isDefaultAddress) {
        try {
          await createAddressMutation.mutateAsync({
            label,
            receiverName: receiverName.trim(),
            receiverPhone: receiverPhone.trim(),
            city: city.trim(),
            department: department.trim(),
            addressLine: addressLine.trim(),
            additionalInfo: additionalInfo.trim() || null,
            coordinates: finalCoordinates,
            isDefault: isDefaultAddress,
          });
        } catch {
          // No bloqueamos el pago si falla la persistencia secundaria de la dirección
        }
      }
    }

    try {
      await confirmMutation.mutateAsync({
        orderId,
        shippingAddress: finalShippingAddress,
        shippingCoordinates: finalCoordinates,
        customerEmail: finalEmail,
      });
      localStorage.setItem('zelbana-customer-email', finalEmail);
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
  const shippingThreshold = storeSettings?.freeShippingThreshold ?? 50.0;
  const isFreeShipping = Boolean(
    storeSettings?.freeShippingEnabled &&
      (currentTotal >= shippingThreshold || (currentOrder?.subtotalAmount ?? 0) >= shippingThreshold)
  );

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

                  <div className={styles.emailSection} data-testid="checkout-email-section">
                    <label htmlFor="checkoutCustomerEmail" className={styles.fieldLabel}>
                      Correo electrónico para tu comprobante y seguimiento *
                    </label>
                    <input
                      id="checkoutCustomerEmail"
                      type="email"
                      className={styles.input}
                      placeholder="ej. maria.gonzalez@email.com"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      data-testid="checkout-customer-email-input"
                      required
                    />
                  </div>

                  <div className={styles.deliverySection} data-testid="delivery-address-section">
                    <h2 className={styles.sectionTitle}>Dirección de entrega</h2>

                    {/* Caso A: Usuario con dirección guardada y no editando */}
                    {!isAddingNewAddress && !isChangingAddress && activeSavedAddress ? (
                      <div className={styles.addressCard} data-testid="selected-address-card">
                        <div className={styles.addressCardContent}>
                          <div className={styles.addressHeaderRow}>
                            <span className={styles.addressLabelBadge}>{activeSavedAddress.label}</span>
                            {activeSavedAddress.isDefault && (
                              <span className={styles.defaultBadge}>Principal</span>
                            )}
                          </div>
                          <span className={styles.addressReceiver}>
                            {activeSavedAddress.receiverName} ({activeSavedAddress.receiverPhone})
                          </span>
                          <span className={styles.addressLineText}>
                            {activeSavedAddress.addressLine}
                            {activeSavedAddress.additionalInfo ? ` • ${activeSavedAddress.additionalInfo}` : ''}
                          </span>
                          <span className={styles.addressCityText}>
                            {activeSavedAddress.city}, {activeSavedAddress.department}
                          </span>
                        </div>
                        <button
                          type="button"
                          className={styles.addressActionBtn}
                          onClick={() => setIsChangingAddress(true)}
                          data-testid="change-address-btn"
                        >
                          Cambiar dirección
                        </button>
                      </div>
                    ) : isChangingAddress && !isAddingNewAddress ? (
                      /* Selector de Direcciones Guardadas (TC-ADDR-5) */
                      <div className={styles.addressListContainer} data-testid="saved-addresses-list">
                        <p className={styles.fieldLabel}>Selecciona una dirección de entrega:</p>
                        {savedAddresses.map((addr) => (
                          <div
                            key={addr.id}
                            className={`${styles.addressOptionItem} ${selectedAddressId === addr.id ? styles.addressOptionActive : ''}`}
                            onClick={() => {
                              setSelectedAddressId(addr.id);
                              setIsChangingAddress(false);
                            }}
                            data-testid={`address-option-${addr.id}`}
                          >
                            <div className={styles.addressOptionInfo}>
                              <div className={styles.addressHeaderRow}>
                                <span className={styles.addressLabelBadge}>{addr.label}</span>
                                {addr.isDefault && <span className={styles.defaultBadge}>Principal</span>}
                              </div>
                              <strong>{addr.receiverName}</strong>
                              <span>{addr.addressLine}, {addr.city}</span>
                            </div>
                            <button type="button" className={styles.addressActionBtn}>
                              {selectedAddressId === addr.id ? 'Seleccionada' : 'Elegir'}
                            </button>
                          </div>
                        ))}
                        <button
                          type="button"
                          className={styles.addNewBtn}
                          onClick={() => setIsAddingNewAddress(true)}
                          data-testid="add-new-address-btn"
                        >
                          + Agregar nueva dirección
                        </button>
                      </div>
                    ) : (
                      /* Caso B: Formulario de Dirección (TC-ADDR-1, TC-ADDR-2, TC-ADDR-3, TC-ADDR-4) */
                      <div className={styles.addressForm} data-testid="address-form">
                        <div className={styles.chipsContainer}>
                          <label className={styles.fieldLabel}>¿Dónde entregamos tu pedido?</label>
                          <div className={styles.chipsRow} data-testid="quick-chips-row">
                            {QUICK_CHIPS.map((chip) => (
                              <button
                                key={chip}
                                type="button"
                                className={`${styles.chipBtn} ${selectedChip === chip ? styles.chipBtnActive : ''}`}
                                onClick={() => setSelectedChip(chip)}
                                data-testid={`chip-${chip.toLowerCase()}`}
                              >
                                {chip}
                              </button>
                            ))}
                            <button
                              type="button"
                              className={`${styles.chipBtn} ${selectedChip === 'Otro' ? styles.chipBtnActive : ''}`}
                              onClick={() => setSelectedChip('Otro')}
                              data-testid="chip-otro"
                            >
                              Otro
                            </button>
                          </div>
                          {selectedChip === 'Otro' && (
                            <input
                              type="text"
                              className={styles.input}
                              placeholder="Ej: Pareja, Finca, etc."
                              value={customLabel}
                              onChange={(e) => setCustomLabel(e.target.value)}
                              data-testid="custom-label-input"
                            />
                          )}
                        </div>

                        <div className={styles.formGrid}>
                          <div className={styles.inputGroup}>
                            <label htmlFor="receiverName" className={styles.fieldLabel}>Nombre de quien recibe *</label>
                            <input
                              id="receiverName"
                              type="text"
                              className={styles.input}
                              placeholder="Ej: Julio Cano"
                              value={receiverName}
                              onChange={(e) => setReceiverName(e.target.value)}
                              data-testid="receiver-name-input"
                              required
                            />
                          </div>

                          <div className={styles.inputGroup}>
                            <label htmlFor="receiverPhone" className={styles.fieldLabel}>Teléfono de contacto *</label>
                            <input
                              id="receiverPhone"
                              type="tel"
                              className={styles.input}
                              placeholder="Ej: +57 300 123 4567"
                              value={receiverPhone}
                              onChange={(e) => setReceiverPhone(e.target.value)}
                              data-testid="receiver-phone-input"
                              required
                            />
                          </div>

                          <div className={styles.inputGroup}>
                            <label htmlFor="city" className={styles.fieldLabel}>Ciudad *</label>
                            <input
                              id="city"
                              type="text"
                              className={styles.input}
                              placeholder="Medellín"
                              value={city}
                              onChange={(e) => setCity(e.target.value)}
                              data-testid="city-input"
                              required
                            />
                          </div>

                          <div className={styles.inputGroup}>
                            <label htmlFor="department" className={styles.fieldLabel}>Departamento *</label>
                            <input
                              id="department"
                              type="text"
                              className={styles.input}
                              placeholder="Antioquia"
                              value={department}
                              onChange={(e) => setDepartment(e.target.value)}
                              data-testid="department-input"
                              required
                            />
                          </div>

                          <div className={styles.inputGroupFull}>
                            <label htmlFor="addressLine" className={styles.fieldLabel}>Dirección física (Nomenclatura) *</label>
                            <input
                              id="addressLine"
                              type="text"
                              className={styles.input}
                              placeholder="Ej: Carrera 65A # 1 sur - 10"
                              value={addressLine}
                              onChange={(e) => setAddressLine(e.target.value)}
                              data-testid="address-line-input"
                              required
                            />
                          </div>

                          <div className={styles.inputGroupFull}>
                            <label htmlFor="additionalInfo" className={styles.fieldLabel}>Detalles adicionales (Opcional)</label>
                            <input
                              id="additionalInfo"
                              type="text"
                              className={styles.input}
                              placeholder="Ej: Torre 2, Apto 402. Dejar en portería"
                              value={additionalInfo}
                              onChange={(e) => setAdditionalInfo(e.target.value)}
                              data-testid="additional-info-input"
                            />
                          </div>
                        </div>

                        {/* Google Maps Pin Picker como complemento de precisión opcional (TC-ADDR-3, TC-ADDR-4) */}
                        <AddressMapPicker
                          coordinates={coordinates}
                          onChangeCoordinates={(coords) => setCoordinates(coords)}
                        />

                        {/* Checkbox "Guardar como mi dirección principal" marcado por default (TC-ADDR-2) */}
                        <label className={styles.checkboxRow} data-testid="save-default-address-label">
                          <input
                            type="checkbox"
                            className={styles.checkboxInput}
                            checked={isDefaultAddress}
                            onChange={(e) => setIsDefaultAddress(e.target.checked)}
                            data-testid="save-default-address-checkbox"
                          />
                          Guardar como mi dirección principal
                        </label>

                        {savedAddresses.length > 0 && (
                          <button
                            type="button"
                            className={styles.addNewBtn}
                            onClick={() => {
                              setIsAddingNewAddress(false);
                              setIsChangingAddress(false);
                            }}
                            data-testid="cancel-new-address-btn"
                          >
                            Cancelar y usar dirección guardada
                          </button>
                        )}
                      </div>
                    )}
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

                {isFreeShipping && (
                  <div
                    className={styles.freeShippingBadge}
                    data-testid="checkout-free-shipping-badge"
                  >
                    🚚 Envío GRATIS incluido en tu pedido
                  </div>
                )}

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
                  {!isEmailValid && (
                    <p className={styles.requiredNotice} role="alert" data-testid="email-required-alert">
                      ⚠️ Ingresa un correo electrónico válido para tu comprobante.
                    </p>
                  )}
                  {!isAddressValid && (
                    <p className={styles.requiredNotice} role="alert" data-testid="address-required-alert">
                      ⚠️ Debes ingresar o seleccionar una dirección de entrega antes de pagar.
                    </p>
                  )}
                  <button
                    type="button"
                    className={styles.payButton}
                    onClick={handleConfirm}
                    disabled={!isAddressValid || !isEmailValid || confirmMutation.isPending || cancelMutation.isPending}
                    data-testid="confirm-pay-button"
                  >
                    {confirmMutation.isPending ? 'Procesando pago...' : 'Confirmar y Pagar (Simular)'}
                  </button>
                  <button
                    type="button"
                    className={styles.cancelButton}
                    onClick={handleCancel}
                    disabled={confirmMutation.isPending || cancelMutation.isPending}
                    data-testid="cancel-reservation-button"
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


