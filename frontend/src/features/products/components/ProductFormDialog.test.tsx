import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
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
let loadFails: boolean;

const adapter: AxiosAdapter = async (config) => {
  if (config.url === '/products/categories') {
    return { status: 200, statusText: '', headers: {}, config, data: ['Hogar', 'Muebles'] };
  }
  if (config.method === 'get') {
    if (loadFails) throw new AxiosError('Failed', AxiosError.ERR_NETWORK, config);
    return { status: 200, statusText: '', headers: {}, config, data: created };
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
  loadFails = false;
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

  it.each(['1.5', '9007199254740992'])('rejects the stock %s', async (stock) => {
    renderDialog();

    await userEvent.type(field('Stock'), stock);
    await save();

    expect(
      await screen.findByText('El stock debe ser un número entero mayor o igual a 0.'),
    ).toBeInTheDocument();
  });

  it('accepts a comma as the decimal separator', async () => {
    const { onSaved } = renderDialog();

    await fillValid();
    await userEvent.clear(field('Precio'));
    await userEvent.type(field('Precio'), '24,99');
    await save();

    await waitFor(() => expect(onSaved).toHaveBeenCalled());
    expect(JSON.parse(posts[0]?.data as string)).toMatchObject({ price: 24.99 });
  });

  it('maps every valid detail to its field and toasts the ones without a field', async () => {
    postError = {
      status: 400,
      body: {
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Datos inválidos',
          details: [
            { path: 'title', message: 'Título repetido.' },
            { path: 'price', message: 'Precio fuera de rango.' },
            { path: 'color', message: 'Campo no permitido.' },
            { path: 5, message: 'Ruta inválida.' },
            null,
          ],
        },
      },
    };
    renderDialog();

    await fillValid();
    await save();

    expect(await screen.findByText('Título repetido.')).toBeInTheDocument();
    expect(screen.getByText('Precio fuera de rango.')).toBeInTheDocument();
    expect(await screen.findByText('Campo no permitido.')).toBeInTheDocument();
    expect(screen.queryByText('Ruta inválida.')).not.toBeInTheDocument();
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

  describe('images and preview', () => {
    const preview = () => screen.getByRole('complementary', { name: 'Vista previa del detalle' });

    async function addImage(url: string) {
      await userEvent.type(field('URL de imagen'), url);
      await userEvent.click(screen.getByRole('button', { name: 'Agregar' }));
    }

    it('reflects the typed title, price and category in the preview', async () => {
      renderDialog();

      await userEvent.type(field('Título'), 'Lámpara');
      await userEvent.type(field('Precio'), '15');
      await userEvent.type(field('Categoría'), 'Hogar');

      expect(within(preview()).getByRole('heading', { name: 'Lámpara' })).toBeInTheDocument();
      expect(preview()).toHaveTextContent(/US\$\s15,00/);
      expect(within(preview()).getByText('Hogar')).toBeInTheDocument();
      expect(within(preview()).getAllByText('Al guardar')).toHaveLength(2);
    });

    it('reads a comma price in the preview', async () => {
      renderDialog();

      await userEvent.type(field('Precio'), '24,99');

      expect(preview()).toHaveTextContent(/US\$\s24,99/);
    });

    it('shows an added url in the list and in the preview', async () => {
      renderDialog();
      await userEvent.type(field('Título'), 'Lámpara');

      await addImage('https://example.com/a.png');

      expect(screen.getByRole('list', { name: 'Imágenes agregadas' })).toHaveTextContent(
        'https://example.com/a.png',
      );
      expect(within(preview()).getByRole('img', { name: 'Lámpara' })).toHaveAttribute(
        'src',
        'https://example.com/a.png',
      );
    });

    it('adds with Enter in the url input without submitting the form', async () => {
      renderDialog();

      await userEvent.type(field('URL de imagen'), 'https://example.com/a.png{Enter}');

      expect(screen.getByRole('list', { name: 'Imágenes agregadas' })).toHaveTextContent(
        'https://example.com/a.png',
      );
      expect(screen.queryByText('El título es obligatorio.')).not.toBeInTheDocument();
      expect(posts).toHaveLength(0);
    });

    it('shows No carga and the preview placeholder for a broken image', async () => {
      renderDialog();
      await userEvent.type(field('Título'), 'Lámpara');
      await addImage('https://example.com/rota.png');

      document
        .querySelectorAll('img[src="https://example.com/rota.png"]')
        .forEach((image) => fireEvent.error(image));

      expect(screen.getByText('No carga')).toBeInTheDocument();
      expect(within(preview()).getByRole('img', { name: 'Lámpara' }).tagName).not.toBe('IMG');
    });

    it('sends the images array on submit', async () => {
      const { onSaved } = renderDialog();
      await fillValid();
      await addImage('https://example.com/a.png');
      await addImage('https://example.com/b.png');

      await save();

      await waitFor(() => expect(onSaved).toHaveBeenCalled());
      expect(JSON.parse(posts[0]?.data as string)).toMatchObject({
        images: ['https://example.com/a.png', 'https://example.com/b.png'],
      });
    });
  });

  describe('edit mode', () => {
    function renderEdit() {
      const onClose = vi.fn();
      const onSaved = vi.fn();
      render(
        <NotificationProvider>
          <ProductFormDialog open mode="edit" productId="p9" onClose={onClose} onSaved={onSaved} />
        </NotificationProvider>,
      );
      return { onClose, onSaved };
    }
    const saveChanges = () =>
      userEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }));

    it('loads the product and prefills the form', async () => {
      renderEdit();

      expect(screen.getByRole('dialog', { name: 'Editar producto' })).toBeInTheDocument();
      expect(await screen.findByDisplayValue('Silla')).toBe(field('Título'));
      expect(field('Precio')).toHaveValue('24.50');
      expect(field('Stock')).toHaveValue('3');
      expect(field('Categoría')).toHaveValue('Muebles');
      expect(field('Descripción')).toHaveValue('Silla de madera');
    });

    it('sends only the changed fields', async () => {
      const { onClose, onSaved } = renderEdit();
      await screen.findByDisplayValue('Silla');

      await userEvent.clear(field('Precio'));
      await userEvent.type(field('Precio'), '30');
      await saveChanges();

      await waitFor(() => expect(onSaved).toHaveBeenCalledWith(created));
      expect(posts[0]?.method).toBe('patch');
      expect(posts[0]?.url).toBe('/products/p9');
      expect(JSON.parse(posts[0]?.data as string)).toEqual({ price: 30 });
      expect(await screen.findByText('Producto actualizado')).toBeInTheDocument();
      expect(onClose).toHaveBeenCalled();
    });

    it('closes without a request when nothing changed', async () => {
      const { onClose, onSaved } = renderEdit();
      await screen.findByDisplayValue('Silla');

      await saveChanges();

      await waitFor(() => expect(onClose).toHaveBeenCalled());
      expect(posts).toHaveLength(0);
      expect(onSaved).not.toHaveBeenCalled();
    });

    it('shows the load error and retries', async () => {
      loadFails = true;
      renderEdit();

      const retry = await screen.findByRole('button', { name: 'Reintentar' });
      loadFails = false;
      await userEvent.click(retry);

      expect(await screen.findByDisplayValue('Silla')).toBe(field('Título'));
    });
  });
});
