import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ApiError } from '../../api/api-error';
import { EmptyState, ErrorState, LoadingState } from '.';

describe('LoadingState', () => {
  it('announces the label as a status', () => {
    render(<LoadingState label="Cargando productos…" />);

    expect(screen.getByRole('status')).toHaveTextContent('Cargando productos…');
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('has an accessible name without a label', () => {
    render(<LoadingState />);

    expect(screen.getByRole('status', { name: 'Cargando' })).toBeInTheDocument();
  });
});

describe('EmptyState', () => {
  it('renders the title, description and action', () => {
    render(
      <EmptyState
        title="Aún no hay productos"
        description="Crea el primero para empezar."
        action={<button>Nuevo producto</button>}
      />,
    );

    expect(screen.getByRole('heading', { name: 'Aún no hay productos' })).toBeInTheDocument();
    expect(screen.getByText('Crea el primero para empezar.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Nuevo producto' })).toBeInTheDocument();
  });
});

describe('ErrorState', () => {
  it('shows the ApiError message and retries', async () => {
    const onRetry = vi.fn();
    render(
      <ErrorState
        error={new ApiError(500, 'INTERNAL_ERROR', 'No se pudo cargar el inventario.')}
        onRetry={onRetry}
      />,
    );

    expect(screen.getByRole('alert')).toHaveTextContent('No se pudo cargar el inventario.');
    await userEvent.click(screen.getByRole('button', { name: 'Reintentar' }));

    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('renders an optional secondary action next to Reintentar', async () => {
    const onRetry = vi.fn();
    const onSecondary = vi.fn();
    render(
      <ErrorState
        error={new Error('boom')}
        onRetry={onRetry}
        secondaryAction={{ label: 'Volver', onClick: onSecondary }}
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Volver' }));

    expect(onSecondary).toHaveBeenCalledTimes(1);
    expect(onRetry).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Reintentar' })).toBeInTheDocument();
  });

  it('shows the connection message for NETWORK_ERROR', () => {
    render(<ErrorState error={new ApiError(0, 'NETWORK_ERROR', 'Network Error')} />);

    expect(screen.getByRole('alert')).toHaveTextContent(
      'No pudimos conectar con el servidor. Revisa tu conexión e intenta de nuevo.',
    );
    expect(screen.queryByRole('button', { name: 'Reintentar' })).not.toBeInTheDocument();
  });

  it('shows a Spanish default for errors that are not ApiError', () => {
    render(<ErrorState error={new Error('boom')} />);

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Ocurrió un error inesperado. Inténtalo de nuevo.',
    );
    expect(screen.queryByText('boom')).not.toBeInTheDocument();
  });

  it('renders nothing for a canceled request', () => {
    const { container } = render(
      <ErrorState error={new ApiError(0, 'REQUEST_CANCELED', 'La solicitud fue cancelada.')} />,
    );

    expect(container).toBeEmptyDOMElement();
  });
});
