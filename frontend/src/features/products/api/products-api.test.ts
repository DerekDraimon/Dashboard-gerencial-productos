import type { AxiosAdapter, InternalAxiosRequestConfig } from 'axios';
import { beforeEach, describe, expect, it } from 'vitest';
import { httpClient } from '../../../shared/api/http-client';
import { listProducts, type Product, type ProductPage } from './products-api';

const product: Product = {
  id: 'p1',
  title: 'Silla',
  description: 'Silla de madera',
  price: 24.99,
  category: 'Muebles',
  images: ['https://example.com/silla.png'],
  stock: 3,
  creationAt: '2025-03-07T15:30:00.000Z',
  updatedAt: '2025-03-08T10:00:00.000Z',
};
const page: ProductPage = { data: [product], meta: { total: 1, offset: 0, limit: 100 } };

let requests: InternalAxiosRequestConfig[];

beforeEach(() => {
  requests = [];
  const adapter: AxiosAdapter = async (config) => {
    requests.push(config);
    return { status: 200, statusText: '', headers: {}, config, data: page };
  };
  httpClient.defaults.adapter = adapter;
});

describe('listProducts', () => {
  it('sends every filter in the query string and returns the page', async () => {
    const controller = new AbortController();

    const result = await listProducts(
      { offset: 100, limit: 100, search: 'silla', from: '2025-01-01', to: '2025-01-31' },
      { signal: controller.signal },
    );

    expect(result).toEqual(page);
    const [request] = requests;
    expect(request && httpClient.getUri(request)).toBe(
      '/api/products?offset=100&limit=100&search=silla&from=2025-01-01&to=2025-01-31',
    );
    expect(request?.signal).toBe(controller.signal);
  });

  it('omits empty filters', async () => {
    await listProducts({ offset: 0, limit: 100, search: '', from: undefined, to: '' });

    const [request] = requests;
    expect(request && httpClient.getUri(request)).toBe('/api/products?offset=0&limit=100');
  });
});
