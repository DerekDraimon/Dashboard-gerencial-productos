import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { AxiosAdapter } from 'axios';
import { createMemoryRouter, RouterProvider, type InitialEntry } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AppProviders } from '../../../app/providers';
import { httpClient } from '../../../shared/api/http-client';
import { LoginPage } from './LoginPage';

function setViewport(isDesktop: boolean) {
  vi.stubGlobal('matchMedia', (query: string): MediaQueryList => ({
    matches: isDesktop,
    media: query,
    onchange: null,
    addListener: () => undefined,
    removeListener: () => undefined,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    dispatchEvent: () => false,
  }));
}

const loginSucceeds: AxiosAdapter = async (config) => ({
  status: 200,
  statusText: '',
  headers: {},
  config,
  data: {
    token: 'new-token',
    user: { id: 'u1', email: 'admin@example.com', name: 'Ana', role: 'ADMIN', active: true },
  },
});

function renderLogin(entry: InitialEntry = '/login') {
  const router = createMemoryRouter(
    [
      { path: '/login', element: <LoginPage /> },
      { path: '/dashboard', element: <h1>Dashboard</h1> },
      { path: '/inventory', element: <h1>Inventario</h1> },
    ],
    { initialEntries: [entry] },
  );
  render(
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>,
  );
  return router;
}

async function submitValidCredentials() {
  await userEvent.type(screen.getByLabelText('Correo electrónico'), 'admin@example.com');
  await userEvent.type(screen.getByLabelText('Contraseña'), 'secreto123');
  await userEvent.click(screen.getByRole('button', { name: 'Entrar' }));
}

beforeEach(() => {
  localStorage.clear();
  httpClient.defaults.adapter = loginSucceeds;
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('LoginPage', () => {
  it('goes to the dashboard after a successful login', async () => {
    setViewport(true);
    const router = renderLogin();

    await submitValidCredentials();

    expect(await screen.findByRole('heading', { name: 'Dashboard' })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/dashboard');
  });

  it('goes back to the location the user came from', async () => {
    setViewport(true);
    const router = renderLogin({
      pathname: '/login',
      state: { from: { pathname: '/inventory', search: '?page=2', hash: '' } },
    });

    await submitValidCredentials();

    expect(await screen.findByRole('heading', { name: 'Inventario' })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/inventory');
    expect(router.state.location.search).toBe('?page=2');
  });

  it.each(['//evil.example', '/\\evil.example', 'https://evil.example'])(
    'ignores a from location that leaves the app (%s)',
    async (pathname) => {
      setViewport(true);
      const router = renderLogin({ pathname: '/login', state: { from: { pathname } } });

      await submitValidCredentials();

      expect(await screen.findByRole('heading', { name: 'Dashboard' })).toBeInTheDocument();
      expect(router.state.location.pathname).toBe('/dashboard');
    },
  );

  it('shows the showcase with shapes and pills on desktop', () => {
    setViewport(true);
    renderLogin();

    expect(screen.getByText('Tu inventario, en orden y a la vista.')).toBeInTheDocument();
    expect(screen.getByTestId('login-shapes')).toBeInTheDocument();
    expect(screen.getByRole('list', { name: 'Lo que encuentras en el panel' })).toBeInTheDocument();
  });

  it('shows a compact strip without shapes or pills below md', () => {
    setViewport(false);
    renderLogin();

    expect(screen.getByText('Tu inventario, en orden y a la vista.')).toBeInTheDocument();
    expect(screen.queryByTestId('login-shapes')).not.toBeInTheDocument();
    expect(
      screen.queryByRole('list', { name: 'Lo que encuentras en el panel' }),
    ).not.toBeInTheDocument();
  });
});
