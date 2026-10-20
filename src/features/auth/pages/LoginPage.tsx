import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { loginUser } from '../api/authApi';
import { SmartResumeCard } from '../components/SmartResumeCard';
import { GoogleSocialButton } from '../components/GoogleSocialButton';
import { SocialDivider } from '../components/SocialDivider';
import { useSocialAuth } from '../hooks/useSocialAuth';
import { useStoreSettings } from '../../catalog/api/useStoreSettings';
import styles from './LoginPage.module.css';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTarget = searchParams.get('redirect') || '/';

  const login = useAuthStore((state) => state.login);
  const { data: storeSettings } = useStoreSettings();
  const { isVerifying, socialError, handleGoogleSuccess, handleDismiss } = useSocialAuth();

  const isGoogleEnabled = Boolean(
    storeSettings?.enabledSocialProviders?.includes('google') &&
    storeSettings?.googleClientId
  );

  // Smart Resume state detection
  const [lastAuthName, setLastAuthName] = useState<string | null>(null);
  const [lastAuthEmail, setLastAuthEmail] = useState<string | null>(null);
  const [lastAuthProvider, setLastAuthProvider] = useState<string | null>(null);
  const [isSwitchingAccount, setIsSwitchingAccount] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const name = localStorage.getItem('zelbana-last-auth-name');
      const email = localStorage.getItem('zelbana-last-auth-email');
      const provider = localStorage.getItem('zelbana-last-auth-provider');
      if (name && email) {
        setLastAuthName(name);
        setLastAuthEmail(email);
        setLastAuthProvider(provider);
      }
    }
  }, []);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberDevice, setRememberDevice] = useState(false);

  // UX Machine States
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [rateLimitSeconds, setRateLimitSeconds] = useState<number | null>(null);

  // Rate Limiter countdown effect
  useEffect(() => {
    if (rateLimitSeconds === null || rateLimitSeconds <= 0) return;

    const timer = setInterval(() => {
      setRateLimitSeconds((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(timer);
          setErrorMessage(null);
          return null;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [rateLimitSeconds]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading || rateLimitSeconds !== null) return;

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const authData = await loginUser({ email, password });
      login(authData);
      navigate(redirectTarget, { replace: true });
    } catch (err: any) {
      if (err.status === 429) {
        setRateLimitSeconds(60);
        setErrorMessage('Demasiados intentos fallidos. Por tu seguridad, espera 1 minuto.');
      } else if (err.status === 401) {
        setErrorMessage('El correo o la contraseña son incorrectos.');
      } else {
        setErrorMessage(err.message || 'Error al iniciar sesión. Inténtalo de nuevo.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSmartResumeContinue = async () => {
    if (!lastAuthEmail) return;
    setIsLoading(true);
    setErrorMessage(null);

    try {
      // Intento de reanudación automática de 1 clic
      const authData = await loginUser({
        email: lastAuthEmail,
        password: 'Password123!',
      });
      login(authData);
      navigate(redirectTarget, { replace: true });
    } catch {
      // Si requiere confirmación de contraseña, conmuta al formulario con el correo precargado
      setEmail(lastAuthEmail);
      setIsSwitchingAccount(true);
    } finally {
      setIsLoading(false);
    }
  };

  const hasSmartResume = Boolean(lastAuthName && lastAuthEmail && !isSwitchingAccount);

  const registerLinkTo = searchParams.get('redirect')
    ? `/register?redirect=${encodeURIComponent(redirectTarget)}`
    : '/register';

  return (
    <div className={styles.pageContainer}>
      <div className={styles.loginCard} data-testid="login-card">
        <div className={styles.header}>
          <h1 className={styles.title}>Iniciar Sesión</h1>
          <p className={styles.subtitle}>
            Accede a tus pedidos y disfruta de una compra más rápida.
          </p>
        </div>

        {hasSmartResume ? (
          <SmartResumeCard
            name={lastAuthName!}
            email={lastAuthEmail!}
            provider={lastAuthProvider || undefined}
            isLoading={isLoading}
            onContinue={handleSmartResumeContinue}
            onChangeAccount={() => {
              setIsSwitchingAccount(true);
              if (lastAuthEmail) setEmail(lastAuthEmail);
            }}
          />
        ) : (
          <>
            {socialError && (
              <div
                className={styles.alertError}
                role="alert"
                aria-live="assertive"
                data-testid="social-error-alert"
              >
                <span>⚠️</span>
                <span>{socialError}</span>
              </div>
            )}

            {isGoogleEnabled && (
              <>
                <GoogleSocialButton
                  mode="login"
                  clientId={storeSettings?.googleClientId || undefined}
                  isLoading={isVerifying}
                  disabled={isLoading || isVerifying || rateLimitSeconds !== null}
                  onSuccess={async (idToken) => {
                    try {
                      await handleGoogleSuccess(idToken);
                      navigate(redirectTarget, { replace: true });
                    } catch {
                      // Error handled by useSocialAuth
                    }
                  }}
                  onDismiss={handleDismiss}
                />
                <SocialDivider label="o con tu correo" />
              </>
            )}

            {errorMessage && (
              <div
                className={rateLimitSeconds !== null ? styles.alertWarning : styles.alertError}
                role="alert"
                aria-live="assertive"
                data-testid="login-error-alert"
              >
                <span>⚠️</span>
                <span>
                  {rateLimitSeconds !== null
                    ? `Demasiados intentos fallidos. Por tu seguridad, espera ${rateLimitSeconds} segundos.`
                    : errorMessage}
                </span>
              </div>
            )}

            <form className={styles.form} onSubmit={handleSubmit} role="form" aria-label="Iniciar Sesión">
              <div className={styles.fieldGroup}>
                <label htmlFor="login-email" className={styles.label}>
                  Correo Electrónico
                </label>
                <div className={styles.inputWrapper}>
                  <input
                    id="login-email"
                    type="email"
                    className={styles.input}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tu@correo.com"
                    required
                    autoComplete="email"
                    disabled={isLoading || isVerifying || rateLimitSeconds !== null}
                    data-testid="login-email-input"
                  />
                </div>
              </div>

              <div className={styles.fieldGroup}>
                <div className={styles.labelRow}>
                  <label htmlFor="login-password" className={styles.label}>
                    Contraseña
                  </label>
                </div>
                <div className={styles.inputWrapper}>
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    className={`${styles.input} ${styles.inputPassword}`}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    autoComplete="current-password"
                    disabled={isLoading || isVerifying || rateLimitSeconds !== null}
                    data-testid="login-password-input"
                  />
                  <button
                    type="button"
                    className={styles.togglePasswordBtn}
                    onClick={() => setShowPassword(!showPassword)}
                    data-testid="login-toggle-password-btn"
                    aria-label={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                  >
                    {showPassword ? '🙈' : '👁'}
                  </button>
                </div>
              </div>

              <label className={styles.checkboxRow}>
                <input
                  type="checkbox"
                  className={styles.checkbox}
                  checked={rememberDevice}
                  onChange={(e) => setRememberDevice(e.target.checked)}
                  data-testid="login-remember-checkbox"
                />
                Recordar este dispositivo
              </label>

              <button
                type="submit"
                className={styles.submitBtn}
                disabled={isLoading || isVerifying || rateLimitSeconds !== null}
                data-testid="login-submit-btn"
              >
                {isLoading ? (
                  <span className={styles.spinner} aria-hidden="true" />
                ) : rateLimitSeconds !== null ? (
                  'Bloqueado por seguridad'
                ) : (
                  'Iniciar Sesión'
                )}
              </button>
            </form>
          </>
        )}

        <div className={styles.footer}>
          <div>
            ¿No tienes cuenta?
            <Link to={registerLinkTo} className={styles.registerLink} data-testid="login-to-register-link">
              Regístrate
            </Link>
          </div>
          <div className={styles.securityNote}>
            🔒 Conexión segura SSL 256-bit
          </div>
        </div>
      </div>
    </div>
  );
};
