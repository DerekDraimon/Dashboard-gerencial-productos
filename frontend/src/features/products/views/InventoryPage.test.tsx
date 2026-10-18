import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { AxiosAdapter, InternalAxiosRequestConfig } from 'axios';
import { AxiosError } from 'axios';
import { beforeEach, describe, expect, it } from 'vitest';
import { httpClient } from '../../../shared/api/http-client';
import type { UserRole } from '../../../shared/auth/user-role';
import { ConfirmProvider } from '../../../shared/components/confirm-dialog';
import { NotificationProvider } from '../../../shared/feedback/NotificationProvider';
import { AuthContext, type AuthContextValue } from '../../auth/context/auth-context';
import type { Product } from '../api/products-api';
import { InventoryPage } from './InventoryPage';

function makeProducts(count: number): Product[] {
  return Array.from({ length: count }, (_, index) => ({
    id: `p${index}`,
    title: `Producto ${index}`,
    description: 'Descripción',
    ...{ price: 10, category: 'General', images: [], stock: 1 },
    creationAt: '2025-03-07T15:30:00.000Z',
    updatedAt: '2025-03-07T15:30:00.000Z',
  }));
}

let catalog: Product[];
let failing: boolean;
let deleteFails: boolean;
let hangLists: boolean;
let requests: InternalAxiosRequestConfig[];

const ok = (config: InternalAxiosRequestConfig, data: unknown) => ({
  status: 200,
  statusText: '',
  headers: {},
  config,
  data,
});

const adapter: AxiosAdapter = async (config) => {
  if (config.url === '/products/categories') return ok(config, []);
  requests.push(config);
  const id = config.url?.split('/')[2];
  if (config.method === 'delete') {
    if (deleteFails) {
      const data = { error: { code: 'PRODUCT_NOT_FOUND', message: 'El producto no existe.' } };
      const response = { status: 404, statusText: '', headers: {}, config, data };
      throw new AxiosError('Failed', AxiosError.ERR_BAD_REQUEST, config, null, response);
    }
    catalog = catalog.filter((product) => product.id !== id);
    return ok(config, '');
  }
  if (config.method === 'patch') {
    const patch = JSON.parse(config.data as string) as Partial<Product>;
    catalog = catalog.map((product) => (product.id === id ? { ...product, ...patch } : product));
    return ok(
      config,
      catalog.find((product) => product.id === id),
    );
  }
  if (config.method === 'get' && id)
    return ok(
      config,
      catalog.find((product) => product.id === id),
    );
  if (hangLists) return new Promise(() => undefined);
  if (config.method === 'post') {
    const [base] = makeProducts(1) as [Product];
    const created: Product = {
      ...base,
      id: 'new',
      ...(JSON.parse(config.data as string) as object),
    };
    catalog = [created, ...catalog];
    return { status: 201, statusText: '', headers: {}, config, data: created };
  }
  if (failing) {
    const data = { error: { code: 'INTERNAL_ERROR', message: 'No se pudo cargar.' } };
    const response = { status: 500, statusText: '', headers: {}, config, data };
    throw new AxiosError('Failed', AxiosError.ERR_BAD_RESPONSE, config, null, response);
  }
  const { offset, limit } = config.params as { offset: number; limit: number };
  const data = { data: catalog.slice(offset, offset + limit), meta: { total: catalog.length } };
  return { status: 200, statusText: '', headers: {}, config, data };
};

function renderPage(role: UserRole) {
  const auth: AuthContextValue = {
    status: 'authenticated',
    user: { id: 'u1', email: 'a@b.co', name: 'Ana', role, active: true },
    login: () => Promise.reject(new Error('unused')),
    logout: () => undefined,
    refreshUser: () => Promise.resolve(),
  };
  render(
    <NotificationProvider>
      <ConfirmProvider>
        <AuthContext.Provider value={auth}>
          <InventoryPage />
        </AuthContext.Provider>
      </ConfirmProvider>
    </NotificationProvider>,
  );
}

const loaded = () => screen.findByText('Producto 0');

beforeEach(() => {
  catalog = makeProducts(12);
  failing = false;
  deleteFails = false;
  hangLists = false;
  requests = [];
  httpClient.defaults.adapter = adapter;
});

