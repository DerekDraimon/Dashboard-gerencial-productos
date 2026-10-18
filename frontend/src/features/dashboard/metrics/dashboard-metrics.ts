import type Decimal from 'decimal.js';
import { sumMoney } from '../../../shared/format/money';
import type { Product } from '../../products/api/products-api';

export interface CategoryStock {
  category: string;
  stock: number;
}

export interface CategoryShare {
  category: string;
  count: number;
  percent: number;
}

export interface DashboardMetrics {
  totalProducts: number;
  inventoryValue: Decimal;
  leaderCategory: CategoryStock | null;
  categoryDistribution: CategoryShare[];
  topExpensive: Product[];
  latestCreated: Product[];
}

const TOP_SIZE = 5;

const byName = (a: string, b: string) => a.localeCompare(b, 'es');

function totalsByCategory(
  products: readonly Product[],
  amount: (product: Product) => number,
): Map<string, number> {
  return products.reduce(
    (totals, product) =>
      totals.set(product.category, (totals.get(product.category) ?? 0) + amount(product)),
    new Map<string, number>(),
  );
}

export function countProducts(products: readonly Product[]): number {
  return products.length;
}

export function inventoryValue(products: readonly Product[]): Decimal {
  return sumMoney(products.map(({ price }) => price));
}

/** The leader is the category with the most total stock (not the most products); ties go to the alphabetically first. */
export function leaderCategory(products: readonly Product[]): CategoryStock | null {
  return [...totalsByCategory(products, ({ stock }) => stock)].reduce<CategoryStock | null>(
    (leader, [category, stock]) =>
      !leader ||
      stock > leader.stock ||
      (stock === leader.stock && byName(category, leader.category) < 0)
        ? { category, stock }
        : leader,
    null,
  );
}

/**
 * Percents keep one decimal and always sum to exactly 100: tenths are floored and the missing
 * ones go to the largest remainders (largest remainder method).
 */
export function categoryDistribution(products: readonly Product[]): CategoryShare[] {
  const total = products.length;
  const shares = [...totalsByCategory(products, () => 1)]
    .map(([category, count]) => ({ category, count, tenths: (count * 1000) / total }))
    .sort((a, b) => b.count - a.count || byName(a.category, b.category));
  const missing = 1000 - shares.reduce((sum, { tenths }) => sum + Math.floor(tenths), 0);
  const roundedUp = new Set(
    [...shares]
      .sort((a, b) => (b.tenths % 1) - (a.tenths % 1))
      .slice(0, missing)
      .map(({ category }) => category),
  );
  return shares.map(({ category, count, tenths }) => ({
    category,
    count,
    percent: (Math.floor(tenths) + (roundedUp.has(category) ? 1 : 0)) / 10,
  }));
}

export function topExpensive(products: readonly Product[], size = TOP_SIZE): Product[] {
  return [...products].sort((a, b) => b.price - a.price || byName(a.title, b.title)).slice(0, size);
}

function creationTime(product: Product): number {
  const time = Date.parse(product.creationAt);
  return Number.isNaN(time) ? Number.NEGATIVE_INFINITY : time;
}

export function latestCreated(products: readonly Product[], size = TOP_SIZE): Product[] {
  return [...products]
    .map((product) => ({ product, time: creationTime(product) }))
    .sort((a, b) =>
      a.time === b.time ? a.product.id.localeCompare(b.product.id) : b.time > a.time ? 1 : -1,
    )
    .map(({ product }) => product)
    .slice(0, size);
}

export function computeDashboardMetrics(products: readonly Product[]): DashboardMetrics {
  return {
    totalProducts: countProducts(products),
    inventoryValue: inventoryValue(products),
    leaderCategory: leaderCategory(products),
    categoryDistribution: categoryDistribution(products),
    topExpensive: topExpensive(products),
    latestCreated: latestCreated(products),
  };
}
