import { authFetch } from '../../../shared/api/apiClient';
import type { AuthResponseDTO, LoginInput, RegisterInput, UserDTO } from '../types';

export const loginUser = async (credentials: LoginInput): Promise<AuthResponseDTO> => {
  const response = await fetch('/storefront/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(credentials),
  });

  const data = await response.json();
  if (!response.ok) {
    const error: any = new Error(data.error || 'Credenciales inválidas');
    error.status = response.status;
    throw error;
  }

  return data;
};

export const registerUser = async (input: RegisterInput): Promise<AuthResponseDTO> => {
  const response = await fetch('/storefront/api/auth/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });

  const data = await response.json();
  if (!response.ok) {
    const error: any = new Error(data.error || 'Error al registrar usuario');
    error.status = response.status;
    throw error;
  }

  return data;
};

export const getMe = async (): Promise<UserDTO> => {
  const response = await authFetch('/storefront/api/auth/me');
  const data = await response.json();
  if (!response.ok) {
    const error: any = new Error(data.error || 'Error al obtener perfil');
    error.status = response.status;
    throw error;
  }

  return data;
};
