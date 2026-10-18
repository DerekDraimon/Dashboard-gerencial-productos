import { describe, expect, it } from 'vitest';
import { sumMoney } from '../../../shared/format/money';
import type { Product } from '../../products/api/products-api';
import {
  categoryDistribution,
  computeDashboardMetrics,
  countProducts,
  inventoryValue,
  latestCreated,
  leaderCategory,
  topExpensive,
} from './dashboard-metrics';

let nextId = 0;
function product(overrides: Partial<Product> = {}): Product {
  nextId += 1;
  return {
    id: `p${String(nextId).padStart(3, '0')}`,
    title: `Producto ${nextId}`,
    description: 'Descripción',
    price: 10,
    category: 'General',
    images: [],
    stock: 1,
    creationAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
    ...overrides,
  };
}

const titles = (products: Product[]) => products.map(({ title }) => title);

describe('countProducts', () => {
  it('counts every product', () => {
    expect(countProducts([product(), product(), product()])).toBe(3);
    expect(countProducts([])).toBe(0);
  });
});

describe('inventoryValue', () => {
  it('sums prices exactly with Decimal', () => {
    expect(inventoryValue([product({ price: 0.1 }), product({ price: 0.2 })]).toString()).toBe(
      '0.3',
    );
  });

  it('sums the literal prices of many items, ignoring stock', () => {
    const products = Array.from({ length: 500 }, () => product({ price: 19.99, stock: 7 }));

    expect(inventoryValue(products).toString()).toBe('9995');
  });

  it('is 0 without products', () => {
    expect(inventoryValue([]).toString()).toBe('0');
  });
});

describe('leaderCategory', () => {
  it('picks the category with the most total stock, not the most products', () => {
    const products = [
      product({ category: 'Ropa', stock: 1 }),
      product({ category: 'Ropa', stock: 1 }),
      product({ category: 'Ropa', stock: 1 }),
      product({ category: 'Hogar', stock: 10 }),
    ];

    expect(leaderCategory(products)).toEqual({ category: 'Hogar', stock: 10 });
  });

  it('breaks ties alphabetically', () => {
    const products = [
      product({ category: 'Zapatos', stock: 5 }),
      product({ category: 'Electrónica', stock: 5 }),
      product({ category: 'Accesorios', stock: 2 }),
      product({ category: 'Accesorios', stock: 3 }),
    ];

    expect(leaderCategory(products)).toEqual({ category: 'Accesorios', stock: 5 });
  });

  it('is null without products', () => {
    expect(leaderCategory([])).toBeNull();
  });
});

describe('categoryDistribution', () => {
  it('counts products per category sorted by count, then name', () => {
    const products = [
      product({ category: 'Ropa' }),
      product({ category: 'Hogar' }),
      product({ category: 'Ropa' }),
      product({ category: 'Deportes' }),
    ];

    expect(categoryDistribution(products)).toEqual([
      { category: 'Ropa', count: 2, percent: 50 },
      { category: 'Deportes', count: 1, percent: 25 },
      { category: 'Hogar', count: 1, percent: 25 },
    ]);
  });

  it('adjusts the rounding so a 1/3 split sums to exactly 100', () => {
    const distribution = categoryDistribution([
      product({ category: 'C' }),
      product({ category: 'A' }),
      product({ category: 'B' }),
    ]);

    expect(distribution.map(({ percent }) => percent)).toEqual([33.4, 33.3, 33.3]);
    expect(sumMoney(distribution.map(({ percent }) => percent)).toString()).toBe('100');
  });

  it('keeps one decimal and sums to 100 for uneven splits', () => {
    const products = [
      ...Array.from({ length: 5 }, () => product({ category: 'A' })),
      ...Array.from({ length: 1 }, () => product({ category: 'B' })),
      ...Array.from({ length: 1 }, () => product({ category: 'C' })),
    ];

    const percents = categoryDistribution(products).map(({ percent }) => percent);

    expect(percents).toEqual([71.4, 14.3, 14.3]);
    expect(sumMoney(percents).toString()).toBe('100');
  });

  it('is empty without products', () => {
    expect(categoryDistribution([])).toEqual([]);
  });
});

