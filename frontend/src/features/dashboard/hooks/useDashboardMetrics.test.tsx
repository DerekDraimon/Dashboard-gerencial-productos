import { act, renderHook, waitFor } from '@testing-library/react';
import type { AxiosAdapter } from 'axios';
import { beforeEach, describe, expect, it } from 'vitest';
import { httpClient } from '../../../shared/api/http-client';
import type { Product } from '../../products/api/products-api';
import { useDashboardMetrics } from './useDashboardMetrics';

const products: Product[] = [
  {
    id: 'p1',
    title: 'Sofá',
    description: 'Sofá de tres puestos',
    price: 0.1,
    category: 'Hogar',
    images: [],
    stock: 2,
    creationAt: '2025-02-01T00:00:00.000Z',
    updatedAt: '2025-02-01T00:00:00.000Z',
  },
  {
    id: 'p2',
    title: 'Gorra',
    description: 'Gorra de algodón',
    price: 0.2,
    category: 'Ropa',
    images: [],
    stock: 9,
    creationAt: '2025-03-01T00:00:00.000Z',
    updatedAt: '2025-03-01T00:00:00.000Z',
  },
];

let catalog: Product[];

beforeEach(() => {
  catalog = products;
  const adapter: AxiosAdapter = async (config) => ({
    status: 200,
    statusText: '',
    headers: {},
    config,
    data: { data: catalog, meta: { total: catalog.length, offset: 0, limit: 100 } },
  });
  httpClient.defaults.adapter = adapter;
});

describe('useDashboardMetrics', () => {
  it('computes the metrics from every fetched product and memoizes them', async () => {
    const { result, rerender } = renderHook(() => useDashboardMetrics());

    expect(result.current.loading).toBe(true);
    expect(result.current.isEmpty).toBe(false);
    await waitFor(() => expect(result.current.loading).toBe(false));

    const { metrics } = result.current;
    expect(metrics.totalProducts).toBe(2);
    expect(metrics.inventoryValue.toString()).toBe('0.3');
    expect(metrics.leaderCategory).toEqual({ category: 'Ropa', stock: 9 });
    expect(result.current.error).toBeNull();
    expect(result.current.isEmpty).toBe(false);

    rerender();

    expect(result.current.metrics).toBe(metrics);
  });

  it('reports isEmpty when the catalog has no products and reloads', async () => {
    catalog = [];
    const { result } = renderHook(() => useDashboardMetrics());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.isEmpty).toBe(true);

    catalog = products;
    act(() => result.current.reload());
    await waitFor(() => expect(result.current.metrics.totalProducts).toBe(2));
    expect(result.current.isEmpty).toBe(false);
  });
});
