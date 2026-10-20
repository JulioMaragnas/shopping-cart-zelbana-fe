export interface SocialSettingsDTO {
  enabledSocialProviders: ('google' | 'apple' | 'meta')[];
  googleClientId?: string | null;
}

export interface GoogleSocialButtonProps {
  mode: 'login' | 'register';
  clientId?: string;
  isLoading?: boolean;
  disabled?: boolean;
  onSuccess: (idToken: string) => void | Promise<void>;
  onError?: (errorMessage: string) => void;
  onDismiss?: () => void;
  className?: string;
}

export interface SocialDividerProps {
  label?: string;
  className?: string;
}

export interface SocialAuthPayload {
  provider: 'google';
  idToken: string;
}
