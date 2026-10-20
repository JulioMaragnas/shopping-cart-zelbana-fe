import React, { useState } from 'react';
import type { OrderLookupFormProps } from './OrderLookupForm.types';
import styles from './OrderLookupForm.module.css';

export const OrderLookupForm: React.FC<OrderLookupFormProps> = ({
  isLoading,
  onSearch,
  errorMessage,
}) => {
  const [orderId, setOrderId] = useState('');
  const [email, setEmail] = useState('');
  const [orderIdError, setOrderIdError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let hasError = false;
    const trimmedOrderId = orderId.trim();
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedOrderId) {
      setOrderIdError('Por favor ingresa tu número de orden.');
      hasError = true;
    } else {
      setOrderIdError(null);
    }

    if (!trimmedEmail) {
      setEmailError('Por favor ingresa tu correo electrónico.');
      hasError = true;
    } else if (!emailRegex.test(trimmedEmail)) {
      setEmailError('Ingresa un formato de correo válido (ej. maria@email.com).');
      hasError = true;
    } else {
      setEmailError(null);
    }

    if (hasError || isLoading) {
      return;
    }

    onSearch({
      orderId: trimmedOrderId,
      email: trimmedEmail,
    });
  };

  return (
    <section className={styles.container} aria-label="Consulta segura de pedidos">
      <div className={styles.header}>
        <h2 className={styles.title}>
          <span>🔍</span> Consultar pedido específico
        </h2>
        <p className={styles.subtitle}>
          Ingresa tu número de orden y el correo registrado para consultar una compra como invitado o dispositivo.
        </p>
      </div>

      <form
        role="search"
        aria-label="Búsqueda segura de pedidos confirmados"
        onSubmit={handleSubmit}
        noValidate
        data-testid="order-lookup-form"
      >
        <div className={styles.formGrid}>
          <div className={styles.fieldGroup}>
            <label htmlFor="orderLookupOrderId" className={styles.label}>
              Número de Orden *
            </label>
            <input
              id="orderLookupOrderId"
              type="text"
              className={`${styles.input} ${orderIdError ? styles.inputError : ''}`}
              placeholder="ej. ORD-1760731845000"
              value={orderId}
              onChange={(e) => {
                setOrderId(e.target.value);
                if (orderIdError) setOrderIdError(null);
              }}
              disabled={isLoading}
              aria-invalid={orderIdError ? 'true' : 'false'}
              aria-describedby={orderIdError ? 'order-id-hint' : undefined}
              data-testid="order-lookup-order-id-input"
              required
            />
            {orderIdError && (
              <span id="order-id-hint" className={styles.validationHint}>
                {orderIdError}
              </span>
            )}
          </div>

          <div className={styles.fieldGroup}>
            <label htmlFor="orderLookupEmail" className={styles.label}>
              Correo Electrónico *
            </label>
            <input
              id="orderLookupEmail"
              type="email"
              className={`${styles.input} ${emailError ? styles.inputError : ''}`}
              placeholder="ej. maria@email.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (emailError) setEmailError(null);
              }}
              disabled={isLoading}
              aria-invalid={emailError ? 'true' : 'false'}
              aria-describedby={emailError ? 'order-email-hint' : undefined}
              data-testid="order-lookup-email-input"
              required
            />
            {emailError && (
              <span id="order-email-hint" className={styles.validationHint}>
                {emailError}
              </span>
            )}
          </div>

          <button
            type="submit"
            className={styles.submitBtn}
            disabled={isLoading}
            aria-busy={isLoading}
            data-testid="order-lookup-submit-btn"
          >
            {isLoading ? 'Buscando...' : '🔍 Buscar pedido'}
          </button>
        </div>

        <div className={styles.privacyNotice}>
          <span>🔒</span>
          <span>Validación segura anti-enumeración: solo se muestran órdenes con pago confirmado.</span>
        </div>

        {errorMessage && (
          <div
            className={styles.errorBanner}
            role="alert"
            data-testid="order-lookup-error-message"
          >
            {errorMessage}
          </div>
        )}
      </form>
    </section>
  );
};
