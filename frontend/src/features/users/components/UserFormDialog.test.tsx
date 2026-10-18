import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { AxiosAdapter, InternalAxiosRequestConfig } from 'axios';
import { AxiosError } from 'axios';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { httpClient } from '../../../shared/api/http-client';
import { NotificationProvider } from '../../../shared/feedback/NotificationProvider';
import type { User } from '../api/users-api';
import { UserFormDialog } from './UserFormDialog';

let requests: InternalAxiosRequestConfig[];
let failure: { status: number; code: string; message: string; details?: unknown } | null;
let loadFails: boolean;

const eva: User = {
  id: 'u7',
  email: 'eva@example.com',
  name: 'Eva',
  role: 'USER',
  active: true,
  creationAt: '',
  updatedAt: '',
};

const adapter: AxiosAdapter = (config) => {
  requests.push(config);
  if (config.method === 'get') {
    if (!loadFails) {
      return Promise.resolve({ status: 200, statusText: '', headers: {}, config, data: eva });
    }
    const response = { status: 500, statusText: '', headers: {}, config, data: {} };
    return Promise.reject(new AxiosError('Failed', 'ERR', config, null, response));
  }
  if (failure) {
    const { status, ...error } = failure;
    const response = { status, statusText: '', headers: {}, config, data: { error } };
    return Promise.reject(new AxiosError('Failed', 'ERR', config, null, response));
  }
  const body = JSON.parse(config.data as string) as Partial<User>;
  const data = { ...eva, ...(config.method === 'patch' ? {} : { id: 'new' }), ...body };
  return Promise.resolve({ status: 201, statusText: '', headers: {}, config, data });
};

function renderDialog() {
  const onClose = vi.fn();
  const onSaved = vi.fn();
  render(
    <NotificationProvider>
      <UserFormDialog open mode="create" onClose={onClose} onSaved={onSaved} />
    </NotificationProvider>,
  );
  const dialog = screen.getByRole('dialog', { name: 'Nuevo usuario' });
  return { dialog, onClose, onSaved };
}

async function fill(
  dialog: HTMLElement,
  values: { name?: string; email?: string; password?: string },
) {
  const fields = { name: 'Nombre', email: 'Correo electrónico', password: 'Contraseña' } as const;
  for (const [key, label] of Object.entries(fields)) {
    const value = values[key as keyof typeof fields];
    if (value) await userEvent.type(within(dialog).getByLabelText(label), value);
  }
}

const submit = (dialog: HTMLElement) =>
  userEvent.click(within(dialog).getByRole('button', { name: 'Crear usuario' }));

beforeEach(() => {
  requests = [];
  failure = null;
  loadFails = false;
  httpClient.defaults.adapter = adapter;
});

