import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { AxiosAdapter } from 'axios';
import { AxiosError } from 'axios';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AppProviders } from '../../../app/providers';
import { routes } from '../../../app/routes';
import { httpClient } from '../../../shared/api/http-client';
import type { AuthUser } from '../api/auth-api';

const TOKEN_KEY = 'dashboard-gerencial.token';
const admin: AuthUser = {
  id: 'a1',
  email: 'ana@example.com',
  name: 'Ana Admin',
  role: 'ADMIN',
  active: true,
};
const user: AuthUser = {
  id: 'u1',
  email: 'uli@example.com',
  name: 'Uli Usuario',
  role: 'USER',
  active: true,
};

type Reply = { status: number; data: unknown };
let replies: Record<string, Reply | 'network'>;

const adapter: AxiosAdapter = async (config) => {
  const reply = replies[`${config.method?.toUpperCase()} ${config.url}`];
  if (reply === 'network' || reply === undefined) {
    throw new AxiosError('Network Error', AxiosError.ERR_NETWORK, config);
  }
  const response = { status: reply.status, statusText: '', headers: {}, config, data: reply.data };
  if (reply.status >= 400) {
    throw new AxiosError('Request failed', AxiosError.ERR_BAD_RESPONSE, config, null, response);
  }
  return response;
};

function signedInAs(account: AuthUser) {
  localStorage.setItem(TOKEN_KEY, 'stored-token');
  replies['GET /auth/me'] = { status: 200, data: account };
}

function renderAt(path: string) {
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  render(
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>,
  );
  return router;
}

beforeEach(() => {
  replies = {};
  localStorage.clear();
  httpClient.defaults.adapter = adapter;
  vi.stubGlobal('matchMedia', (query: string): MediaQueryList => ({
    matches: true,
    media: query,
    onchange: null,
    addListener: () => undefined,
    removeListener: () => undefined,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    dispatchEvent: () => false,
  }));
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('auth routes', () => {
  it('sends an anonymous user to the login and back to the page after signing in', async () => {
    replies['POST /auth/login'] = { status: 200, data: { token: 'new-token', user: admin } };
    const router = renderAt('/inventory');

    expect(await screen.findByRole('heading', { name: 'Iniciar sesión' })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/login');

    await userEvent.type(screen.getByLabelText('Correo electrónico'), 'ana@example.com');
    await userEvent.type(screen.getByLabelText('Contraseña'), 'secreto123');
    await userEvent.click(screen.getByRole('button', { name: 'Entrar' }));

    expect(await screen.findByRole('heading', { name: 'Inventario' })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/inventory');
  });

  it('sends an authenticated user away from the login to the dashboard', async () => {
    signedInAs(admin);
    const router = renderAt('/login');

    expect(await screen.findByRole('heading', { name: 'Dashboard' })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/dashboard');
  });

  it('hides Usuarios from a USER and shows the no-access page at /users', async () => {
    signedInAs(user);
    const router = renderAt('/users');

    expect(
      await screen.findByRole('heading', { name: 'No tienes permisos para ver esta sección' }),
    ).toBeInTheDocument();
    const nav = screen.getByRole('navigation', { name: 'Navegación principal' });
    expect(within(nav).queryByRole('link', { name: 'Usuarios' })).not.toBeInTheDocument();
    expect(within(nav).getByRole('link', { name: 'Inventario' })).toBeInTheDocument();

    await userEvent.click(screen.getByRole('link', { name: 'Volver al dashboard' }));

    expect(router.state.location.pathname).toBe('/dashboard');
    expect(screen.getByRole('heading', { name: 'Dashboard' })).toBeInTheDocument();
  });

  it('lets an ADMIN see and open Usuarios', async () => {
    signedInAs(admin);
    const router = renderAt('/dashboard');

    const nav = await screen.findByRole('navigation', { name: 'Navegación principal' });
    await userEvent.click(within(nav).getByRole('link', { name: 'Usuarios' }));

    expect(router.state.location.pathname).toBe('/users');
    expect(screen.getByRole('heading', { name: 'Usuarios' })).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: 'No tienes permisos para ver esta sección' }),
    ).not.toBeInTheDocument();
  });

  it('shows the user name and the Spanish role in the top bar', async () => {
    signedInAs(user);
    renderAt('/dashboard');

    const header = await screen.findByRole('banner');
    expect(within(header).getByText('Uli Usuario')).toBeInTheDocument();
    expect(within(header).getByText('Usuario')).toBeInTheDocument();
  });

  it('logs out from the top bar, clears the token and shows the login', async () => {
    signedInAs(admin);
    const router = renderAt('/dashboard');

    await userEvent.click(await screen.findByRole('button', { name: 'Cerrar sesión' }));

    expect(await screen.findByRole('heading', { name: 'Iniciar sesión' })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/login');
    expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
  });

  it('ends at the login when any request answers 401', async () => {
    signedInAs(admin);
    replies['GET /products'] = {
      status: 401,
      data: { error: { code: 'INVALID_TOKEN', message: 'Token inválido' } },
    };
    const router = renderAt('/inventory');
    expect(await screen.findByRole('heading', { name: 'Inventario' })).toBeInTheDocument();

    await act(() => httpClient.get('/products').catch(() => undefined));

    expect(await screen.findByRole('heading', { name: 'Iniciar sesión' })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/login');
    expect(screen.getByText('Tu sesión expiró. Inicia sesión de nuevo.')).toBeInTheDocument();
  });

  it('shows an error with Reintentar when the API is down at startup and recovers', async () => {
    localStorage.setItem(TOKEN_KEY, 'stored-token');
    replies['GET /auth/me'] = 'network';
    renderAt('/dashboard');

    const retry = await screen.findByRole('button', { name: 'Reintentar' });
    expect(screen.queryByRole('heading', { name: 'Iniciar sesión' })).not.toBeInTheDocument();
    expect(localStorage.getItem(TOKEN_KEY)).toBe('stored-token');

    replies['GET /auth/me'] = { status: 200, data: admin };
    await userEvent.click(retry);

    expect(await screen.findByRole('heading', { name: 'Dashboard' })).toBeInTheDocument();
  });

  it('lets the user leave the unavailable-session screen for the login', async () => {
    localStorage.setItem(TOKEN_KEY, 'stored-token');
    replies['GET /auth/me'] = 'network';
    const router = renderAt('/dashboard');

    const leave = await screen.findByRole('button', { name: 'Ir al inicio de sesión' });
    expect(screen.getByRole('button', { name: 'Reintentar' })).toBeInTheDocument();
    expect(screen.getByText('No pudimos verificar tu sesión')).toBeInTheDocument();

    await userEvent.click(leave);

    expect(await screen.findByRole('heading', { name: 'Iniciar sesión' })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/login');
    expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
    expect(screen.queryByText('No pudimos verificar tu sesión')).not.toBeInTheDocument();
  });
});
