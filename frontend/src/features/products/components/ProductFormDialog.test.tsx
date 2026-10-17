import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { AxiosAdapter, InternalAxiosRequestConfig } from 'axios';
import { AxiosError } from 'axios';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { httpClient } from '../../../shared/api/http-client';
import { NotificationProvider } from '../../../shared/feedback/NotificationProvider';
import type { Product } from '../api/products-api';
import { ProductFormDialog } from './ProductFormDialog';

const created: Product = {
  id: 'p9',
  title: 'Silla',
  description: 'Silla de madera',
  price: 24.5,
  category: 'Muebles',
  images: [],
  stock: 3,
  creationAt: '2025-03-07T15:30:00.000Z',
  updatedAt: '2025-03-07T15:30:00.000Z',
};

let posts: InternalAxiosRequestConfig[];
let postError: { status: number; body: unknown } | null;

const adapter: AxiosAdapter = async (config) => {
  if (config.url === '/products/categories') {
    return { status: 200, statusText: '', headers: {}, config, data: ['Hogar', 'Muebles'] };
  }
  posts.push(config);
  if (postError) {
    const response = { status: postError.status, statusText: '', headers: {}, config };
    throw new AxiosError('Failed', AxiosError.ERR_BAD_REQUEST, config, null, {
      ...response,
      data: postError.body,
    });
  }
  return { status: 201, statusText: '', headers: {}, config, data: created };
};

function renderDialog() {
  const onClose = vi.fn();
  const onSaved = vi.fn();
  render(
    <NotificationProvider>
      <ProductFormDialog open mode="create" onClose={onClose} onSaved={onSaved} />
    </NotificationProvider>,
  );
  return { onClose, onSaved };
}

const field = (label: string) => screen.getByLabelText(label);
const save = () => userEvent.click(screen.getByRole('button', { name: 'Guardar producto' }));

async function fillValid() {
  await userEvent.type(field('Título'), '  Silla ');
  await userEvent.type(field('Precio'), '24.5');
  await userEvent.type(field('Stock'), '3');
  await userEvent.type(field('Categoría'), 'Muebles');
  await userEvent.type(field('Descripción'), 'Silla de madera');
}

beforeEach(() => {
  posts = [];
  postError = null;
  httpClient.defaults.adapter = adapter;
});

describe('ProductFormDialog', () => {
  it('shows the required messages on an empty submit and sends nothing', async () => {
    renderDialog();

    await save();

    for (const message of [
      'El título es obligatorio.',
      'El precio debe ser mayor a 0.',
      'El stock debe ser un número entero mayor o igual a 0.',
      'La categoría es obligatoria.',
      'La descripción es obligatoria.',
    ]) {
      expect(await screen.findByText(message)).toBeInTheDocument();
    }
    expect(posts).toHaveLength(0);
  });

  it.each([
    ['0', 'El precio debe ser mayor a 0.'],
    ['-1', 'El precio debe ser mayor a 0.'],
    ['1.234', 'Usa máximo 2 decimales.'],
  ])('rejects the price %s', async (price, message) => {
    renderDialog();

    await userEvent.type(field('Precio'), price);
    await save();

    expect(await screen.findByText(message)).toBeInTheDocument();
  });

  it('rejects a fractional stock', async () => {
    renderDialog();

    await userEvent.type(field('Stock'), '1.5');
    await save();

    expect(
      await screen.findByText('El stock debe ser un número entero mayor o igual a 0.'),
    ).toBeInTheDocument();
  });

  it('creates the product with the exact payload, then notifies and closes', async () => {
    const { onClose, onSaved } = renderDialog();

    await fillValid();
    await save();

    await waitFor(() => expect(onSaved).toHaveBeenCalledWith(created));
    expect(JSON.parse(posts[0]?.data as string)).toEqual({
      title: 'Silla',
      description: 'Silla de madera',
      price: 24.5,
      category: 'Muebles',
      images: [],
      stock: 3,
    });
    expect(await screen.findByText('Producto creado')).toBeInTheDocument();
    expect(onClose).toHaveBeenCalled();
  });

  it('puts backend validation details on their fields', async () => {
    postError = {
      status: 400,
      body: {
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Datos inválidos',
          details: [{ path: 'title', message: 'Ese título no es válido.' }],
        },
      },
    };
    const { onClose } = renderDialog();

    await fillValid();
    await save();

    expect(await screen.findByText('Ese título no es válido.')).toBeInTheDocument();
    expect(field('Título')).toHaveAttribute('aria-invalid', 'true');
    expect(onClose).not.toHaveBeenCalled();
  });

  it('shows an error toast for other failures and stays open', async () => {
    postError = {
      status: 500,
      body: { error: { code: 'INTERNAL_ERROR', message: 'Falló el servidor.' } },
    };
    const { onClose, onSaved } = renderDialog();

    await fillValid();
    await save();

    expect(await screen.findByText('Falló el servidor.')).toBeInTheDocument();
    expect(onSaved).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByRole('dialog', { name: 'Nuevo producto' })).toBeInTheDocument();
  });

  it('offers the existing categories and accepts a new one', async () => {
    renderDialog();

    await userEvent.click(field('Categoría'));
    const listbox = await screen.findByRole('listbox');
    expect(
      within(listbox)
        .getAllByRole('option')
        .map((option) => option.textContent),
    ).toEqual(['Hogar', 'Muebles']);
    await userEvent.click(within(listbox).getByRole('option', { name: 'Hogar' }));
    expect(field('Categoría')).toHaveValue('Hogar');

    await userEvent.clear(field('Categoría'));
    await userEvent.type(field('Categoría'), 'Jardín');
    await userEvent.keyboard('{Escape}');
    expect(field('Categoría')).toHaveValue('Jardín');
  });
});
