import { render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DataTable, type DataTableColumn } from '.';

interface Product {
  id: number;
  title: string;
  stock: number;
}

const products: Product[] = [
  { id: 1, title: 'Café molido', stock: 12 },
  { id: 2, title: 'Té verde', stock: 0 },
];

const columns: DataTableColumn<Product>[] = [
  { id: 'title', header: 'Título', field: 'title' },
  { id: 'stock', header: 'Stock', align: 'right', render: (row) => `${row.stock} u.` },
];

afterEach(() => {
  vi.restoreAllMocks();
});

describe('DataTable', () => {
  it('renders the headers and the cells from field and render', () => {
    render(<DataTable ariaLabel="Productos" columns={columns} rows={products} />);

    const table = screen.getByRole('table', { name: 'Productos' });
    const headers = within(table).getAllByRole('columnheader');
    expect(headers.map((header) => header.textContent)).toEqual(['Título', 'Stock']);

    const bodyRows = within(table).getAllByRole('row').slice(1);
    const cellTexts = bodyRows.map((row) =>
      within(row)
        .getAllByRole('cell')
        .map((cell) => cell.textContent),
    );
    expect(cellTexts).toEqual([
      ['Café molido', '12 u.'],
      ['Té verde', '0 u.'],
    ]);
  });

  it('keys the rows with a custom getRowId', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const rows = [
      { sku: 'A-1', name: 'Arroz' },
      { sku: 'B-2', name: 'Frijol' },
    ];

    render(
      <DataTable
        ariaLabel="Por SKU"
        columns={[{ id: 'name', header: 'Nombre', field: 'name' }]}
        rows={rows}
        getRowId={(row) => row.sku}
      />,
    );

    expect(screen.getByRole('cell', { name: 'Arroz' })).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: 'Frijol' })).toBeInTheDocument();
    expect(consoleError).not.toHaveBeenCalled();
  });

  it('shows the Spanish empty message when there are no rows', () => {
    render(<DataTable ariaLabel="Productos" columns={columns} rows={[]} />);

    expect(screen.getByRole('cell', { name: 'No hay registros para mostrar.' })).toHaveAttribute(
      'colspan',
      '2',
    );
    expect(screen.getAllByRole('columnheader')).toHaveLength(2);
  });

  it('shows a custom empty message', () => {
    render(
      <DataTable ariaLabel="Productos" columns={columns} rows={[]} emptyMessage="Sin productos" />,
    );

    expect(screen.getByRole('cell', { name: 'Sin productos' })).toBeInTheDocument();
    expect(screen.queryByText('No hay registros para mostrar.')).not.toBeInTheDocument();
  });

  it('shows a loading indication and keeps the header while loading', () => {
    render(<DataTable ariaLabel="Productos" columns={columns} rows={products} loading />);

    const table = screen.getByRole('table', { name: 'Productos' });
    expect(table).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByRole('status')).toHaveTextContent('Cargando registros…');
    expect(within(table).getAllByRole('columnheader')).toHaveLength(2);
    expect(screen.queryByText('Café molido')).not.toBeInTheDocument();
    expect(screen.queryByText('No hay registros para mostrar.')).not.toBeInTheDocument();
  });

  it('lets wide tables scroll horizontally inside their own box', () => {
    render(<DataTable ariaLabel="Productos" columns={columns} rows={products} minWidth={760} />);

    expect(screen.getByRole('region', { name: 'Productos' })).toHaveStyle({ overflowX: 'auto' });
    expect(screen.getByRole('table', { name: 'Productos' })).toHaveStyle({ minWidth: '760px' });
  });

  it('renders the footer inside the same card below the table', () => {
    render(
      <DataTable
        ariaLabel="Productos"
        columns={columns}
        rows={products}
        footer={<span>pie de tabla</span>}
      />,
    );

    const region = screen.getByRole('region', { name: 'Productos' });
    const footer = screen.getByText('pie de tabla');
    expect(region).not.toContainElement(footer);
    expect(region.parentElement).toContainElement(footer);
  });
});
