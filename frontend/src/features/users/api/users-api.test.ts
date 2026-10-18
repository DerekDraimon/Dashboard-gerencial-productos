import type { AxiosAdapter, InternalAxiosRequestConfig } from 'axios';
import { beforeEach, describe, expect, it } from 'vitest';
import { httpClient } from '../../../shared/api/http-client';
import {
  createUser,
  getUser,
  listUsers,
  setUserStatus,
  updateUser,
  type User,
  type UserPage,
} from './users-api';

const user: User = {
  id: 'u1',
  email: 'ana@example.com',
  name: 'Ana',
  role: 'USER',
  active: true,
  creationAt: '2025-03-07T15:30:00.000Z',
  updatedAt: '2025-03-08T10:00:00.000Z',
};
const page: UserPage = { data: [user], meta: { total: 1, offset: 0, limit: 10 } };

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

function lastRequest(): unknown[] {
  const request = requests.at(-1);
  const body = typeof request?.data === 'string' ? (JSON.parse(request.data) as unknown) : null;
  return [request?.method, request && httpClient.getUri(request), body];
}

describe('listUsers', () => {
  it('sends the page and returns it with the abort signal', async () => {
    const controller = new AbortController();

    const result = await listUsers({ offset: 20, limit: 25 }, { signal: controller.signal });

    expect(result).toEqual(page);
    expect(lastRequest()).toEqual(['get', '/api/users?offset=20&limit=25', null]);
    expect(requests[0]?.signal).toBe(controller.signal);
  });

  it('sends active=true or active=false and omits it for all', async () => {
    await listUsers({ offset: 0, limit: 10, active: true });
    expect(lastRequest()[1]).toBe('/api/users?offset=0&limit=10&active=true');

    await listUsers({ offset: 0, limit: 10, active: false });
    expect(lastRequest()[1]).toBe('/api/users?offset=0&limit=10&active=false');

    await listUsers({ offset: 0, limit: 10, active: undefined });
    expect(lastRequest()[1]).toBe('/api/users?offset=0&limit=10');
  });
});

describe('user mutations and lookups', () => {
  it('getUser reads one user by id', async () => {
    responseData = user;

    await expect(getUser('u1')).resolves.toEqual(user);
    expect(lastRequest()).toEqual(['get', '/api/users/u1', null]);
  });

  it('createUser posts the input and returns the created user', async () => {
    responseData = user;
    const input = {
      name: 'Ana',
      email: 'ana@example.com',
      password: 'secreta123',
      role: 'USER' as const,
    };

    await expect(createUser(input)).resolves.toEqual(user);
    expect(lastRequest()).toEqual(['post', '/api/users', input]);
  });

  it('updateUser patches only the given fields', async () => {
    responseData = { ...user, role: 'ADMIN' };

    await expect(updateUser('u1', { role: 'ADMIN' })).resolves.toMatchObject({ role: 'ADMIN' });
    expect(lastRequest()).toEqual(['patch', '/api/users/u1', { role: 'ADMIN' }]);
  });

  it('setUserStatus patches the status route with the flag', async () => {
    responseData = { ...user, active: false };

    await expect(setUserStatus('u1', false)).resolves.toMatchObject({ active: false });
    expect(lastRequest()).toEqual(['patch', '/api/users/u1/status', { active: false }]);
  });

  it('encodes the id in every user path', async () => {
    await getUser('a/b?c');
    expect(lastRequest()[1]).toBe('/api/users/a%2Fb%3Fc');
    await updateUser('a/b?c', { name: 'X' });
    expect(lastRequest()[1]).toBe('/api/users/a%2Fb%3Fc');
    await setUserStatus('a/b?c', true);
    expect(lastRequest()[1]).toBe('/api/users/a%2Fb%3Fc/status');
  });
});
