import { act, renderHook, waitFor } from '@testing-library/react';
import type { AxiosAdapter, InternalAxiosRequestConfig } from 'axios';
import { AxiosError, CanceledError } from 'axios';
import { beforeEach, describe, expect, it } from 'vitest';
import { httpClient } from '../../../shared/api/http-client';
import type { Product } from '../api/products-api';
import { useAllProducts } from './useAllProducts';

function makeProducts(count: number): Product[] {
  return Array.from({ length: count }, (_, index) => ({
    id: `p${index}`,
    title: `Producto ${index}`,
    description: 'Descripción',
    price: 10,
    category: 'General',
    images: [],
    stock: 1,
    creationAt: '2025-03-07T15:30:00.000Z',
    updatedAt: '2025-03-07T15:30:00.000Z',
  }));
}

let catalog: Product[];
let failing: boolean;
let hanging: boolean;
let requests: InternalAxiosRequestConfig[];

const adapter: AxiosAdapter = (config) => {
  requests.push(config);
  if (hanging) {
    return new Promise((_, reject) => {
      const signal = config.signal as AbortSignal | undefined;
      signal?.addEventListener('abort', () => reject(new CanceledError()));
    });
  }
  if (failing) {
    const response = {
      status: 500,
      statusText: '',
      headers: {},
      config,
      data: { error: { code: 'INTERNAL_ERROR', message: 'Falló el servidor' } },
    };
    return Promise.reject(
      new AxiosError('Request failed', AxiosError.ERR_BAD_RESPONSE, config, null, response),
    );
  }
  const { offset, limit } = config.params as { offset: number; limit: number };
  const data = {
    data: catalog.slice(offset, offset + limit),
    meta: { total: catalog.length, offset, limit },
  };
  return Promise.resolve({ status: 200, statusText: '', headers: {}, config, data });
};

beforeEach(() => {
  catalog = makeProducts(230);
  failing = false;
  hanging = false;
  requests = [];
  httpClient.defaults.adapter = adapter;
});

describe('useAllProducts', () => {
  it('fetches every page of 100 until meta.total is reached', async () => {
    const { result } = renderHook(() => useAllProducts());

    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.products).toHaveLength(230);
    expect(result.current.products.at(-1)?.id).toBe('p229');
    expect(result.current.error).toBeNull();
    expect(requests.map((request) => request.params as unknown)).toEqual([
      { offset: 0, limit: 100 },
      { offset: 100, limit: 100 },
      { offset: 200, limit: 100 },
    ]);
  });

  it('exposes the error and retries on reload', async () => {
    failing = true;
    const { result } = renderHook(() => useAllProducts());

    await waitFor(() => expect(result.current.error).not.toBeNull());
    expect(result.current.error).toMatchObject({ status: 500, code: 'INTERNAL_ERROR' });
    expect(result.current.loading).toBe(false);
    expect(result.current.products).toEqual([]);

    failing = false;
    act(() => result.current.reload());

    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBeNull();
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.products).toHaveLength(230);
    expect(result.current.error).toBeNull();
  });

  it('aborts the pending request on unmount and sets no error', async () => {
    hanging = true;
    const { result, unmount } = renderHook(() => useAllProducts());
    await waitFor(() => expect(requests).toHaveLength(1));

    unmount();

    expect((requests[0]?.signal as AbortSignal | undefined)?.aborted).toBe(true);
    await act(() => Promise.resolve());
    expect(result.current.error).toBeNull();
  });
});
