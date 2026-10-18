import axios, { isAxiosError, isCancel } from 'axios';
import { ApiError } from './api-error';
import { UNEXPECTED_ERROR_MESSAGE, apiErrorMessage } from './api-error-messages';

const NETWORK_ERROR_MESSAGE =
  'No se pudo conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.';
export { UNEXPECTED_ERROR_MESSAGE };
const REQUEST_CANCELED_MESSAGE = 'La solicitud fue cancelada.';

declare module 'axios' {
  interface AxiosRequestConfig {
    /** A 401 here is an expected answer (wrong credentials), not an expired session. */
    skipUnauthorizedHandler?: boolean;
  }
}

export interface HttpAuthHooks {
  getToken: () => string | null;
  onUnauthorized: (error: ApiError) => void;
}

let authHooks: HttpAuthHooks = {
  getToken: () => null,
  onUnauthorized: () => undefined,
};

export function configureHttpAuth(hooks: Partial<HttpAuthHooks>): void {
  authHooks = { ...authHooks, ...hooks };
}

export const httpClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '/api',
});

httpClient.interceptors.request.use((config) => {
  const token = authHooks.getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

httpClient.interceptors.response.use(undefined, (error: unknown) => {
  const apiError = toApiError(error);
  const skipped = isAxiosError(error) && error.config?.skipUnauthorizedHandler === true;
  if (apiError.status === 401 && !skipped) {
    authHooks.onUnauthorized(apiError);
  }
  return Promise.reject(apiError);
});

interface BackendErrorBody {
  error: { code: string; message: string; details?: unknown };
}

function isBackendErrorBody(data: unknown): data is BackendErrorBody {
  if (typeof data !== 'object' || data === null || !('error' in data)) {
    return false;
  }
  const { error } = data;
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof error.code === 'string' &&
    'message' in error &&
    typeof error.message === 'string'
  );
}

export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) {
    return error;
  }
  if (isCancel(error)) {
    return new ApiError(0, 'REQUEST_CANCELED', REQUEST_CANCELED_MESSAGE);
  }
  if (!isAxiosError(error)) {
    return new ApiError(0, 'UNEXPECTED_ERROR', UNEXPECTED_ERROR_MESSAGE);
  }
  if (!error.response) {
    return new ApiError(0, 'NETWORK_ERROR', NETWORK_ERROR_MESSAGE);
  }
  const { status, data } = error.response;
  if (isBackendErrorBody(data)) {
    return new ApiError(
      status,
      data.error.code,
      apiErrorMessage(data.error.code),
      data.error.details,
    );
  }
  return new ApiError(status, 'HTTP_ERROR', UNEXPECTED_ERROR_MESSAGE);
}
