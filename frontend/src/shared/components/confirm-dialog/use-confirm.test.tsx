import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { ConfirmProvider } from './ConfirmProvider';
import { useConfirm } from './use-confirm';

function Trigger() {
  const confirm = useConfirm();
  const [result, setResult] = useState('sin respuesta');

  async function ask() {
    const ok = await confirm({
      title: '¿Inactivar a Ana?',
      message: 'No podrá iniciar sesión.',
      confirmLabel: 'Inactivar',
    });
    setResult(ok ? 'confirmado' : 'cancelado');
  }

  return (
    <>
      <button onClick={() => void ask()}>Preguntar</button>
      <output>{result}</output>
    </>
  );
}

function renderTrigger() {
  render(
    <ConfirmProvider>
      <Trigger />
    </ConfirmProvider>,
  );
}

async function openConfirm() {
  await userEvent.click(screen.getByRole('button', { name: 'Preguntar' }));
  return screen.findByRole('alertdialog', { name: '¿Inactivar a Ana?' });
}

describe('useConfirm', () => {
  it('resolves true when the user confirms', async () => {
    renderTrigger();
    await openConfirm();

    await userEvent.click(screen.getByRole('button', { name: 'Inactivar' }));

    expect(await screen.findByText('confirmado')).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument());
  });

  it('resolves false when the user cancels', async () => {
    renderTrigger();
    await openConfirm();

    await userEvent.click(screen.getByRole('button', { name: 'Cancelar' }));

    expect(await screen.findByText('cancelado')).toBeInTheDocument();
  });

  it('resolves false when the user presses Escape', async () => {
    renderTrigger();
    await openConfirm();

    await userEvent.keyboard('{Escape}');

    expect(await screen.findByText('cancelado')).toBeInTheDocument();
  });

  it('throws when used outside the provider', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    expect(() => render(<Trigger />)).toThrow('useConfirm must be used inside ConfirmProvider');
    consoleError.mockRestore();
  });
});
