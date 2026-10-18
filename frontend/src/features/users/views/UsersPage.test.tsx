import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { AxiosAdapter, InternalAxiosRequestConfig } from 'axios';
import { AxiosError } from 'axios';
import { beforeEach, describe, expect, it } from 'vitest';
import { httpClient } from '../../../shared/api/http-client';
import { ConfirmProvider } from '../../../shared/components/confirm-dialog';
import { NotificationProvider } from '../../../shared/feedback/NotificationProvider';
import { AuthContext, type AuthContextValue } from '../../auth/context/auth-context';
import type { User } from '../api/users-api';
import { UsersPage } from './UsersPage';

function makeUser(index: number, overrides: Partial<User> = {}): User {
  return {
    id: `u${index}`,
    email: `user${index}@example.com`,
    name: `Usuario ${index}`,
    role: 'USER',
    active: true,
    creationAt: '2025-03-07T15:30:00.000Z',
    updatedAt: '2025-03-07T15:30:00.000Z',
    ...overrides,
  };
}

let directory: User[];
let failing: boolean;
let statusError: { status: number; code: string; message: string } | null;
let requests: InternalAxiosRequestConfig[];

function reject(config: InternalAxiosRequestConfig, status: number, code: string, message: string) {
  const response = {
    status,
    statusText: '',
    headers: {},
    config,
    data: { error: { code, message } },
  };
  return Promise.reject(new AxiosError('Failed', 'ERR', config, null, response));
}

const adapter: AxiosAdapter = (config) => {
  requests.push(config);
  if (config.method === 'patch') {
    if (statusError) {
      return reject(config, statusError.status, statusError.code, statusError.message);
    }
    const id = config.url?.split('/')[2];
    const { active } = JSON.parse(config.data as string) as { active: boolean };
    directory = directory.map((user) => (user.id === id ? { ...user, active } : user));
    const data = directory.find((user) => user.id === id);
    return Promise.resolve({ status: 200, statusText: '', headers: {}, config, data });
  }
  if (failing) return reject(config, 500, 'INTERNAL_ERROR', 'No se pudo cargar.');
  const { offset, limit, active } = config.params as {
    offset: number;
    limit: number;
    active?: boolean;
  };
  const matches = directory.filter((user) => active === undefined || user.active === active);
  const data = { data: matches.slice(offset, offset + limit), meta: { total: matches.length } };
  return Promise.resolve({ status: 200, statusText: '', headers: {}, config, data });
};

function renderPage() {
  const auth: AuthContextValue = {
    status: 'authenticated',
    user: { id: 'u0', email: 'user0@example.com', name: 'Usuario 0', role: 'ADMIN', active: true },
    login: () => Promise.reject(new Error('unused')),
    logout: () => undefined,
  };
  render(
    <NotificationProvider>
      <ConfirmProvider>
        <AuthContext.Provider value={auth}>
          <UsersPage />
        </AuthContext.Provider>
      </ConfirmProvider>
    </NotificationProvider>,
  );
}

const rowOf = async (name: string) => (await screen.findByText(name)).closest('tr') as HTMLElement;
const patches = () => requests.filter((request) => request.method === 'patch');

beforeEach(() => {
  directory = [
    makeUser(0, { role: 'ADMIN' }),
    makeUser(1),
    makeUser(2, { active: false }),
    ...Array.from({ length: 10 }, (_, index) => makeUser(index + 3)),
  ];
  failing = false;
  statusError = null;
  requests = [];
  httpClient.defaults.adapter = adapter;
});

