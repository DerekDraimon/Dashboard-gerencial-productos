import { act, renderHook, waitFor } from '@testing-library/react';
import type { AxiosAdapter, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { AxiosError } from 'axios';
import { beforeEach, describe, expect, it } from 'vitest';
import { httpClient } from '../../../shared/api/http-client';
import type { User } from '../api/users-api';
import { useUsers } from './useUsers';

function makeUsers(count: number): User[] {
  return Array.from({ length: count }, (_, index) => ({
    id: `u${index}`,
    email: `user${index}@example.com`,
    name: `Usuario ${index}`,
    role: 'USER',
    active: index % 5 !== 0,
    creationAt: '2025-03-07T15:30:00.000Z',
    updatedAt: '2025-03-07T15:30:00.000Z',
  }));
}

let directory: User[];
let failing: boolean;
let manual: boolean;
let requests: InternalAxiosRequestConfig[];
let pending: { config: InternalAxiosRequestConfig; respond: () => void }[];

function pageResponse(config: InternalAxiosRequestConfig): AxiosResponse {
  const { offset, limit, active } = config.params as {
    offset: number;
    limit: number;
    active?: boolean;
  };
  const matches = directory.filter((user) => active === undefined || user.active === active);
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
  const rendered = renderHook(() => useUsers());
  await waitFor(() => expect(rendered.result.current.loading).toBe(false));
  return rendered;
}

beforeEach(() => {
  directory = makeUsers(25);
  failing = false;
  manual = false;
  requests = [];
  pending = [];
  httpClient.defaults.adapter = adapter;
});

describe('useUsers', () => {
  it('loads the first page of every user with offset 0 and limit 10', async () => {
    const { result } = await renderLoaded();

    expect(requests).toHaveLength(1);
    expect(lastParams()).toEqual({ offset: 0, limit: 10 });
    expect(result.current.rows.map((row) => row.id)).toEqual(
      directory.slice(0, 10).map((user) => user.id),
    );
    expect(result.current.total).toBe(25);
    expect(result.current.status).toBe('all');
    expect(result.current.error).toBeNull();
  });

  it('requests offset 10 for the next page', async () => {
    const { result } = await renderLoaded();

    act(() => result.current.pagination.next());

    await waitFor(() => expect(result.current.rows[0]?.id).toBe('u10'));
    expect(lastParams()).toEqual({ offset: 10, limit: 10 });
    expect(result.current.loading).toBe(false);
  });

  it('sends the status filter and goes back to the first page', async () => {
    const { result } = await renderLoaded();
    act(() => result.current.pagination.next());
    await waitFor(() => expect(lastParams()).toEqual({ offset: 10, limit: 10 }));

    act(() => result.current.setStatus('inactive'));

    expect(result.current.status).toBe('inactive');
    expect(result.current.pagination.offset).toBe(0);
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(lastParams()).toEqual({ offset: 0, limit: 10, active: false });
    expect(result.current.total).toBe(5);

    act(() => result.current.setStatus('active'));

    await waitFor(() => expect(result.current.total).toBe(20));
    expect(lastParams()).toEqual({ offset: 0, limit: 10, active: true });
  });

  it('clears the status filter and goes back to the first page', async () => {
    const { result } = await renderLoaded();
    act(() => result.current.setStatus('active'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    act(() => result.current.pagination.next());
    await waitFor(() => expect(lastParams()).toEqual({ offset: 10, limit: 10, active: true }));

    act(() => result.current.clearFilters());

    expect(result.current.status).toBe('all');
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

    expect(result.current.rows[0]?.id).toBe('u20');
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('patches a row in place without refetching', async () => {
    const { result } = await renderLoaded();
    const sent = requests.length;

    act(() => result.current.updateLocally('u3', { active: false, name: 'Ana' }));

    expect(result.current.rows[3]).toMatchObject({ id: 'u3', active: false, name: 'Ana' });
    expect(result.current.rows[2]).toEqual(directory[2]);
    expect(result.current.rows).toHaveLength(10);
    expect(result.current.total).toBe(25);
    expect(requests).toHaveLength(sent);
  });

  it('keeps the rows visible while a refresh refetches in the background', async () => {
    const { result } = await renderLoaded();
    manual = true;
    directory = directory.map((user) =>
      user.id === 'u0' ? { ...user, name: 'Renombrado' } : user,
    );

    act(() => result.current.refresh());

    await waitFor(() => expect(pending).toHaveLength(1));
    expect(result.current.loading).toBe(false);
    expect(result.current.rows).toHaveLength(10);
    await act(async () => pending[0]?.respond());
    expect(result.current.rows[0]?.name).toBe('Renombrado');
    expect(lastParams()).toEqual({ offset: 0, limit: 10 });
  });

  it('keeps the rows and reports the error when a refresh fails', async () => {
    const { result } = await renderLoaded();
    failing = true;

    act(() => result.current.refresh());

    await waitFor(() => expect(result.current.refreshError).toMatchObject({ status: 500 }));
    expect(result.current.error).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.rows).toHaveLength(10);

    failing = false;
    act(() => result.current.refresh());
    await waitFor(() => expect(result.current.refreshError).toBeNull());
    expect(result.current.rows).toHaveLength(10);
  });

  it('moves back to the last page when the list shrinks under the current one', async () => {
    const { result } = await renderLoaded();
    act(() => result.current.pagination.setOffset(20));
    await waitFor(() => expect(result.current.rows[0]?.id).toBe('u20'));

    directory = directory.slice(0, 12);
    act(() => result.current.refresh());

    await waitFor(() => expect(result.current.pagination.offset).toBe(10));
    await waitFor(() => expect(result.current.rows.map((row) => row.id)).toEqual(['u10', 'u11']));
    expect(lastParams()).toEqual({ offset: 10, limit: 10 });
  });

  it('exposes the error and loads again on reload', async () => {
    failing = true;
    const { result } = renderHook(() => useUsers());

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
