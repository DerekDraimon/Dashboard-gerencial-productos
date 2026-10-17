import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { AxiosAdapter, InternalAxiosRequestConfig } from 'axios';
import { AxiosError } from 'axios';
import { beforeEach, describe, expect, it } from 'vitest';
import { httpClient } from '../../../shared/api/http-client';
import type { UserRole } from '../../../shared/auth/user-role';
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
let requests: InternalAxiosRequestConfig[];

const adapter: AxiosAdapter = async (config) => {
  requests.push(config);
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
  };
  render(
    <AuthContext.Provider value={auth}>
      <InventoryPage />
    </AuthContext.Provider>,
  );
}

const loaded = () => screen.findByText('Producto 0');

beforeEach(() => {
  catalog = makeProducts(12);
  failing = false;
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

  it('gives USER only the detail action', async () => {
    renderPage('USER');
    await loaded();

    expect(screen.queryByRole('button', { name: 'Nuevo producto' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^Editar / })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^Eliminar / })).not.toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /^Ver detalle/ })).toHaveLength(10);
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
});