describe('InventoryPage', () => {
  it('gives ADMIN the create button and edit/delete per row', async () => {
    renderPage('ADMIN');
    await loaded();

    expect(screen.getByRole('button', { name: 'Nuevo producto' })).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /^Editar / })).toHaveLength(10);
    expect(screen.getAllByRole('button', { name: /^Eliminar / })).toHaveLength(10);
    expect(screen.queryByRole('button', { name: /^Ver detalle/ })).not.toBeInTheDocument();
  });

  it('creates a product from Nuevo producto and reloads the list', async () => {
    renderPage('ADMIN');
    await loaded();

    await userEvent.click(screen.getByRole('button', { name: 'Nuevo producto' }));
    const dialog = await screen.findByRole('dialog', { name: 'Nuevo producto' });
    await userEvent.type(within(dialog).getByLabelText('Título'), 'Lámpara');
    await userEvent.type(within(dialog).getByLabelText('Precio'), '15');
    await userEvent.type(within(dialog).getByLabelText('Stock'), '2');
    await userEvent.type(within(dialog).getByLabelText('Categoría'), 'Hogar');
    await userEvent.type(within(dialog).getByLabelText('Descripción'), 'Lámpara de mesa');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Guardar producto' }));

    expect(await screen.findByText('Lámpara')).toBeInTheDocument();
    expect(requests.filter((request) => request.method === 'get')).toHaveLength(2);
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('gives USER only the detail action', async () => {
    renderPage('USER');
    await loaded();

    expect(screen.queryByRole('button', { name: 'Nuevo producto' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^Editar / })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^Eliminar / })).not.toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /^Ver detalle/ })).toHaveLength(10);
  });

  it('opens the detail of the chosen row and closes it with the button or Escape', async () => {
    renderPage('USER');
    await loaded();

    await userEvent.click(screen.getByRole('button', { name: 'Ver detalle de Producto 3' }));

    const drawer = await screen.findByRole('dialog', { name: 'Producto 3' });
    expect(within(drawer).getByText('Detalle del producto')).toBeInTheDocument();
    await userEvent.click(within(drawer).getByRole('button', { name: 'Cerrar detalle' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());

    await userEvent.click(screen.getByRole('button', { name: 'Ver detalle de Producto 1' }));
    expect(await screen.findByRole('dialog', { name: 'Producto 1' })).toBeInTheDocument();
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('requests offset 10 for the next page', async () => {
    renderPage('USER');
    await loaded();

    await userEvent.click(screen.getByRole('button', { name: 'Página siguiente' }));

    expect(await screen.findByText('Producto 10')).toBeInTheDocument();
    expect(requests.at(-1)?.params).toEqual({ offset: 10, limit: 10 });
  });

  it('says there are no products yet when the catalog is empty', async () => {
    catalog = [];
    renderPage('ADMIN');

    expect(await screen.findByText('Todavía no hay productos')).toBeInTheDocument();
  });

  it('says nothing matches when filters are set', async () => {
    renderPage('ADMIN');
    await loaded();
    catalog = [];

    fireEvent.change(screen.getByLabelText('Desde'), { target: { value: '2025-01-01' } });

    expect(
      await screen.findByText('No hay productos que coincidan con los filtros'),
    ).toBeInTheDocument();
  });

  it('shows the error and retries', async () => {
    failing = true;
    renderPage('ADMIN');

    const retry = await screen.findByRole('button', { name: 'Reintentar' });
    failing = false;
    await userEvent.click(retry);

    await waitFor(() => expect(screen.getByText('Producto 0')).toBeInTheDocument());
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  describe('edit and delete', () => {
    const lists = () => requests.filter((request) => request.url === '/products');
    const confirmDialog = () =>
      screen.findByRole('alertdialog', { name: '¿Eliminar este producto?' });

    it('edits a row with prefilled data and reloads the list', async () => {
      renderPage('ADMIN');
      await loaded();

      await userEvent.click(screen.getByRole('button', { name: 'Editar Producto 2' }));
      const dialog = await screen.findByRole('dialog', { name: 'Editar producto' });
      const title = await within(dialog).findByDisplayValue('Producto 2');
      await userEvent.clear(title);
      await userEvent.type(title, 'Producto editado');
      await userEvent.click(within(dialog).getByRole('button', { name: 'Guardar cambios' }));

      expect(await screen.findByText('Producto editado')).toBeInTheDocument();
      expect(requests.find((request) => request.method === 'patch')?.data).toBe(
        JSON.stringify({ title: 'Producto editado' }),
      );
      expect(lists()).toHaveLength(2);
    });

    it('removes the row at once after confirming, then reloads', async () => {
      renderPage('ADMIN');
      await loaded();
      hangLists = true;

      await userEvent.click(screen.getByRole('button', { name: 'Eliminar Producto 1' }));
      const dialog = await confirmDialog();
      expect(dialog).toHaveTextContent('Producto 1');
      expect(dialog).toHaveTextContent('Esta acción no se puede deshacer.');
      await userEvent.click(within(dialog).getByRole('button', { name: 'Eliminar' }));

      expect(await screen.findByText('Producto eliminado')).toBeInTheDocument();
      expect(screen.queryByText('Producto 1')).not.toBeInTheDocument();
      expect(screen.getByText('Producto 0')).toBeInTheDocument();
      expect(requests.some((request) => request.method === 'delete')).toBe(true);
      expect(lists()).toHaveLength(2);
    });

    it('does nothing when the delete is canceled', async () => {
      renderPage('ADMIN');
      await loaded();

      await userEvent.click(screen.getByRole('button', { name: 'Eliminar Producto 1' }));
      await userEvent.click(
        within(await confirmDialog()).getByRole('button', { name: 'Cancelar' }),
      );

      await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument());
      expect(requests.some((request) => request.method === 'delete')).toBe(false);
      expect(screen.getByText('Producto 1')).toBeInTheDocument();
    });

    it('keeps the row and shows the error when the delete fails', async () => {
      deleteFails = true;
      renderPage('ADMIN');
      await loaded();

      await userEvent.click(screen.getByRole('button', { name: 'Eliminar Producto 1' }));
      await userEvent.click(
        within(await confirmDialog()).getByRole('button', { name: 'Eliminar' }),
      );

      expect(await screen.findByText('El producto no existe.')).toBeInTheDocument();
      expect(screen.getByText('Producto 1')).toBeInTheDocument();
      expect(lists()).toHaveLength(1);
    });

    it('goes back a page after deleting the only row of the last page', async () => {
      catalog = makeProducts(11);
      renderPage('ADMIN');
      await loaded();
      await userEvent.click(screen.getByRole('button', { name: 'Página siguiente' }));
      await screen.findByText('Producto 10');

      await userEvent.click(screen.getByRole('button', { name: 'Eliminar Producto 10' }));
      await userEvent.click(
        within(await confirmDialog()).getByRole('button', { name: 'Eliminar' }),
      );

      expect(await screen.findByText('Producto 0')).toBeInTheDocument();
      expect(lists().at(-1)?.params).toEqual({ offset: 0, limit: 10 });
    });
  });
});