describe('UserFormDialog', () => {
  it('requires every field and sends nothing', async () => {
    const { dialog } = renderDialog();

    await submit(dialog);

    expect(await within(dialog).findByText('El nombre es obligatorio.')).toBeInTheDocument();
    expect(within(dialog).getByText('El correo es obligatorio.')).toBeInTheDocument();
    expect(within(dialog).getByText('La contraseña es obligatoria.')).toBeInTheDocument();
    expect(requests).toHaveLength(0);
  });

  it('rejects an invalid email and a name over 100 characters', async () => {
    const { dialog } = renderDialog();
    await fill(dialog, { name: 'a'.repeat(101), email: 'ana@', password: 'secreta123' });

    await submit(dialog);

    expect(await within(dialog).findByText('Ingresa un correo válido.')).toBeInTheDocument();
    expect(within(dialog).getByText('El nombre admite máximo 100 caracteres.')).toBeInTheDocument();
    expect(requests).toHaveLength(0);
  });

  it('rejects a 7-character password and a password over 72 bytes', async () => {
    const { dialog } = renderDialog();
    const password = within(dialog).getByLabelText('Contraseña');
    expect(within(dialog).getByText('Mínimo 8 caracteres.')).toBeInTheDocument();
    await fill(dialog, { name: 'Ana', email: 'ana@example.com', password: '1234567' });

    await submit(dialog);
    expect(
      await within(dialog).findByText('La contraseña debe tener al menos 8 caracteres.'),
    ).toBeInTheDocument();

    await userEvent.clear(password);
    await userEvent.type(password, '😀'.repeat(18) + 'a');
    await submit(dialog);
    expect(
      await within(dialog).findByText('La contraseña es demasiado larga (máximo 72 caracteres).'),
    ).toBeInTheDocument();
    expect(requests).toHaveLength(0);
  });

  it('shows and hides the password', async () => {
    const { dialog } = renderDialog();
    const password = within(dialog).getByLabelText('Contraseña');
    expect(password).toHaveAttribute('type', 'password');

    await userEvent.click(within(dialog).getByRole('button', { name: 'Mostrar contraseña' }));
    expect(password).toHaveAttribute('type', 'text');

    await userEvent.click(within(dialog).getByRole('button', { name: 'Ocultar contraseña' }));
    expect(password).toHaveAttribute('type', 'password');
  });

  it('creates a USER by default with the trimmed, lowercased email', async () => {
    const { dialog, onClose, onSaved } = renderDialog();
    const userRole = within(dialog).getByRole('button', { name: 'Usuario' });
    expect(userRole).toHaveAttribute('aria-pressed', 'true');
    await fill(dialog, { name: ' Ana ', email: ' Ana@Example.COM ', password: '12345678' });

    await submit(dialog);

    expect(await screen.findByText('Usuario creado')).toBeInTheDocument();
    expect(requests[0]?.url).toBe('/users');
    expect(JSON.parse(requests[0]?.data as string)).toEqual({
      name: 'Ana',
      email: 'ana@example.com',
      password: '12345678',
      role: 'USER',
    });
    expect(onSaved).toHaveBeenCalledWith(expect.objectContaining({ id: 'new' }));
    expect(onClose).toHaveBeenCalled();
  });

  it('sends ADMIN after toggling the role', async () => {
    const { dialog } = renderDialog();
    const admin = within(dialog).getByRole('button', { name: 'Administrador' });
    await userEvent.click(admin);
    expect(admin).toHaveAttribute('aria-pressed', 'true');
    expect(within(dialog).getByRole('button', { name: 'Usuario' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
    await fill(dialog, { name: 'Ana', email: 'ana@example.com', password: '12345678' });

    await submit(dialog);

    await screen.findByText('Usuario creado');
    expect(JSON.parse(requests[0]?.data as string)).toMatchObject({ role: 'ADMIN' });
  });

  it('puts a duplicated email on Correo and stays open', async () => {
    failure = { status: 409, code: 'EMAIL_ALREADY_EXISTS', message: 'Duplicado.' };
    const { dialog, onClose, onSaved } = renderDialog();
    await fill(dialog, { name: 'Ana', email: 'ana@example.com', password: '12345678' });

    await submit(dialog);

    expect(
      await within(dialog).findByText('Ya existe un usuario con este correo.'),
    ).toBeInTheDocument();
    expect(within(dialog).getByLabelText('Correo electrónico')).toHaveAttribute(
      'aria-invalid',
      'true',
    );
    expect(onSaved).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });

  it('maps validation details to fields and toasts the rest', async () => {
    failure = {
      status: 400,
      code: 'VALIDATION_ERROR',
      message: 'Datos inválidos.',
      details: [
        { path: 'name', message: 'Nombre inválido.' },
        { path: 'extra', message: 'Campo no permitido.' },
      ],
    };
    const { dialog, onClose } = renderDialog();
    await fill(dialog, { name: 'Ana', email: 'ana@example.com', password: '12345678' });

    await submit(dialog);

    expect(await within(dialog).findByText('Nombre inválido.')).toBeInTheDocument();
    expect(await screen.findByText('Campo no permitido.')).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
  });
});

describe('UserFormDialog in edit mode', () => {
  function renderEdit(currentUserId = 'u1') {
    const onClose = vi.fn();
    const onSaved = vi.fn();
    const ui = (open: boolean) => (
      <NotificationProvider>
        <UserFormDialog
          open={open}
          mode="edit"
          userId="u7"
          currentUserId={currentUserId}
          onClose={onClose}
          onSaved={onSaved}
        />
      </NotificationProvider>
    );
    const { rerender } = render(ui(true));
    const reopen = () => {
      rerender(ui(false));
      rerender(ui(true));
    };
    return { onClose, onSaved, reopen };
  }

  const editDialog = () => screen.findByRole('dialog', { name: 'Editar usuario' });
  const save = (dialog: HTMLElement) =>
    userEvent.click(within(dialog).getByRole('button', { name: 'Guardar cambios' }));

  it('loads the user and prefills name, role and the read-only email', async () => {
    renderEdit();
    const dialog = await editDialog();

    expect(await within(dialog).findByLabelText('Nombre')).toHaveValue('Eva');
    expect(within(dialog).getByText('eva@example.com')).toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: 'Usuario' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(within(dialog).queryByLabelText('Correo electrónico')).not.toBeInTheDocument();
    expect(within(dialog).queryByLabelText('Contraseña')).not.toBeInTheDocument();
    expect(requests[0]?.url).toBe('/users/u7');
  });

  it('sends only the changed role', async () => {
    const { onSaved, onClose } = renderEdit();
    const dialog = await editDialog();
    await userEvent.click(await within(dialog).findByRole('button', { name: 'Administrador' }));

    await save(dialog);

    expect(await screen.findByText('Usuario actualizado')).toBeInTheDocument();
    const patch = requests.at(-1);
    expect([patch?.method, patch?.url]).toEqual(['patch', '/users/u7']);
    expect(JSON.parse(patch?.data as string)).toEqual({ role: 'ADMIN' });
    expect(onSaved).toHaveBeenCalledWith(expect.objectContaining({ role: 'ADMIN' }));
    expect(onClose).toHaveBeenCalled();
  });

  it('closes without a request when nothing changed', async () => {
    const { onClose, onSaved } = renderEdit();
    const dialog = await editDialog();
    await within(dialog).findByLabelText('Nombre');

    await save(dialog);

    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(requests.filter((request) => request.method === 'patch')).toHaveLength(0);
    expect(onSaved).not.toHaveBeenCalled();
  });

  it('locks the role when editing yourself and explains a self conflict', async () => {
    failure = { status: 409, code: 'CANNOT_MODIFY_SELF', message: 'Self.' };
    renderEdit('u7');
    const dialog = await editDialog();

    expect(await within(dialog).findByRole('button', { name: 'Administrador' })).toBeDisabled();
    expect(within(dialog).getByRole('button', { name: 'Usuario' })).toBeDisabled();
    await userEvent.type(within(dialog).getByLabelText('Nombre'), ' Ruiz');
    await save(dialog);

    expect(
      await screen.findByText('No puedes inactivarte ni cambiar tu propio rol.'),
    ).toBeInTheDocument();
    expect(JSON.parse(requests.at(-1)?.data as string)).toEqual({ name: 'Eva Ruiz' });
  });

  it('shows the load error and retries', async () => {
    loadFails = true;
    renderEdit();
    const dialog = await editDialog();

    const retry = await within(dialog).findByRole('button', { name: 'Reintentar' });
    expect(within(dialog).queryByLabelText('Nombre')).not.toBeInTheDocument();
    loadFails = false;
    await userEvent.click(retry);

    expect(await within(dialog).findByLabelText('Nombre')).toHaveValue('Eva');
  });

  it('fetches the user again on every opening', async () => {
    const { reopen } = renderEdit();
    await within(await editDialog()).findByLabelText('Nombre');

    reopen();

    await waitFor(() =>
      expect(requests.filter((request) => request.method === 'get')).toHaveLength(2),
    );
  });
});
