import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { NotificationProvider } from './NotificationProvider';
import { useNotify } from './use-notify';

function Trigger() {
  const notify = useNotify();

  return (
    <>
      <button onClick={() => notify.success('Producto guardado')}>Guardar</button>
      <button onClick={() => notify.error('No se pudo guardar')}>Fallar</button>
      <button
        onClick={() => {
          notify.success('Producto guardado');
          notify.error('No se pudo guardar');
        }}
      >
        Ambos
      </button>
    </>
  );
}

function renderTrigger() {
  render(
    <NotificationProvider>
      <Trigger />
    </NotificationProvider>,
  );
}

describe('useNotify', () => {
  it('shows a success message', async () => {
    renderTrigger();

    await userEvent.click(screen.getByRole('button', { name: 'Guardar' }));

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Producto guardado');
    expect(alert).toHaveClass('MuiAlert-colorSuccess');
  });

  it('shows an error message', async () => {
    renderTrigger();

    await userEvent.click(screen.getByRole('button', { name: 'Fallar' }));

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('No se pudo guardar');
    expect(alert).toHaveClass('MuiAlert-colorError');
  });

  it('queues notifications raised at the same time and shows them in order', async () => {
    renderTrigger();

    await userEvent.click(screen.getByRole('button', { name: 'Ambos' }));

    const first = await screen.findByRole('alert');
    expect(first).toHaveTextContent('Producto guardado');
    expect(first).toHaveClass('MuiAlert-colorSuccess');

    await userEvent.click(within(first).getByRole('button', { name: 'Close' }));

    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('No se pudo guardar'));
    expect(screen.getByRole('alert')).toHaveClass('MuiAlert-colorError');
  });
});
