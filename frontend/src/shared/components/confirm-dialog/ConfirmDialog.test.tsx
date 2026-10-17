import { ThemeProvider } from '@mui/material/styles';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { theme } from '../../../app/theme';
import { ConfirmDialog, type ConfirmDialogProps } from '.';

// MUI paints contained buttons through CSS variables, which jsdom does not resolve.
function buttonColors(button: HTMLElement) {
  const styles = getComputedStyle(button);
  return {
    background: styles.getPropertyValue('--variant-containedBg').trim(),
    text: styles.getPropertyValue('--variant-containedColor').trim(),
  };
}

function renderDialog(props: Partial<ConfirmDialogProps> = {}) {
  const onConfirm = vi.fn();
  const onCancel = vi.fn();
  render(
    <ThemeProvider theme={theme}>
      <ConfirmDialog
        open
        title="¿Eliminar este producto?"
        message={<strong>Teclado mecánico</strong>}
        confirmLabel="Eliminar"
        onConfirm={onConfirm}
        onCancel={onCancel}
        {...props}
      />
    </ThemeProvider>,
  );
  return { onConfirm, onCancel };
}

describe('ConfirmDialog', () => {
  it('shows the title, message and labels in an alert dialog', () => {
    renderDialog();

    const dialog = screen.getByRole('alertdialog', { name: '¿Eliminar este producto?' });
    expect(dialog).toHaveAccessibleDescription('Teclado mecánico');
    expect(screen.getByRole('button', { name: 'Eliminar' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeInTheDocument();
  });

  it('fires the confirm and cancel callbacks', async () => {
    const { onConfirm, onCancel } = renderDialog({ cancelLabel: 'Volver' });

    await userEvent.click(screen.getByRole('button', { name: 'Eliminar' }));
    await userEvent.click(screen.getByRole('button', { name: 'Volver' }));

    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('uses the ochre primary button by default', () => {
    renderDialog();

    const confirm = screen.getByRole('button', { name: 'Eliminar' });
    expect(buttonColors(confirm)).toEqual({ background: '#D9A62E', text: '#24262B' });
  });

  it('uses the red error button with white text for the danger variant', () => {
    renderDialog({ variant: 'danger' });

    const confirm = screen.getByRole('button', { name: 'Eliminar' });
    expect(buttonColors(confirm)).toEqual({ background: '#A33A2E', text: '#FFFFFF' });
  });

  it('disables both actions and ignores Escape while loading', async () => {
    const { onConfirm, onCancel } = renderDialog({ loading: true });

    expect(screen.getByRole('button', { name: 'Eliminar' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeDisabled();
    await userEvent.keyboard('{Escape}');

    expect(onConfirm).not.toHaveBeenCalled();
    expect(onCancel).not.toHaveBeenCalled();
  });
});
