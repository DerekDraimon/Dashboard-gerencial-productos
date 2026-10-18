import type { AxiosAdapter, InternalAxiosRequestConfig } from 'axios';
import { AxiosError } from 'axios';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from './api-error';
import { configureHttpAuth, httpClient, toApiError } from './http-client';

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

  it('maps the backend error body to an ApiError with its code, details and Spanish text', async () => {
    const details = [{ path: 'price', message: 'price must be positive' }];
    const body = {
      error: { code: 'VALIDATION_ERROR', message: 'Request validation failed', details },
    };

    const error = await captureError(
      httpClient.post('/products', {}, { adapter: respondWith(400, body) }),
    );

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({
      status: 400,
      code: 'VALIDATION_ERROR',
      message: 'Algunos datos no son válidos. Revisa el formulario.',
      details,
    });
  });

  it('never shows the English server message: known codes get Spanish text', async () => {
    const body = {
      error: {
        code: 'DATABASE_UNAVAILABLE',
        message: 'The database is temporarily unavailable, please retry later',
      },
    };

    const error = await captureError(
      httpClient.get('/products', { adapter: respondWith(503, body) }),
    );

    expect(error).toMatchObject({
      status: 503,
      code: 'DATABASE_UNAVAILABLE',
      message: 'La base de datos no está disponible en este momento. Inténtalo de nuevo más tarde.',
    });
  });

  it('falls back to a generic Spanish message for an unknown code', async () => {
    const body = { error: { code: 'SOMETHING_NEW', message: 'Something new went wrong' } };

    const error = await captureError(
      httpClient.get('/products', { adapter: respondWith(418, body) }),
    );

    expect(error).toMatchObject({
      status: 418,
      code: 'SOMETHING_NEW',
      message: 'Ocurrió un error inesperado. Inténtalo de nuevo.',
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

  it('maps a canceled request to REQUEST_CANCELED instead of a network error', async () => {
    const controller = new AbortController();
    controller.abort();

    const error = await captureError(
      httpClient.get('/products', { signal: controller.signal, adapter: respondWith(200, {}) }),
    );

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status: 0, code: 'REQUEST_CANCELED' });
  });

  it('maps an error response without the backend shape to HTTP_ERROR', async () => {
    const error = await captureError(
      httpClient.get('/products', { adapter: respondWith(502, '<html>Bad Gateway</html>') }),
    );

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({
      status: 502,
      code: 'HTTP_ERROR',
      message: 'Ocurrió un error inesperado. Inténtalo de nuevo.',
    });
  });

  it('maps a non HTTP failure to UNEXPECTED_ERROR', () => {
    const error = toApiError(new TypeError('boom'));

    expect(error).toMatchObject({
      status: 0,
      code: 'UNEXPECTED_ERROR',
      message: 'Ocurrió un error inesperado. Inténtalo de nuevo.',
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

  it('does not report a 401 from a request that opts out of the unauthorized handler', async () => {
    const onUnauthorized = vi.fn();
    configureHttpAuth({ onUnauthorized });
    const body = { error: { code: 'INVALID_CREDENTIALS', message: 'Credenciales inválidas' } };

    const error = await captureError(
      httpClient.post(
        '/auth/login',
        {},
        { skipUnauthorizedHandler: true, adapter: respondWith(401, body) },
      ),
    );

    expect(error).toMatchObject({ status: 401, code: 'INVALID_CREDENTIALS' });
    expect(onUnauthorized).not.toHaveBeenCalled();
  });
});
