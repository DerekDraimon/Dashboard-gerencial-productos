import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { AxiosAdapter } from 'axios';
import { AxiosError } from 'axios';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it } from 'vitest';
import { httpClient } from '../../../shared/api/http-client';
import type { Product } from '../../products/api/products-api';
import { DashboardPage } from './DashboardPage';

const NBSP = String.fromCharCode(0xa0);

function product(
  id: string,
  title: string,
  category: string,
  price: number,
  stock: number,
  day: string,
): Product {
  const creationAt = `2025-${day}T12:00:00.000Z`;
  return {
    id,
    title,
    description: '',
    price,
    category,
    images: [],
    stock,
    creationAt,
    updatedAt: creationAt,
  };
}

const products = [
  product('p1', 'Sofá', 'Hogar', 1000, 2, '01-01'),
  product('p2', 'Gorra', 'Ropa', 0.1, 9, '02-01'),
  product('p3', 'Camisa', 'Ropa', 0.2, 4, '03-01'),
  product('p4', 'Lámpara', 'Hogar', 234.5, 1, '04-01'),
  product('p5', 'Balón', 'Deportes', 15, 3, '05-01'),
  product('p6', 'Taza', 'Hogar', 5, 1, '06-01'),
];

let catalog: Product[];
let failing: boolean;
let requestCount: number;

beforeEach(() => {
  catalog = products;
  failing = false;
  requestCount = 0;
  const adapter: AxiosAdapter = async (config) => {
    requestCount += 1;
    if (failing) {
      const data = {
        error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' },
      };
      const response = { status: 500, statusText: '', headers: {}, config, data };
      throw new AxiosError('Request failed', AxiosError.ERR_BAD_RESPONSE, config, null, response);
    }
    const data = { data: catalog, meta: { total: catalog.length, offset: 0, limit: 100 } };
    return { status: 200, statusText: '', headers: {}, config, data };
  };
  httpClient.defaults.adapter = adapter;
});

function renderPage() {
  render(
    <MemoryRouter>
      <DashboardPage />
    </MemoryRouter>,
  );
}

const kpi = (name: string) => screen.getByRole('group', { name });

describe('DashboardPage', () => {
  it('shows busy skeletons while the products load', async () => {
    renderPage();

    expect(screen.getByRole('region', { name: 'Indicadores clave' })).toHaveAttribute(
      'aria-busy',
      'true',
    );
    expect(screen.getByRole('table', { name: 'Últimos 5 productos creados' })).toHaveAttribute(
      'aria-busy',
      'true',
    );
    for (const chart of ['Distribución por categoría', 'Top 5 productos más caros']) {
      expect(screen.getByRole('region', { name: chart })).toHaveAttribute('aria-busy', 'true');
    }
    await waitFor(() =>
      expect(screen.getByRole('region', { name: 'Indicadores clave' })).toHaveAttribute(
        'aria-busy',
        'false',
      ),
    );
  });

  it('renders both charts with the computed data', async () => {
    renderPage();

    expect(
      await screen.findByRole('img', {
        name: 'Distribución por categoría: Hogar 50%, Ropa 33,3%, Deportes 16,7%',
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('img', {
        name: `Top 5 productos más caros: Sofá US$${NBSP}1.000,00, Lámpara US$${NBSP}234,50, Balón US$${NBSP}15,00, Taza US$${NBSP}5,00, Camisa US$${NBSP}0,20`,
      }),
    ).toBeInTheDocument();
  });

  it('shows the three KPIs computed from every product', async () => {
    renderPage();

    await waitFor(() => expect(kpi('Total de productos')).toHaveAttribute('aria-busy', 'false'));
    expect(kpi('Total de productos')).toHaveTextContent('6');
    expect(kpi('Total de productos')).toHaveTextContent('Productos registrados');
    expect(kpi('Valor total del inventario')).toHaveTextContent('US$ 1.254,80');
    expect(kpi('Valor total del inventario')).toHaveTextContent(
      'Suma de precios con decimales exactos',
    );
    expect(kpi('Categoría líder')).toHaveTextContent('Ropa');
    expect(kpi('Categoría líder')).toHaveTextContent('Mayor stock: 13 uds.');
  });

  it('lists the 5 latest products with category, price and date', async () => {
    renderPage();

    const table = await screen.findByRole('table', { name: 'Últimos 5 productos creados' });
    await waitFor(() => expect(table).toHaveAttribute('aria-busy', 'false'));
    const rows = within(table).getAllByRole('row').slice(1);

    expect(rows.map((row) => within(row).getAllByRole('cell')[0]?.textContent)).toEqual([
      'Taza',
      'Balón',
      'Lámpara',
      'Camisa',
      'Gorra',
    ]);
    const cells = within(rows[0] as HTMLElement).getAllByRole('cell');
    expect(cells.map((cell) => cell.textContent)).toEqual([
      'Taza',
      'Hogar',
      `US$${NBSP}5,00`,
      '01/06/2025',
    ]);
    expect(screen.getByRole('link', { name: 'Ver inventario' })).toHaveAttribute(
      'href',
      '/inventory',
    );
  });

  it('shows the error and refetches on Reintentar', async () => {
    failing = true;
    renderPage();

    const retry = await screen.findByRole('button', { name: 'Reintentar' });
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Ocurrió un error en el servidor. Inténtalo de nuevo.',
    );
    const requestsBefore = requestCount;

    failing = false;
    await userEvent.click(retry);

    await waitFor(() => expect(kpi('Total de productos')).toHaveTextContent('6'));
    expect(requestCount).toBeGreaterThan(requestsBefore);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('shows the empty state when the catalog has no products', async () => {
    catalog = [];
    renderPage();

    expect(await screen.findByText('Todavía no hay productos')).toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'Indicadores clave' })).not.toBeInTheDocument();
  });
});
