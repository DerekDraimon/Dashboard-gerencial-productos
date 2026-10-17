import { act, cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { NAVIGATION_ITEMS } from '../shared/layout/navigation';
import { AppProviders } from './providers';
import { routes } from './routes';

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

function resizableViewport(initiallyDesktop: boolean) {
  let isDesktop = initiallyDesktop;
  const listeners = new Set<() => void>();
  vi.stubGlobal('matchMedia', (query: string) => ({
    get matches() {
      return isDesktop;
    },
    media: query,
    onchange: null,
    addListener: (listener: () => void) => listeners.add(listener),
    removeListener: (listener: () => void) => listeners.delete(listener),
    addEventListener: (_type: string, listener: () => void) => listeners.add(listener),
    removeEventListener: (_type: string, listener: () => void) => listeners.delete(listener),
    dispatchEvent: () => false,
  }));
  return (desktop: boolean) => {
    isDesktop = desktop;
    act(() => listeners.forEach((listener) => listener()));
  };
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

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('app routes', () => {
  it('redirects the root to the dashboard inside the layout', async () => {
    setViewport(true);
    const router = renderAt('/');

    expect(await screen.findByRole('heading', { name: 'Dashboard' })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/dashboard');
    expect(screen.getByText('Resumen del inventario')).toBeInTheDocument();
    const nav = screen.getByRole('navigation', { name: 'Navegación principal' });
    expect(within(nav).getByText('Gerencial')).toBeInTheDocument();
    expect(within(nav).getByRole('link', { name: 'Dashboard' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(screen.queryByRole('button', { name: 'Abrir menú' })).not.toBeInTheDocument();
  });

  it('navigates from the sidebar and marks the active item', async () => {
    setViewport(true);
    const router = renderAt('/dashboard');

    await userEvent.click(await screen.findByRole('link', { name: 'Inventario' }));

    expect(router.state.location.pathname).toBe('/inventory');
    expect(screen.getByRole('heading', { name: 'Inventario' })).toBeInTheDocument();
    expect(screen.getByText('Gestiona los productos de la tienda')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Inventario' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(screen.getByRole('link', { name: 'Dashboard' })).not.toHaveAttribute('aria-current');
  });

  it('shows the not found page with a link back to the dashboard', async () => {
    setViewport(true);
    const router = renderAt('/no-existe');

    expect(
      await screen.findByRole('heading', { name: 'Página no encontrada' }),
    ).toBeInTheDocument();

    await userEvent.click(screen.getByRole('link', { name: 'Volver al dashboard' }));

    expect(router.state.location.pathname).toBe('/dashboard');
    expect(screen.getByRole('heading', { name: 'Dashboard' })).toBeInTheDocument();
  });

  it('opens the drawer from the menu button on phones and closes it after navigating', async () => {
    setViewport(false);
    const router = renderAt('/dashboard');

    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();

    await userEvent.click(await screen.findByRole('button', { name: 'Abrir menú' }));
    const nav = await screen.findByRole('navigation', { name: 'Navegación principal' });
    await userEvent.click(within(nav).getByRole('link', { name: 'Usuarios' }));

    expect(router.state.location.pathname).toBe('/users');
    await waitFor(() => expect(screen.queryByRole('navigation')).not.toBeInTheDocument());
    expect(screen.getByRole('heading', { name: 'Usuarios' })).toBeInTheDocument();
  });

  it('declares a route for every navigation item', async () => {
    setViewport(true);

    for (const item of NAVIGATION_ITEMS) {
      const router = renderAt(item.path);

      expect(await screen.findByRole('heading', { name: item.title })).toBeInTheDocument();
      expect(router.state.location.pathname).toBe(item.path);
      expect(
        screen.queryByRole('heading', { name: 'Página no encontrada' }),
      ).not.toBeInTheDocument();
      cleanup();
    }
  });

  it('closes the drawer when the viewport grows to desktop', async () => {
    const resize = resizableViewport(false);
    renderAt('/dashboard');

    await userEvent.click(await screen.findByRole('button', { name: 'Abrir menú' }));
    expect(await screen.findByRole('navigation')).toBeInTheDocument();

    resize(true);
    expect(screen.queryByRole('button', { name: 'Abrir menú' })).not.toBeInTheDocument();

    resize(false);
    await waitFor(() => expect(screen.queryByRole('navigation')).not.toBeInTheDocument());
    expect(screen.getByRole('button', { name: 'Abrir menú' })).toBeInTheDocument();
  });
});
