import { act, render, screen } from '@testing-library/react';
import type { AxiosAdapter, InternalAxiosRequestConfig } from 'axios';
import { AxiosError } from 'axios';
import { useEffect } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ApiError } from '../../../shared/api/api-error';
import { httpClient } from '../../../shared/api/http-client';
import { NotificationProvider } from '../../../shared/feedback/NotificationProvider';
import type { AuthUser } from '../api/auth-api';
import { TOKEN_KEY } from '../session/token-storage';
import { AuthProvider } from './AuthProvider';
import { useAuth } from './use-auth';

const EXPIRED_MESSAGE = 'Tu sesión expiró. Inicia sesión de nuevo.';
const admin: AuthUser = {
  id: 'u1',
  email: 'admin@example.com',
  name: 'Ana Admin',
  role: 'ADMIN',
  active: true,
};

type Route = { status: number; data: unknown };
let routes: Record<string, Route>;
let requests: InternalAxiosRequestConfig[];

const adapter: AxiosAdapter = async (config) => {
  requests.push(config);
  const route = routes[`${config.method?.toUpperCase()} ${config.url}`] ?? {
    status: 404,
    data: { error: { code: 'NOT_FOUND', message: 'No encontrado' } },
  };
  const response = { status: route.status, statusText: '', headers: {}, config, data: route.data };
  if (route.status >= 400) {
    throw new AxiosError('Request failed', AxiosError.ERR_BAD_RESPONSE, config, null, response);
  }
  return response;
};

function unauthorized(code = 'INVALID_TOKEN'): Route {
  return { status: 401, data: { error: { code, message: 'No autorizado' } } };
}

let auth: ReturnType<typeof useAuth>;

function Probe() {
  const current = useAuth();
  useEffect(() => {
    auth = current;
  });
  return <p data-testid="session">{`${current.status}:${current.user?.email ?? 'none'}`}</p>;
}

function renderAuth() {
  render(
    <NotificationProvider>
      <AuthProvider>
        <Probe />
      </AuthProvider>
    </NotificationProvider>,
  );
}

const session = () => screen.findByTestId('session');

beforeEach(() => {
  routes = {};
  requests = [];
  httpClient.defaults.adapter = adapter;
  localStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('AuthProvider', () => {
  it('starts anonymous without calling /auth/me when there is no token', async () => {
    renderAuth();

    expect(await session()).toHaveTextContent('anonymous:none');
    expect(requests).toHaveLength(0);
  });

  it('shows a full-screen loading state while /auth/me verifies a stored token', async () => {
    localStorage.setItem(TOKEN_KEY, 'stored-token');
    routes['GET /auth/me'] = { status: 200, data: admin };

    renderAuth();

    expect(screen.getByRole('status', { name: 'Cargando' })).toBeInTheDocument();
    expect(screen.queryByTestId('session')).not.toBeInTheDocument();
    expect(await session()).toHaveTextContent('authenticated:admin@example.com');
    expect(requests[0]?.headers.Authorization).toBe('Bearer stored-token');
  });

  it('clears a stored token rejected by /auth/me and stays anonymous', async () => {
    localStorage.setItem(TOKEN_KEY, 'expired-token');
    routes['GET /auth/me'] = unauthorized();

    renderAuth();

    expect(await session()).toHaveTextContent('anonymous:none');
    expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
  });

  it('stores the token and sets the user after a successful login', async () => {
    routes['POST /auth/login'] = { status: 200, data: { token: 'new-token', user: admin } };
    renderAuth();
    await session();

    await act(() => auth.login('admin@example.com', 'secreto123'));

    expect(screen.getByTestId('session')).toHaveTextContent('authenticated:admin@example.com');
    expect(localStorage.getItem(TOKEN_KEY)).toBe('new-token');
    expect(requests[0]?.data).toBe(
      JSON.stringify({ email: 'admin@example.com', password: 'secreto123' }),
    );
  });

  it('rejects a failed login with the ApiError and no session-expired handling', async () => {
    routes['POST /auth/login'] = unauthorized('INVALID_CREDENTIALS');
    renderAuth();
    await session();

    let failure: ApiError | undefined;
    await act(async () => {
      failure = await auth.login('admin@example.com', 'mala').then(
        () => undefined,
        (error: ApiError) => error,
      );
    });

    expect(failure).toMatchObject({ status: 401, code: 'INVALID_CREDENTIALS' });
    expect(screen.getByTestId('session')).toHaveTextContent('anonymous:none');
    expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
    expect(screen.queryByText(EXPIRED_MESSAGE)).not.toBeInTheDocument();
  });

  it('logs out and notifies when another request answers 401', async () => {
    localStorage.setItem(TOKEN_KEY, 'stored-token');
    routes['GET /auth/me'] = { status: 200, data: admin };
    routes['GET /products'] = unauthorized();
    renderAuth();
    expect(await session()).toHaveTextContent('authenticated:');

    await act(() => httpClient.get('/products').catch(() => undefined));

    expect(screen.getByTestId('session')).toHaveTextContent('anonymous:none');
    expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
    expect(await screen.findByRole('alert')).toHaveTextContent(EXPIRED_MESSAGE);
  });

  it('clears the token and the user on logout', async () => {
    localStorage.setItem(TOKEN_KEY, 'stored-token');
    routes['GET /auth/me'] = { status: 200, data: admin };
    renderAuth();
    expect(await session()).toHaveTextContent('authenticated:');

    act(() => auth.logout());

    expect(screen.getByTestId('session')).toHaveTextContent('anonymous:none');
    expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
  });

  it('works without storage when localStorage throws', async () => {
    const unavailable = () => {
      throw new DOMException('Storage disabled', 'SecurityError');
    };
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(unavailable);
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(unavailable);
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(unavailable);
    routes['POST /auth/login'] = { status: 200, data: { token: 'memory-token', user: admin } };

    renderAuth();
    expect(await session()).toHaveTextContent('anonymous:none');

    await act(() => auth.login('admin@example.com', 'secreto123'));
    expect(screen.getByTestId('session')).toHaveTextContent('authenticated:');

    act(() => auth.logout());
    expect(screen.getByTestId('session')).toHaveTextContent('anonymous:none');
  });
});

describe('AuthProvider refreshUser', () => {
  it('reloads the session user from /auth/me', async () => {
    localStorage.setItem(TOKEN_KEY, 'stored-token');
    routes['GET /auth/me'] = { status: 200, data: admin };
    renderAuth();
    expect(await session()).toHaveTextContent('authenticated:admin@example.com');

    routes['GET /auth/me'] = { status: 200, data: { ...admin, name: 'Ana Ruiz' } };
    await act(() => auth.refreshUser());

    expect(auth.user?.name).toBe('Ana Ruiz');
    expect(requests.filter((request) => request.url === '/auth/me')).toHaveLength(2);
  });

  it('keeps the current user when the refresh fails', async () => {
    localStorage.setItem(TOKEN_KEY, 'stored-token');
    routes['GET /auth/me'] = { status: 200, data: admin };
    renderAuth();
    expect(await session()).toHaveTextContent('authenticated:admin@example.com');

    routes['GET /auth/me'] = { status: 500, data: { error: { code: 'X', message: 'Caído.' } } };
    await act(() => auth.refreshUser());

    expect(auth.user).toEqual(admin);
    expect(screen.getByTestId('session')).toHaveTextContent('authenticated:admin@example.com');
  });
});
