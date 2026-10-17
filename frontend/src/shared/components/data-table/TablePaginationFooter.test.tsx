import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { TablePaginationFooter } from '.';

function renderFooter(props: { offset: number; limit: number; total: number }) {
  const onOffsetChange = vi.fn();
  const onLimitChange = vi.fn();
  render(
    <TablePaginationFooter
      {...props}
      onOffsetChange={onOffsetChange}
      onLimitChange={onLimitChange}
    />,
  );
  return {
    onOffsetChange,
    onLimitChange,
    previous: screen.getByRole('button', { name: 'Página anterior' }),
    next: screen.getByRole('button', { name: 'Página siguiente' }),
  };
}

describe('TablePaginationFooter', () => {
  it('shows the visible range and moves to the next and previous page', async () => {
    const { previous, next, onOffsetChange } = renderFooter({ offset: 10, limit: 10, total: 45 });

    expect(screen.getByText('Mostrando 11–20 de 45')).toBeInTheDocument();
    expect(previous).toBeEnabled();
    expect(next).toBeEnabled();

    await userEvent.click(next);
    expect(onOffsetChange).toHaveBeenLastCalledWith(20);

    await userEvent.click(previous);
    expect(onOffsetChange).toHaveBeenLastCalledWith(0);
    expect(onOffsetChange).toHaveBeenCalledTimes(2);
  });

  it('disables previous on the first page', () => {
    const { previous, next } = renderFooter({ offset: 0, limit: 10, total: 45 });

    expect(screen.getByText('Mostrando 1–10 de 45')).toBeInTheDocument();
    expect(previous).toBeDisabled();
    expect(next).toBeEnabled();
  });

  it('disables next on the last page and caps the range at the total', () => {
    const { previous, next } = renderFooter({ offset: 40, limit: 10, total: 45 });

    expect(screen.getByText('Mostrando 41–45 de 45')).toBeInTheDocument();
    expect(previous).toBeEnabled();
    expect(next).toBeDisabled();
  });

  it('disables next when the last page is exactly full', () => {
    const { next } = renderFooter({ offset: 40, limit: 10, total: 50 });

    expect(screen.getByText('Mostrando 41–50 de 50')).toBeInTheDocument();
    expect(next).toBeDisabled();
  });

  it('shows "0 resultados" and disables both buttons when empty', () => {
    const { previous, next } = renderFooter({ offset: 0, limit: 10, total: 0 });

    expect(screen.getByText('0 resultados')).toBeInTheDocument();
    expect(screen.queryByText(/Mostrando/)).not.toBeInTheDocument();
    expect(previous).toBeDisabled();
    expect(next).toBeDisabled();
  });

  it('calls onLimitChange when "Filas por página" changes', async () => {
    const { onLimitChange, onOffsetChange } = renderFooter({ offset: 10, limit: 10, total: 45 });
    const select = screen.getByLabelText('Filas por página');

    expect(select).toHaveValue('10');
    expect(
      Array.from(select.querySelectorAll('option')).map((option) => option.textContent),
    ).toEqual(['10', '25', '50']);

    await userEvent.selectOptions(select, '25');

    expect(onLimitChange).toHaveBeenCalledWith(25);
    expect(onOffsetChange).not.toHaveBeenCalled();
  });
});
