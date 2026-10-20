import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { registerUser } from '../api/authApi';
import styles from './RegisterPage.module.css';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTarget = searchParams.get('redirect') || '/';

  const login = useAuthStore((state) => state.login);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [acceptNewsletter, setAcceptNewsletter] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Password strength calculation
  const getPasswordStrength = (pass: string) => {
    if (!pass) {
      return { score: 0, label: 'Mínimo 8 caracteres', level: 'empty', percent: 0 };
    }
    if (pass.length < 8) {
      return { score: 1, label: 'Débil', level: 'weak', percent: 33 };
    }
    const hasLetters = /[a-zA-Z]/.test(pass);
    const hasNumbers = /[0-9]/.test(pass);
    const hasSymbols = /[^a-zA-Z0-9]/.test(pass);

    if (hasLetters && hasNumbers && hasSymbols) {
      return { score: 3, label: 'Óptimo', level: 'optimal', percent: 100 };
    }
    return { score: 2, label: 'Óptimo', level: 'optimal', percent: 80 };
  };

  const strength = getPasswordStrength(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    if (password.length < 8) {
      setErrorMessage('La contraseña debe tener al menos 8 caracteres.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const authData = await registerUser({ name, email, password });
      // Auto-Login Inmediato
      login(authData);
      navigate(redirectTarget, { replace: true });
    } catch (err: any) {
      if (err.status === 409) {
        setErrorMessage('Ya existe una cuenta con este correo.');
      } else {
        setErrorMessage(err.message || 'Error al crear la cuenta. Inténtalo de nuevo.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const loginLinkTo = searchParams.get('redirect')
    ? `/login?redirect=${encodeURIComponent(redirectTarget)}`
    : '/login';

  return (
    <div className={styles.pageContainer}>
      <div className={styles.registerCard} data-testid="register-card">
        <div className={styles.header}>
          <span className={styles.badge}>Nueva Cuenta</span>
          <h1 className={styles.title}>Crear Cuenta</h1>
          <p className={styles.subtitle}>
            Únete a Zelbana para guardar tus direcciones y agilizar tu pago.
          </p>
        </div>

        {errorMessage && (
          <div
            className={styles.alertError}
            role="alert"
            aria-live="assertive"
            data-testid="register-error-alert"
          >
            <span>⚠️</span>
            <span>{errorMessage}</span>
          </div>
        )}

        <form className={styles.form} onSubmit={handleSubmit} role="form" aria-label="Crear Cuenta">
          <div className={styles.fieldGroup}>
            <label htmlFor="register-name" className={styles.label}>
              Nombre Completo
            </label>
            <div className={styles.inputWrapper}>
              <input
                id="register-name"
                type="text"
                className={styles.input}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej. María Pérez"
                required
                autoComplete="name"
                disabled={isLoading}
                data-testid="register-name-input"
              />
            </div>
          </div>

          <div className={styles.fieldGroup}>
            <label htmlFor="register-email" className={styles.label}>
              Correo Electrónico
            </label>
            <div className={styles.inputWrapper}>
              <input
                id="register-email"
                type="email"
                className={styles.input}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@correo.com"
                required
                autoComplete="email"
                disabled={isLoading}
                data-testid="register-email-input"
              />
            </div>
          </div>

          <div className={styles.fieldGroup}>
            <label htmlFor="register-password" className={styles.label}>
              Contraseña
            </label>
            <div className={styles.inputWrapper}>
              <input
                id="register-password"
                type="password"
                className={styles.input}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 8 caracteres"
                required
                autoComplete="new-password"
                disabled={isLoading}
                data-testid="register-password-input"
              />
            </div>

            <div className={styles.strengthContainer}>
              <div className={styles.meterTrack}>
                <div
                  className={`${styles.meterBar} ${
                    strength.level === 'weak'
                      ? styles.barWeak
                      : strength.level === 'optimal'
                      ? styles.barOptimal
                      : ''
                  }`}
                  style={{ width: `${strength.percent}%` }}
                  role="progressbar"
                  aria-valuenow={strength.percent}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuetext={strength.label}
                  data-testid="register-password-strength-meter"
                />
              </div>
              <div className={styles.strengthLabelRow}>
                <span
                  className={`${styles.strengthLabel} ${
                    strength.level === 'weak'
                      ? styles.labelWeak
                      : strength.level === 'optimal'
                      ? styles.labelOptimal
                      : styles.strengthHint
                  }`}
                  data-testid="register-password-strength-label"
                >
                  {strength.label}
                </span>
                <span className={styles.strengthHint}>Mínimo 8 caracteres</span>
              </div>
            </div>
          </div>

          <label className={styles.checkboxRow}>
            <input
              type="checkbox"
              className={styles.checkbox}
              checked={acceptNewsletter}
              onChange={(e) => setAcceptNewsletter(e.target.checked)}
              data-testid="register-newsletter-checkbox"
            />
            Acepto recibir novedades y promociones de cuidado de la piel
          </label>

          <button
            type="submit"
            className={styles.submitBtn}
            disabled={isLoading}
            data-testid="register-submit-btn"
          >
            {isLoading ? (
              <span className={styles.spinner} aria-hidden="true" />
            ) : (
              'Crear Cuenta e Iniciar Sesión'
            )}
          </button>
        </form>

        <div className={styles.footer}>
          <div>
            ¿Ya tienes cuenta?
            <Link to={loginLinkTo} className={styles.loginLink} data-testid="register-to-login-link">
              Inicia sesión
            </Link>
          </div>
          <div className={styles.securityNote}>
            🔒 Cifrado y resguardo de datos
          </div>
        </div>
      </div>
    </div>
  );
};
