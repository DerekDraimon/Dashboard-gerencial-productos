import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { Product } from '../../products/api/products-api';
import type { CategoryShare } from '../metrics/dashboard-metrics';
import { CategoryDonut } from './CategoryDonut';
import { TopPricesChart } from './TopPricesChart';

const NBSP = String.fromCharCode(0xa0);

const shares: CategoryShare[] = [
  { category: 'Electrónica', count: 3, percent: 33.4 },
  { category: 'Libros', count: 3, percent: 33.3 },
  { category: 'Hogar', count: 3, percent: 33.3 },
];

function product(title: string, price: number): Product {
  return {
    id: title,
    title,
    description: '',
    price,
    category: 'General',
    images: [],
    stock: 1,
    creationAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
  };
}

const expensive = [
  product('Sofá', 1329.99),
  product('Mesa', 450),
  product('Silla', 120.5),
  product('Lámpara', 80),
  product('Taza', 5),
];

describe('CategoryDonut', () => {
  it('lists every category with its percent in order', () => {
    render(<CategoryDonut distribution={shares} />);

    expect(screen.getByRole('heading', { name: 'Distribución por categoría' })).toBeInTheDocument();
    expect(screen.getByText('Proporción de productos por categoría')).toBeInTheDocument();
    const items = within(screen.getByRole('list', { name: 'Leyenda de categorías' })).getAllByRole(
      'listitem',
    );
    expect(items.map((item) => item.textContent)).toEqual([
      'Electrónica33,4%',
      'Libros33,3%',
      'Hogar33,3%',
    ]);
  });

  it('summarizes the distribution for screen readers', () => {
    render(<CategoryDonut distribution={shares} />);

    expect(
      screen.getByRole('img', {
        name: 'Distribución por categoría: Electrónica 33,4%, Libros 33,3%, Hogar 33,3%',
      }),
    ).toBeInTheDocument();
  });

  it('shows a busy skeleton while loading', () => {
    render(<CategoryDonut distribution={[]} loading />);

    expect(screen.getByRole('region', { name: 'Distribución por categoría' })).toHaveAttribute(
      'aria-busy',
      'true',
    );
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });
});

describe('TopPricesChart', () => {
  it('shows the titles and formatted prices in price order', () => {
    const { container } = render(<TopPricesChart products={expensive} />);

    expect(screen.getByRole('heading', { name: 'Top 5 productos más caros' })).toBeInTheDocument();
    expect(screen.getByText('Precio por producto')).toBeInTheDocument();
    const texts = [...container.querySelectorAll('.recharts-cartesian-axis-tick-value')].map(
      (tick) => tick.textContent,
    );
    expect(texts).toEqual([
      'Sofá',
      'Mesa',
      'Silla',
      'Lámpara',
      'Taza',
      `US$${NBSP}1.329,99`,
      `US$${NBSP}450,00`,
      `US$${NBSP}120,50`,
      `US$${NBSP}80,00`,
      `US$${NBSP}5,00`,
    ]);
  });

  it('summarizes the prices for screen readers', () => {
    render(<TopPricesChart products={expensive.slice(0, 2)} />);

    expect(
      screen.getByRole('img', {
        name: `Top 5 productos más caros: Sofá US$${NBSP}1.329,99, Mesa US$${NBSP}450,00`,
      }),
    ).toBeInTheDocument();
  });

  it('shows only the products that exist when there are fewer than 5', () => {
    const { container } = render(<TopPricesChart products={expensive.slice(0, 2)} />);

    expect(container.querySelectorAll('.recharts-bar-rectangle')).toHaveLength(2);
  });

  it('shows a busy skeleton while loading', () => {
    render(<TopPricesChart products={[]} loading />);

    expect(screen.getByRole('region', { name: 'Top 5 productos más caros' })).toHaveAttribute(
      'aria-busy',
      'true',
    );
  });
});
