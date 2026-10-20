import { useAuthStore } from '../../features/auth/store/useAuthStore';

export async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token = useAuthStore.getState().token;
  const headers = new Headers(options.headers || {});

  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  // Si la API responde 401 por token caducado o inválido, desloguea de forma segura
  if (response.status === 401 && token) {
    useAuthStore.getState().logout();
  }

  return response;
}
