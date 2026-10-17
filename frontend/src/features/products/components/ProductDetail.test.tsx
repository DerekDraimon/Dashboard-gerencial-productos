import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { formatDate } from '../../../shared/format/date';
import { formatMoney } from '../../../shared/format/money';
import type { Product } from '../api/products-api';
import { ProductDetail } from './ProductDetail';

const product: Product = {
  id: 'p1',
  title: 'Silla',
  description: 'Silla de madera maciza',
  price: 1234.5,
  category: 'Muebles',
  images: ['https://example.com/a.png', 'https://example.com/b.png'],
  stock: 7,
  creationAt: '2025-03-07T15:30:00.000Z',
  updatedAt: '2025-04-01T10:00:00.000Z',
};

function detailValue(term: string) {
  const dt = screen.getByText(term, { selector: 'dt' });
  return dt.nextElementSibling?.textContent;
}

describe('ProductDetail', () => {
  it('renders every field formatted', () => {
    render(<ProductDetail product={product} />);

    expect(screen.getByRole('heading', { name: 'Silla' })).toBeInTheDocument();
    expect(screen.getByText('Muebles')).toBeInTheDocument();
    expect(screen.getByText(formatMoney(1234.5).replace(/\s/g, ' '))).toBeInTheDocument();
    expect(screen.getByText('Silla de madera maciza')).toBeInTheDocument();
    expect(detailValue('Stock')).toBe('7 unidades');
    expect(detailValue('Creado')).toBe(formatDate(product.creationAt));
    expect(detailValue('Actualizado')).toBe(formatDate(product.updatedAt));
  });

  it('selects a thumbnail as the main image', () => {
    render(<ProductDetail product={product} />);
    const main = () => screen.getByRole('img', { name: 'Silla' });
    expect(main()).toHaveAttribute('src', 'https://example.com/a.png');

    const gallery = screen.getByRole('group', { name: 'Galería' });
    fireEvent.click(within(gallery).getByRole('button', { name: 'Ver imagen 2' }));

    expect(main()).toHaveAttribute('src', 'https://example.com/b.png');
    expect(within(gallery).getByRole('button', { name: 'Ver imagen 2' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  it('shows the placeholder and no gallery without images', () => {
    render(<ProductDetail product={{ ...product, images: [] }} />);

    expect(screen.getByRole('img', { name: 'Silla' }).tagName).not.toBe('IMG');
    expect(screen.queryByRole('group', { name: 'Galería' })).not.toBeInTheDocument();
  });

  it('says "Al guardar" for the dates of an unsaved product', () => {
    render(
      <ProductDetail
        product={{ ...product, creationAt: undefined, updatedAt: undefined }}
        compact
      />,
    );

    expect(detailValue('Creado')).toBe('Al guardar');
    expect(detailValue('Actualizado')).toBe('Al guardar');
  });
});
