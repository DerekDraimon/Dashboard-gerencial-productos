import { renderHook, waitFor } from '@testing-library/react';
import type { AxiosAdapter, InternalAxiosRequestConfig } from 'axios';
import { AxiosError } from 'axios';
import { beforeEach, describe, expect, it } from 'vitest';
import { httpClient } from '../../../shared/api/http-client';
import { useCategories } from './useCategories';

let failing: boolean;
let requests: InternalAxiosRequestConfig[];

const adapter: AxiosAdapter = (config) => {
  requests.push(config);
  if (failing) {
    return Promise.reject(new AxiosError('Failed', AxiosError.ERR_NETWORK, config));
  }
  const data = ['Hogar', 'Muebles'];
  return Promise.resolve({ status: 200, statusText: '', headers: {}, config, data });
};

beforeEach(() => {
  failing = false;
  requests = [];
  httpClient.defaults.adapter = adapter;
});

describe('useCategories', () => {
  it('loads the categories once', async () => {
    const { result, rerender } = renderHook(() => useCategories());

    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));
    rerender();

    expect(result.current.categories).toEqual(['Hogar', 'Muebles']);
    expect(requests).toHaveLength(1);
    expect(requests[0]?.url).toBe('/products/categories');
  });

  it('leaves an empty list when the request fails', async () => {
    failing = true;
    const { result } = renderHook(() => useCategories());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.categories).toEqual([]);
  });
});
