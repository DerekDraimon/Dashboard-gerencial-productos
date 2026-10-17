import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { FilterBar, FilterField } from '.';

function SearchField() {
  return (
    <FilterField label="Buscar por título" htmlFor="title-filter">
      <input id="title-filter" type="search" />
    </FilterField>
  );
}

describe('FilterBar', () => {
  it('renders its fields inside a labelled search landmark without a clear button', () => {
    render(
      <FilterBar>
        <SearchField />
      </FilterBar>,
    );

    const search = screen.getByRole('search', { name: 'Filtros' });
    expect(within(search).getByLabelText('Buscar por título')).toHaveAttribute('type', 'search');
    expect(screen.queryByRole('button', { name: 'Limpiar filtros' })).not.toBeInTheDocument();
  });

  it('accepts a custom accessible name', () => {
    render(
      <FilterBar ariaLabel="Filtros de usuarios">
        <SearchField />
      </FilterBar>,
    );

    expect(screen.getByRole('search', { name: 'Filtros de usuarios' })).toBeInTheDocument();
  });

  it('calls onClear from the "Limpiar filtros" button', async () => {
    const onClear = vi.fn();
    render(
      <FilterBar onClear={onClear}>
        <SearchField />
      </FilterBar>,
    );

    const clear = screen.getByRole('button', { name: 'Limpiar filtros' });
    expect(clear).toBeEnabled();
    await userEvent.click(clear);

    expect(onClear).toHaveBeenCalledTimes(1);
  });

  it('disables the clear button when there is nothing to clear', async () => {
    const onClear = vi.fn();
    render(
      <FilterBar onClear={onClear} canClear={false}>
        <SearchField />
      </FilterBar>,
    );

    const clear = screen.getByRole('button', { name: 'Limpiar filtros' });
    expect(clear).toBeDisabled();
    await userEvent.setup({ pointerEventsCheck: 0 }).click(clear);

    expect(onClear).not.toHaveBeenCalled();
  });
});
