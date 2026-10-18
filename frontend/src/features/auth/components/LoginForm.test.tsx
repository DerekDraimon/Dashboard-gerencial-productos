import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ApiError } from '../../../shared/api/api-error';
import { LoginForm, type LoginFormProps } from './LoginForm';

function renderForm(props: Partial<LoginFormProps> = {}) {
  const onSubmit = vi.fn();
  render(<LoginForm onSubmit={onSubmit} submitting={false} {...props} />);
  return onSubmit;
}

const emailInput = () => screen.getByLabelText('Correo electrónico');
const passwordInput = () => screen.getByLabelText('Contraseña');
const submitButton = () => screen.getByRole('button', { name: 'Entrar' });

describe('LoginForm', () => {
  it('shows required errors and does not submit an empty form', async () => {
    const onSubmit = renderForm();

    await userEvent.click(submitButton());

    expect(await screen.findByText('El correo es obligatorio.')).toBeInTheDocument();
    expect(screen.getByText('La contraseña es obligatoria.')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('rejects an email with an invalid format', async () => {
    const onSubmit = renderForm();

    await userEvent.type(emailInput(), 'admin@');
    await userEvent.type(passwordInput(), 'secreto123');
    await userEvent.click(submitButton());

    expect(await screen.findByText('Ingresa un correo válido.')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('submits the trimmed email and the password', async () => {
    const onSubmit = renderForm();

    await userEvent.type(emailInput(), '  admin@example.com ');
    await userEvent.type(passwordInput(), 'secreto123');
    await userEvent.click(submitButton());

    expect(onSubmit).toHaveBeenCalledWith({
      email: 'admin@example.com',
      password: 'secreto123',
    });
  });

  it.each([
    [new ApiError(401, 'INVALID_CREDENTIALS', 'x'), 'Correo o contraseña incorrectos.'],
    [
      new ApiError(403, 'USER_INACTIVE', 'x'),
      'Tu cuenta está inactiva. Contacta a un administrador.',
    ],
    [
      new ApiError(429, 'TOO_MANY_REQUESTS', 'x'),
      'Demasiados intentos. Espera unos minutos e intenta de nuevo.',
    ],
    [
      new ApiError(503, 'DATABASE_UNAVAILABLE', 'x'),
      'La base de datos no está disponible en este momento. Inténtalo de nuevo más tarde.',
    ],
    [new ApiError(500, 'SOMETHING_NEW', 'x'), 'Ocurrió un error inesperado. Inténtalo de nuevo.'],
    [
      new ApiError(0, 'NETWORK_ERROR', 'No se pudo conectar con el servidor.'),
      'No se pudo conectar con el servidor.',
    ],
  ])('shows the message for %s', (error, message) => {
    renderForm({ error });

    expect(screen.getByRole('alert')).toHaveTextContent(message);
  });

  it('shows nothing for a canceled request', () => {
    renderForm({ error: new ApiError(0, 'REQUEST_CANCELED', 'x') });

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('disables the button while submitting', () => {
    renderForm({ submitting: true });

    expect(screen.getByRole('button', { name: /Entrar/ })).toBeDisabled();
  });

  it('shows and hides the password', async () => {
    renderForm();
    expect(passwordInput()).toHaveAttribute('type', 'password');

    await userEvent.click(screen.getByRole('button', { name: 'Mostrar contraseña' }));
    expect(passwordInput()).toHaveAttribute('type', 'text');

    await userEvent.click(screen.getByRole('button', { name: 'Ocultar contraseña' }));
    expect(passwordInput()).toHaveAttribute('type', 'password');
  });
});
