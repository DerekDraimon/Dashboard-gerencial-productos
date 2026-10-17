import { render, screen } from '@testing-library/react';
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
});
