import { useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { socialLogin } from '../api/authApi';
import type { AuthResponseDTO } from '../types';

export const useSocialAuth = () => {
  const login = useAuthStore((s) => s.login);
  const [isVerifying, setIsVerifying] = useState(false);
  const [socialError, setSocialError] = useState<string | null>(null);

  const handleGoogleSuccess = async (idToken: string): Promise<AuthResponseDTO> => {
    setIsVerifying(true);
    setSocialError(null);

    try {
      const authResponse = await socialLogin({
        provider: 'google',
        idToken,
      });

      login(authResponse);

      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem('zelbana-last-auth-name', authResponse.user.name);
        localStorage.setItem('zelbana-last-auth-email', authResponse.user.email);
        localStorage.setItem('zelbana-last-auth-provider', 'google');
      }

      return authResponse;
    } catch (err: any) {
      setSocialError(
        'No se pudo completar el inicio de sesión con Google. Intenta con tu correo y contraseña.'
      );
      throw err;
    } finally {
      setIsVerifying(false);
    }
  };

  const handleDismiss = () => {
    setIsVerifying(false);
    setSocialError(null);
  };

  return {
    isVerifying,
    socialError,
    handleGoogleSuccess,
    handleDismiss,
    setSocialError,
  };
};