describe('topExpensive', () => {
  it('returns the 5 most expensive by price desc, ties by title, without mutating', () => {
    const products = Object.freeze([
      product({ title: 'Lámpara', price: 30 }),
      product({ title: 'Mesa', price: 120 }),
      product({ title: 'Cojín', price: 15 }),
      product({ title: 'Silla', price: 80 }),
      product({ title: 'Banco', price: 80 }),
      product({ title: 'Sofá', price: 450 }),
      product({ title: 'Florero', price: 22.5 }),
    ]);
    const before = [...products];

    expect(titles(topExpensive(products, 5))).toEqual([
      'Sofá',
      'Mesa',
      'Banco',
      'Silla',
      'Lámpara',
    ]);
    expect(products).toEqual(before);
  });

  it('returns every product when there are fewer than 5', () => {
    const products = [product({ title: 'A', price: 1 }), product({ title: 'B', price: 2 })];

    expect(titles(topExpensive(products, 5))).toEqual(['B', 'A']);
    expect(topExpensive([], 5)).toEqual([]);
  });
});

describe('latestCreated', () => {
  it('returns the 5 most recent from unsorted input, ties by id, without mutating', () => {
    const products = Object.freeze([
      product({ id: 'a', title: 'Enero', creationAt: '2025-01-10T00:00:00.000Z' }),
      product({ id: 'b', title: 'Junio', creationAt: '2025-06-01T00:00:00.000Z' }),
      product({ id: 'c', title: 'Marzo', creationAt: '2025-03-05T00:00:00.000Z' }),
      product({ id: 'e', title: 'Mayo E', creationAt: '2025-05-20T12:00:00.000Z' }),
      product({ id: 'd', title: 'Mayo D', creationAt: '2025-05-20T12:00:00.000Z' }),
      product({ id: 'f', title: 'Febrero', creationAt: '2025-02-14T00:00:00.000Z' }),
    ]);

    expect(titles(latestCreated(products, 5))).toEqual([
      'Junio',
      'Mayo D',
      'Mayo E',
      'Marzo',
      'Febrero',
    ]);
    expect(titles([...products])).toEqual([
      'Enero',
      'Junio',
      'Marzo',
      'Mayo E',
      'Mayo D',
      'Febrero',
    ]);
  });

  it('sorts invalid creation dates last, ordered by id, whatever the input order', () => {
    const products = [
      product({ id: '0x', title: 'Inválida X', creationAt: 'not-a-date' }),
      product({ id: 'a', title: 'Enero', creationAt: '2025-01-10T00:00:00.000Z' }),
      product({ id: '0w', title: 'Inválida W', creationAt: '' }),
      product({ id: 'b', title: 'Junio', creationAt: '2025-06-01T00:00:00.000Z' }),
    ];
    const expected = ['Junio', 'Enero', 'Inválida W', 'Inválida X'];

    expect(titles(latestCreated(products))).toEqual(expected);
    expect(titles(latestCreated([...products].reverse()))).toEqual(expected);
  });
});

describe('computeDashboardMetrics', () => {
  it('returns zeros, null and empty lists without products', () => {
    const metrics = computeDashboardMetrics([]);

    expect(metrics.totalProducts).toBe(0);
    expect(metrics.inventoryValue.toString()).toBe('0');
    expect(metrics.leaderCategory).toBeNull();
    expect(metrics.categoryDistribution).toEqual([]);
    expect(metrics.topExpensive).toEqual([]);
    expect(metrics.latestCreated).toEqual([]);
  });

  it('aggregates every metric', () => {
    const products = [
      product({ title: 'Sofá', category: 'Hogar', price: 0.1, stock: 2 }),
      product({ title: 'Gorra', category: 'Ropa', price: 0.2, stock: 9 }),
    ];

    const metrics = computeDashboardMetrics(products);

    expect(metrics.totalProducts).toBe(2);
    expect(metrics.inventoryValue.toString()).toBe('0.3');
    expect(metrics.leaderCategory).toEqual({ category: 'Ropa', stock: 9 });
    expect(metrics.categoryDistribution).toHaveLength(2);
    expect(titles(metrics.topExpensive)).toEqual(['Gorra', 'Sofá']);
    expect(metrics.latestCreated).toHaveLength(2);
  });
});
