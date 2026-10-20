export interface UserDTO {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string | null;
  authProvider?: string;
}

export interface AuthResponseDTO {
  success: boolean;
  token: string;
  user: UserDTO;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
}

export interface SmartResumeCardProps {
  name: string;
  email: string;
  provider?: string;
  onContinue: () => void;
  onChangeAccount: () => void;
  isLoading?: boolean;
}

export interface NavbarUserMenuProps {
  user: UserDTO;
  onLogout: () => void;
}

export interface LoginFormProps {
  onSuccess?: (authResponse: AuthResponseDTO) => void;
  redirectPath?: string;
}

export interface RegisterFormProps {
  onSuccess?: (authResponse: AuthResponseDTO) => void;
  redirectPath?: string;
}
