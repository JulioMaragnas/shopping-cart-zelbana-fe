import { describe, it, expect, beforeEach, vi } from 'vitest';
import { authFetch } from './apiClient';
import { useAuthStore } from '../../features/auth/store/useAuthStore';

describe('authFetch / apiClient (TDD-AUTH-FE-06)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    useAuthStore.setState({
      token: null,
      user: null,
      isAuthenticated: false,
    });
  });

  it('TDD-AUTH-FE-06: automatically injects Authorization: Bearer <token> when token exists in useAuthStore', async () => {
    useAuthStore.setState({
      token: 'test-jwt-token-abc',
      isAuthenticated: true,
      user: { id: '1', name: 'Test', email: 'test@test.com' },
    });

    const mockFetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ success: true }), { status: 200 })
    );
    vi.stubGlobal('fetch', mockFetch);

    await authFetch('/storefront/api/auth/me');

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [calledUrl, calledOptions] = mockFetch.mock.calls[0];
    expect(calledUrl).toBe('/storefront/api/auth/me');

    const headers = new Headers(calledOptions.headers);
    expect(headers.get('Authorization')).toBe('Bearer test-jwt-token-abc');
    expect(headers.get('Content-Type')).toBe('application/json');
  });

  it('does not inject Authorization header when no token is present', async () => {
    const mockFetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({}), { status: 200 })
    );
    vi.stubGlobal('fetch', mockFetch);

    await authFetch('/storefront/api/categories');

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [, calledOptions] = mockFetch.mock.calls[0];
    const headers = new Headers(calledOptions.headers);
    expect(headers.has('Authorization')).toBe(false);
  });

  it('calls useAuthStore.logout() if response status is 401 and token was active', async () => {
    useAuthStore.setState({
      token: 'expired-token',
      isAuthenticated: true,
      user: { id: '1', name: 'Test', email: 'test@test.com' },
    });

    const mockFetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ error: 'Token expirado' }), { status: 401 })
    );
    vi.stubGlobal('fetch', mockFetch);

    const response = await authFetch('/storefront/api/auth/me');
    expect(response.status).toBe(401);

    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(useAuthStore.getState().token).toBeNull();
  });
});