describe('UsersPage', () => {
  it('shows the columns, Spanish role chips and status per row', async () => {
    renderPage();
    const admin = await rowOf('Usuario 0');

    const headers = screen.getAllByRole('columnheader').map((header) => header.textContent);
    expect(headers).toEqual(['Nombre', 'Email', 'Rol', 'Estado', 'Acciones']);
    expect(within(admin).getByText('user0@example.com')).toBeInTheDocument();
    expect(within(admin).getByText('Administrador')).toBeInTheDocument();
    expect(within(await rowOf('Usuario 1')).getByText('Usuario')).toBeInTheDocument();
    expect(within(await rowOf('Usuario 1')).getByText('Activo')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Editar Usuario 1' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Nuevo usuario' })).toBeInTheDocument();
  });

  it('marks the current user and disables their switch', async () => {
    renderPage();
    const self = await rowOf('Usuario 0');

    expect(
      within(self).getByText('Tú · no puedes inactivarte ni cambiar tu rol'),
    ).toBeInTheDocument();
    expect(within(self).getByRole('switch', { name: 'Inactivar a Usuario 0' })).toBeDisabled();
    expect(screen.getAllByText('Tú · no puedes inactivarte ni cambiar tu rol')).toHaveLength(1);
  });

  it('dims inactive rows', async () => {
    renderPage();

    expect(await rowOf('Usuario 2')).toHaveStyle({ opacity: '0.7' });
    expect(await rowOf('Usuario 1')).not.toHaveStyle({ opacity: '0.7' });
  });

  it('asks before deactivating and sends nothing when canceled', async () => {
    renderPage();
    await userEvent.click(
      within(await rowOf('Usuario 1')).getByRole('switch', { name: 'Inactivar a Usuario 1' }),
    );

    const dialog = await screen.findByRole('alertdialog', { name: '¿Inactivar a Usuario 1?' });
    expect(
      within(dialog).getByText(
        'No podrá iniciar sesión hasta que lo reactives. Su cuenta y sus datos se conservan.',
      ),
    ).toBeInTheDocument();
    await userEvent.click(within(dialog).getByRole('button', { name: 'Cancelar' }));

    await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument());
    expect(patches()).toHaveLength(0);
    expect(screen.getByRole('switch', { name: 'Inactivar a Usuario 1' })).toBeChecked();
  });

  it('deactivates on confirm and updates the row in place', async () => {
    renderPage();
    await userEvent.click(
      within(await rowOf('Usuario 1')).getByRole('switch', { name: 'Inactivar a Usuario 1' }),
    );
    const dialog = await screen.findByRole('alertdialog', { name: '¿Inactivar a Usuario 1?' });
    await userEvent.click(within(dialog).getByRole('button', { name: 'Inactivar' }));

    expect(await screen.findByText('Usuario inactivado')).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument());
    const [patch] = patches();
    expect(patch?.url).toBe('/users/u1/status');
    expect(JSON.parse(patch?.data as string)).toEqual({ active: false });
    const row = await rowOf('Usuario 1');
    expect(within(row).getByText('Inactivo')).toBeInTheDocument();
    expect(within(row).getByRole('switch', { name: 'Reactivar a Usuario 1' })).not.toBeChecked();
    expect(row).toHaveStyle({ opacity: '0.7' });
  });

  it('reactivates without asking', async () => {
    renderPage();
    await userEvent.click(
      within(await rowOf('Usuario 2')).getByRole('switch', { name: 'Reactivar a Usuario 2' }),
    );

    expect(await screen.findByText('Usuario reactivado')).toBeInTheDocument();
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    expect(JSON.parse(patches()[0]?.data as string)).toEqual({ active: true });
    expect(within(await rowOf('Usuario 2')).getByText('Activo')).toBeInTheDocument();
  });

  it('keeps the row as it was and shows the error when saving fails', async () => {
    statusError = { status: 404, code: 'USER_NOT_FOUND', message: 'El usuario no existe.' };
    renderPage();
    await userEvent.click(
      within(await rowOf('Usuario 2')).getByRole('switch', { name: 'Reactivar a Usuario 2' }),
    );

    expect(await screen.findByText('El usuario no existe.')).toBeInTheDocument();
    const row = await rowOf('Usuario 2');
    expect(within(row).getByText('Inactivo')).toBeInTheDocument();
    expect(within(row).getByRole('switch', { name: 'Reactivar a Usuario 2' })).toBeEnabled();
  });

  it('explains a self-modification conflict', async () => {
    statusError = { status: 409, code: 'CANNOT_MODIFY_SELF', message: 'Self.' };
    renderPage();
    await userEvent.click(
      within(await rowOf('Usuario 2')).getByRole('switch', { name: 'Reactivar a Usuario 2' }),
    );

    expect(
      await screen.findByText('No puedes inactivarte ni cambiar tu propio rol.'),
    ).toBeInTheDocument();
  });

  it('filters by status from the first page and can clear the filter', async () => {
    renderPage();
    await rowOf('Usuario 0');
    const clear = screen.getByRole('button', { name: 'Limpiar filtros' });
    expect(clear).toBeDisabled();
    await userEvent.click(screen.getByRole('button', { name: 'Página siguiente' }));
    await rowOf('Usuario 12');

    await userEvent.selectOptions(screen.getByLabelText('Estado'), 'Inactivos');

    await rowOf('Usuario 2');
    expect(requests.at(-1)?.params).toEqual({ offset: 0, limit: 10, active: false });
    expect(screen.queryByText('Usuario 1')).not.toBeInTheDocument();

    await userEvent.click(clear);
    await rowOf('Usuario 1');
    expect(requests.at(-1)?.params).toEqual({ offset: 0, limit: 10 });
  });

  it('tells apart an empty filter result from an empty list', async () => {
    directory = directory.map((user) => ({ ...user, active: true }));
    renderPage();
    await rowOf('Usuario 0');

    await userEvent.selectOptions(screen.getByLabelText('Estado'), 'Inactivos');
    expect(await screen.findByText('No hay usuarios con ese estado')).toBeInTheDocument();
  });

  it('says there are no users yet when the list is empty', async () => {
    directory = [];
    renderPage();

    expect(await screen.findByText('Todavía no hay usuarios')).toBeInTheDocument();
  });

  it('shows the error and loads again with Reintentar', async () => {
    failing = true;
    renderPage();

    const retry = await screen.findByRole('button', { name: 'Reintentar' });
    expect(screen.getByText('No pudimos cargar los usuarios')).toBeInTheDocument();
    failing = false;
    await userEvent.click(retry);

    expect(await screen.findByText('Usuario 1')).toBeInTheDocument();
  });
});
