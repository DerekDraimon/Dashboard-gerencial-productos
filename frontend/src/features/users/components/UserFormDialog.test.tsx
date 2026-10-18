import { render, screen, within } from '@testing-library/react';
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

const adapter: AxiosAdapter = (config) => {
  requests.push(config);
  if (failure) {
    const { status, ...error } = failure;
    const response = { status, statusText: '', headers: {}, config, data: { error } };
    return Promise.reject(new AxiosError('Failed', 'ERR', config, null, response));
  }
  const body = JSON.parse(config.data as string) as Omit<User, 'id'>;
  const data = { ...body, id: 'new', active: true, creationAt: '', updatedAt: '' };
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
      await within(dialog).findByText('La contraseña admite máximo 72 bytes.'),
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
