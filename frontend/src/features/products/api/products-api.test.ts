import type { AxiosAdapter, InternalAxiosRequestConfig } from 'axios';
import { beforeEach, describe, expect, it } from 'vitest';
import { httpClient } from '../../../shared/api/http-client';
import {
  createProduct,
  deleteProduct,
  getProduct,
  listCategories,
  listProducts,
  updateProduct,
  type Product,
  type ProductInput,
  type ProductPage,
} from './products-api';

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
let responseData: unknown;

beforeEach(() => {
  requests = [];
  responseData = page;
  const adapter: AxiosAdapter = async (config) => {
    requests.push(config);
    return { status: 200, statusText: '', headers: {}, config, data: responseData };
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

describe('product mutations and lookups', () => {
  const input: ProductInput = {
    title: 'Silla',
    description: 'Silla de madera',
    price: 24.99,
    category: 'Muebles',
    images: ['https://example.com/silla.png'],
    stock: 3,
  };

  function lastRequest(): unknown[] {
    const request = requests.at(-1);
    const body = typeof request?.data === 'string' ? (JSON.parse(request.data) as unknown) : null;
    return [request?.method, request && httpClient.getUri(request), body];
  }

  it('getProduct reads one product by id', async () => {
    responseData = product;

    await expect(getProduct('p1')).resolves.toEqual(product);
    expect(lastRequest()).toEqual(['get', '/api/products/p1', null]);
  });

  it('createProduct posts the input and returns the created product', async () => {
    responseData = product;

    await expect(createProduct(input)).resolves.toEqual(product);
    expect(lastRequest()).toEqual(['post', '/api/products', input]);
  });

  it('updateProduct patches only the given fields', async () => {
    responseData = { ...product, price: 30 };

    await expect(updateProduct('p1', { price: 30 })).resolves.toMatchObject({ price: 30 });
    expect(lastRequest()).toEqual(['patch', '/api/products/p1', { price: 30 }]);
  });

  it('deleteProduct sends a delete for the id', async () => {
    responseData = '';

    await expect(deleteProduct('p1')).resolves.toBeUndefined();
    expect(lastRequest()).toEqual(['delete', '/api/products/p1', null]);
  });

  it('encodes the id in every product path', async () => {
    await getProduct('a/b?c');
    expect(lastRequest()[1]).toBe('/api/products/a%2Fb%3Fc');
    await updateProduct('a/b?c', { stock: 1 });
    expect(lastRequest()[1]).toBe('/api/products/a%2Fb%3Fc');
    await deleteProduct('a/b?c');
    expect(lastRequest()[1]).toBe('/api/products/a%2Fb%3Fc');
  });

  it('listCategories returns the category names', async () => {
    responseData = ['Hogar', 'Muebles'];

    await expect(listCategories()).resolves.toEqual(['Hogar', 'Muebles']);
    expect(lastRequest()).toEqual(['get', '/api/products/categories', null]);
  });
});
