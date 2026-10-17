import type { AxiosAdapter, InternalAxiosRequestConfig } from 'axios';
import { AxiosError } from 'axios';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from './api-error';
import { configureHttpAuth, httpClient } from './http-client';

function respondWith(status: number, data: unknown): AxiosAdapter {
  return async (config) => {
    const response = { status, statusText: '', headers: {}, config, data };
    if (status >= 200 && status < 300) {
      return response;
    }
    throw new AxiosError('Request failed', AxiosError.ERR_BAD_RESPONSE, config, null, response);
  };
}

const failWithoutResponse: AxiosAdapter = async (config) => {
  throw new AxiosError('Network Error', AxiosError.ERR_NETWORK, config);
};

async function captureError(promise: Promise<unknown>): Promise<unknown> {
  try {
    await promise;
  } catch (error) {
    return error;
  }
  throw new Error('Expected the request to fail');
}

afterEach(() => {
  configureHttpAuth({ getToken: () => null, onUnauthorized: () => undefined });
});

describe('httpClient', () => {
  it('passes the data of a successful response through', async () => {
    const response = await httpClient.get('/products', {
      adapter: respondWith(200, { items: [{ id: '1' }] }),
    });

    expect(response.status).toBe(200);
    expect(response.data).toEqual({ items: [{ id: '1' }] });
  });

  it('maps the backend error body to an ApiError with its code and details', async () => {
    const details = [{ path: 'price', message: 'Debe ser positivo' }];
    const body = { error: { code: 'VALIDATION_ERROR', message: 'Datos inválidos', details } };

    const error = await captureError(
      httpClient.post('/products', {}, { adapter: respondWith(400, body) }),
    );

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({
      status: 400,
      code: 'VALIDATION_ERROR',
      message: 'Datos inválidos',
      details,
    });
  });

  it('maps a request without response to a NETWORK_ERROR with status 0', async () => {
    const error = await captureError(httpClient.get('/products', { adapter: failWithoutResponse }));

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({
      status: 0,
      code: 'NETWORK_ERROR',
      message: 'No se pudo conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.',
    });
  });

  it('sends the registered token and reports unauthorized responses', async () => {
    const onUnauthorized = vi.fn();
    let sentHeaders: InternalAxiosRequestConfig['headers'] | undefined;
    configureHttpAuth({ getToken: () => 'token-123', onUnauthorized });
    const body = { error: { code: 'UNAUTHORIZED', message: 'Sesión expirada' } };

    const error = await captureError(
      httpClient.get('/users', {
        adapter: async (config) => {
          sentHeaders = config.headers;
          return respondWith(401, body)(config);
        },
      }),
    );

    expect(sentHeaders?.Authorization).toBe('Bearer token-123');
    expect(onUnauthorized).toHaveBeenCalledWith(error);
  });
});
