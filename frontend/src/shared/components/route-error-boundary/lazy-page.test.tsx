import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { lazyPage } from '.';

function Page() {
  return <h1>Inventario</h1>;
}

describe('lazyPage', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('shows the loading state and then the page', async () => {
    const LazyInventory = lazyPage(() => Promise.resolve(Page));
    render(<LazyInventory />);

    expect(screen.getByRole('status', { name: 'Cargando' })).toBeInTheDocument();
    expect(await screen.findByRole('heading', { name: 'Inventario' })).toBeInTheDocument();
  });

  it('shows the error state when the chunk fails and retries the import', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const load = vi
      .fn<() => Promise<typeof Page>>()
      .mockRejectedValueOnce(new TypeError('Failed to fetch dynamically imported module'))
      .mockResolvedValueOnce(Page);
    const LazyInventory = lazyPage(load);
    render(<LazyInventory />);

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('No pudimos cargar esta sección.');
    expect(screen.queryByRole('heading', { name: 'Inventario' })).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Reintentar' }));

    expect(await screen.findByRole('heading', { name: 'Inventario' })).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(load).toHaveBeenCalledTimes(2);
  });

  it('keeps a loaded page cached across remounts', async () => {
    const load = vi.fn(() => Promise.resolve(Page));
    const LazyInventory = lazyPage(load);
    const { unmount } = render(<LazyInventory />);
    await screen.findByRole('heading', { name: 'Inventario' });
    unmount();

    render(<LazyInventory />);

    expect(screen.getByRole('heading', { name: 'Inventario' })).toBeInTheDocument();
    expect(load).toHaveBeenCalledTimes(1);
  });
});
