import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { formatDate } from '../../../shared/format/date';
import { formatMoney } from '../../../shared/format/money';
import type { Pagination } from '../../../shared/hooks';
import type { Product } from '../api/products-api';
import { ProductsTable } from './ProductsTable';

const product: Product = {
  id: 'p1',
  title: 'Silla',
  description: 'Silla de madera',
  price: 1234.5,
  category: 'Muebles',
  images: [],
  stock: 7,
  creationAt: '2025-03-07T15:30:00.000Z',
  updatedAt: '2025-03-07T15:30:00.000Z',
};

const pagination = { offset: 0, limit: 10 } as Pagination;

describe('ProductsTable', () => {
  // 1024 px viewport - 248 px sidebar - 2 x 32 px page padding - scrollbar leaves ~695 px.
  it('fits a 1024 px viewport and only scrolls inside its box when narrower', () => {
    render(
      <ProductsTable
        rows={[product]}
        total={1}
        loading={false}
        pagination={pagination}
        emptyMessage="Vacío"
        renderActions={() => null}
      />,
    );

    expect(screen.getByRole('region', { name: 'Productos' })).toHaveStyle({ overflowX: 'auto' });
    const minWidth = parseFloat(getComputedStyle(screen.getByRole('table')).minWidth);
    expect(minWidth).toBeGreaterThan(0);
    expect(minWidth).toBeLessThanOrEqual(690);
  });

  it('renders every column with formatted values and the given actions', () => {
    render(
      <ProductsTable
        rows={[product]}
        total={1}
        loading={false}
        pagination={pagination}
        emptyMessage="Vacío"
        renderActions={(row) => <button type="button">Acción {row.title}</button>}
      />,
    );

    const table = screen.getByRole('table', { name: 'Productos' });
    const headers = within(table)
      .getAllByRole('columnheader')
      .map((header) => header.textContent);
    expect(headers).toEqual([
      'Título',
      'Categoría',
      'Precio',
      'Stock',
      'Fecha de creación',
      'Acciones',
    ]);
    const cells = within(table)
      .getAllByRole('cell')
      .map((cell) => cell.textContent);
    expect(cells).toEqual([
      'Silla',
      'Muebles',
      formatMoney(1234.5),
      '7',
      formatDate(product.creationAt),
      'Acción Silla',
    ]);
    expect(screen.getByRole('img', { name: 'Silla' })).toBeInTheDocument();
    expect(screen.getByText('Mostrando 1–1 de 1')).toBeInTheDocument();
  });
});
