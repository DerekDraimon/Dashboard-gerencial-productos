import { act, renderHook, waitFor } from '@testing-library/react';
import type { AxiosAdapter, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { AxiosError } from 'axios';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { httpClient } from '../../../shared/api/http-client';
import type { Product } from '../api/products-api';
import { useProducts } from './useProducts';

function makeProducts(count: number): Product[] {
  return Array.from({ length: count }, (_, index) => ({
    id: `p${index}`,
    title: `Producto ${index}`,
    description: 'Descripción',
    ...{ price: 10, category: 'General', images: [], stock: 1 },
    creationAt: '2025-03-07T15:30:00.000Z',
    updatedAt: '2025-03-07T15:30:00.000Z',
  }));
}

let catalog: Product[];
let failing: boolean;
let manual: boolean;
let requests: InternalAxiosRequestConfig[];
let pending: { config: InternalAxiosRequestConfig; respond: () => void }[];

function pageResponse(config: InternalAxiosRequestConfig): AxiosResponse {
  const { offset, limit, search } = config.params as {
    offset: number;
    limit: number;
    search?: string;
  };
  const matches = catalog.filter((product) => !search || product.title.includes(search));
  const data = {
    data: matches.slice(offset, offset + limit),
    meta: { total: matches.length, offset, limit },
  };
  return { status: 200, statusText: '', headers: {}, config, data };
}

// Manual requests ignore the abort signal on purpose: the hook itself must drop stale answers.
const adapter: AxiosAdapter = (config) => {
  requests.push(config);
  if (failing) {
    const response = { status: 500, statusText: '', headers: {}, config, data: {} };
    return Promise.reject(
      new AxiosError('Failed', AxiosError.ERR_BAD_RESPONSE, config, null, response),
    );
  }
  if (manual) {
    return new Promise((resolve) => {
      pending.push({ config, respond: () => resolve(pageResponse(config)) });
    });
  }
  return Promise.resolve(pageResponse(config));
};

function lastParams(): unknown {
  return requests.at(-1)?.params;
}

async function renderLoaded() {
  const rendered = renderHook(() => useProducts());
  await waitFor(() => expect(rendered.result.current.loading).toBe(false));
  return rendered;
}

beforeEach(() => {
  catalog = makeProducts(25);
  failing = false;
  manual = false;
  requests = [];
  pending = [];
  httpClient.defaults.adapter = adapter;
});

afterEach(() => {
  vi.useRealTimers();
});

describe('useProducts', () => {
  it('loads the first page with offset 0 and limit 10', async () => {
    const { result } = await renderLoaded();

    expect(requests).toHaveLength(1);
    expect(lastParams()).toEqual({ offset: 0, limit: 10 });
    expect(result.current.rows.map((row) => row.id)).toEqual(
      catalog.slice(0, 10).map((product) => product.id),
    );
    expect(result.current.total).toBe(25);
    expect(result.current.error).toBeNull();
  });

  it('requests offset 10 for the next page', async () => {
    const { result } = await renderLoaded();

    act(() => result.current.pagination.next());

    await waitFor(() => expect(result.current.rows[0]?.id).toBe('p10'));
    expect(lastParams()).toEqual({ offset: 10, limit: 10 });
    expect(result.current.loading).toBe(false);
  });

  it('waits for the debounce before searching and goes back to the first page', async () => {
    const { result } = await renderLoaded();
    act(() => result.current.pagination.next());
    await waitFor(() => expect(result.current.rows[0]?.id).toBe('p10'));
    const sent = requests.length;

    vi.useFakeTimers();
    act(() => result.current.setSearch('Producto 1'));
    expect(result.current.filters.search).toBe('Producto 1');
    act(() => vi.advanceTimersByTime(299));
    expect(requests).toHaveLength(sent);
    act(() => vi.advanceTimersByTime(1));
    vi.useRealTimers();

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(requests).toHaveLength(sent + 1);
    expect(lastParams()).toEqual({ offset: 0, limit: 10, search: 'Producto 1' });
    expect(result.current.pagination.offset).toBe(0);
    expect(result.current.total).toBe(11);
  });

  it('sends the date range and resets to the first page', async () => {
    const { result } = await renderLoaded();
    act(() => result.current.pagination.next());
    await waitFor(() => expect(lastParams()).toEqual({ offset: 10, limit: 10 }));

    act(() => {
      result.current.setFrom('2025-01-01');
      result.current.setTo('2025-01-31');
    });

    await waitFor(() =>
      expect(lastParams()).toEqual({ offset: 0, limit: 10, from: '2025-01-01', to: '2025-01-31' }),
    );
    expect(result.current.filters).toEqual({ search: '', from: '2025-01-01', to: '2025-01-31' });
    expect(result.current.dateRangeError).toBe(false);
  });

  it('flags a start date after the end date and skips the request', async () => {
    const { result } = await renderLoaded();
    const sent = requests.length;

    act(() => {
      result.current.setFrom('2025-02-01');
      result.current.setTo('2025-01-31');
    });
    await act(() => Promise.resolve());

    expect(result.current.dateRangeError).toBe(true);
    expect(result.current.loading).toBe(false);
    expect(requests).toHaveLength(sent);
  });

  it('clears every filter and goes back to the first page', async () => {
    const { result } = await renderLoaded();
    act(() => {
      result.current.setSearch('Producto');
      result.current.setFrom('2025-02-01');
      result.current.setTo('2025-01-31');
      result.current.pagination.next();
    });

    act(() => result.current.clearFilters());

    expect(result.current.filters).toEqual({ search: '', from: '', to: '' });
    expect(result.current.dateRangeError).toBe(false);
    expect(result.current.pagination.offset).toBe(0);
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(lastParams()).toEqual({ offset: 0, limit: 10 });
  });

  it('cancels the older request so its late answer never wins', async () => {
    const { result } = await renderLoaded();
    manual = true;

    act(() => result.current.pagination.next());
    await waitFor(() => expect(pending).toHaveLength(1));
    act(() => result.current.pagination.next());
    await waitFor(() => expect(pending).toHaveLength(2));

    const [older, newer] = pending;
    expect(older?.config.signal?.aborted).toBe(true);
    await act(async () => newer?.respond());
    await act(async () => older?.respond());

    expect(result.current.rows[0]?.id).toBe('p20');
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('removes a row locally and decrements the total', async () => {
    const { result } = await renderLoaded();
    const sent = requests.length;

    act(() => result.current.removeLocally('p3'));

    expect(result.current.rows.map((row) => row.id)).not.toContain('p3');
    expect(result.current.rows).toHaveLength(9);
    expect(result.current.total).toBe(24);
    expect(requests).toHaveLength(sent);
  });

  it('exposes the error and loads again on reload', async () => {
    failing = true;
    const { result } = renderHook(() => useProducts());

    await waitFor(() => expect(result.current.error).not.toBeNull());
    expect(result.current.error).toMatchObject({ status: 500 });
    expect(result.current.loading).toBe(false);
    expect(result.current.rows).toEqual([]);

    failing = false;
    act(() => result.current.reload());

    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBeNull();
    expect(result.current.rows).toHaveLength(10);
  });
});
