import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { FormDialog } from '.';

function setViewport(matches: boolean) {
  vi.stubGlobal('matchMedia', (query: string): MediaQueryList => ({
    matches,
    media: query,
    onchange: null,
    addListener: () => undefined,
    removeListener: () => undefined,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    dispatchEvent: () => false,
  }));
}

function renderDialog(submitting = false) {
  const onClose = vi.fn();
  const onSubmit = vi.fn();
  render(
    <FormDialog
      open
      title="Nuevo producto"
      subtitle="Completa los datos del producto"
      submitLabel="Guardar producto"
      submitting={submitting}
      onClose={onClose}
      onSubmit={onSubmit}
    >
      <label htmlFor="title">Título</label>
      <input id="title" />
    </FormDialog>,
  );
  return { onClose, onSubmit };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('FormDialog', () => {
  it('shows the title and subtitle in a labelled dialog that is not full screen on desktop', () => {
    setViewport(false);
    renderDialog();

    const dialog = screen.getByRole('dialog', { name: 'Nuevo producto' });
    expect(dialog).toHaveTextContent('Completa los datos del producto');
    expect(dialog).not.toHaveClass('MuiDialog-paperFullScreen');
  });

  it('renders full screen below sm', () => {
    setViewport(true);
    renderDialog();

    expect(screen.getByRole('dialog')).toHaveClass('MuiDialog-paperFullScreen');
  });

  it('submits when Enter is pressed in a field', async () => {
    const { onSubmit, onClose } = renderDialog();

    await userEvent.type(screen.getByLabelText('Título'), 'Teclado{Enter}');

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onClose).not.toHaveBeenCalled();
  });

  it('submits from the primary button', async () => {
    const { onSubmit } = renderDialog();

    await userEvent.click(screen.getByRole('button', { name: 'Guardar producto' }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('calls onClose from Cancelar, the close icon and Escape', async () => {
    const { onClose, onSubmit } = renderDialog();

    await userEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    await userEvent.click(screen.getByRole('button', { name: 'Cerrar' }));
    await userEvent.keyboard('{Escape}');

    expect(onClose).toHaveBeenCalledTimes(3);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('disables submit, shows progress and ignores closing while submitting', async () => {
    const { onClose, onSubmit } = renderDialog(true);

    expect(screen.getByRole('button', { name: 'Guardar producto' })).toBeDisabled();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Cerrar' })).toBeDisabled();

    await userEvent.keyboard('{Escape}');
    await userEvent.type(screen.getByLabelText('Título'), '{Enter}');

    expect(onClose).not.toHaveBeenCalled();
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
