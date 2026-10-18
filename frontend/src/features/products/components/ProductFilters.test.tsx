import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { ProductFilters as Filters } from '../hooks/useProducts';
import { ProductFilters } from './ProductFilters';

function renderFilters(filters: Filters, dateRangeError = false, categories = ['Hogar', 'Libros']) {
  const handlers = {
    onSearchChange: vi.fn(),
    onCategoryChange: vi.fn(),
    onFromChange: vi.fn(),
    onToChange: vi.fn(),
    onClear: vi.fn(),
  };
  render(
    <ProductFilters
      filters={filters}
      categories={categories}
      dateRangeError={dateRangeError}
      {...handlers}
    />,
  );
  return handlers;
}

const empty: Filters = { search: '', category: '', from: '', to: '' };

describe('ProductFilters', () => {
  it('calls the setters and disables Limpiar filtros when nothing is set', () => {
    const handlers = renderFilters(empty);

    const search = screen.getByLabelText('Buscar por título');
    expect(search).toHaveAttribute('placeholder', 'Ej. teclado');
    fireEvent.change(search, { target: { value: 'tecla' } });
    fireEvent.change(screen.getByLabelText('Desde'), { target: { value: '2025-01-01' } });
    fireEvent.change(screen.getByLabelText('Hasta'), { target: { value: '2025-01-31' } });

    expect(handlers.onSearchChange).toHaveBeenCalledWith('tecla');
    expect(handlers.onFromChange).toHaveBeenCalledWith('2025-01-01');
    expect(handlers.onToChange).toHaveBeenCalledWith('2025-01-31');
    expect(screen.getByRole('button', { name: 'Limpiar filtros' })).toBeDisabled();
  });

  it('enables Limpiar filtros once a filter is set', () => {
    const handlers = renderFilters({ ...empty, to: '2025-01-31' });

    fireEvent.click(screen.getByRole('button', { name: 'Limpiar filtros' }));

    expect(handlers.onClear).toHaveBeenCalledOnce();
  });

  it('lists every category after Todas and reports the chosen one', () => {
    const handlers = renderFilters(empty);

    const select = screen.getByLabelText('Categoría');
    expect(select).toHaveValue('');
    expect(
      Array.from((select as HTMLSelectElement).options).map((option) => option.textContent),
    ).toEqual(['Todas', 'Hogar', 'Libros']);
    fireEvent.change(select, { target: { value: 'Libros' } });

    expect(handlers.onCategoryChange).toHaveBeenCalledWith('Libros');
  });

  it('enables Limpiar filtros when only a category is chosen', () => {
    renderFilters({ ...empty, category: 'Hogar' });

    expect(screen.getByLabelText('Categoría')).toHaveValue('Hogar');
    expect(screen.getByRole('button', { name: 'Limpiar filtros' })).toBeEnabled();
  });

  it('keeps showing a chosen category that is no longer listed', () => {
    renderFilters({ ...empty, category: 'Jardín' }, false, ['Hogar']);

    expect(screen.getByLabelText('Categoría')).toHaveValue('Jardín');
  });

  it('marks Desde with the date range error', () => {
    renderFilters({ ...empty, from: '2025-02-01', to: '2025-01-31' }, true);

    const from = screen.getByLabelText('Desde');
    expect(from).toHaveAttribute('aria-invalid', 'true');
    expect(from).toHaveAccessibleDescription('La fecha inicial no puede ser posterior a la final');
  });
});
