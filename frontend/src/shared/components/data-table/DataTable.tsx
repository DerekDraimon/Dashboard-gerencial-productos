import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Skeleton from '@mui/material/Skeleton';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import type { SxProps, Theme } from '@mui/material/styles';
import type { Key, ReactNode } from 'react';

interface ColumnBase {
  id: string;
  header: ReactNode;
  align?: 'left' | 'center' | 'right';
  width?: number | string;
}

export type DataTableColumn<Row> = ColumnBase &
  (
    | { field: keyof Row & string; render?: never }
    | { render: (row: Row) => ReactNode; field?: never }
  );

export interface DataTableProps<Row> {
  ariaLabel: string;
  columns: DataTableColumn<Row>[];
  rows: Row[];
  getRowId?: (row: Row) => Key;
  loading?: boolean;
  emptyMessage?: ReactNode;
  minWidth?: number;
  footer?: ReactNode;
}

const HEADER_BACKGROUND = '#FAFAF8';
const ROW_DIVIDER = '#ECEDE8';
const LOADING_ROWS = 5;

const visuallyHidden: SxProps<Theme> = {
  position: 'absolute',
  width: '1px',
  height: '1px',
  overflow: 'hidden',
  clip: 'rect(0 0 0 0)',
  whiteSpace: 'nowrap',
};

const cellSx: SxProps<Theme> = {
  fontSize: 13,
  px: 1.5,
  '&:first-of-type': { pl: 2.5 },
  '&:last-of-type': { pr: 2.5 },
};

const headerCellSx: SxProps<Theme> = {
  ...cellSx,
  py: 1.75,
  fontWeight: 600,
  color: 'text.secondary',
  borderBottom: '1px solid',
  borderColor: 'divider',
  whiteSpace: 'nowrap',
};

const bodyCellSx: SxProps<Theme> = {
  ...cellSx,
  py: 1.5,
  borderBottom: `1px solid ${ROW_DIVIDER}`,
};

function defaultRowId(row: unknown, index: number): Key {
  const id = (row as { id?: unknown }).id;
  return typeof id === 'string' || typeof id === 'number' ? id : index;
}

function renderCell<Row>(column: DataTableColumn<Row>, row: Row): ReactNode {
  if (column.render) return column.render(row);
  const value = row[column.field];
  return value === null || value === undefined ? '' : String(value);
}

export function DataTable<Row>({
  ariaLabel,
  columns,
  rows,
  getRowId,
  loading = false,
  emptyMessage = 'No hay registros para mostrar.',
  minWidth,
  footer,
}: DataTableProps<Row>) {
  let body: ReactNode;
  if (loading) {
    body = Array.from({ length: LOADING_ROWS }, (_, index) => (
      <TableRow key={index}>
        {columns.map((column) => (
          <TableCell key={column.id} sx={bodyCellSx}>
            <Skeleton variant="text" />
          </TableCell>
        ))}
      </TableRow>
    ));
  } else if (rows.length === 0) {
    body = (
      <TableRow>
        <TableCell
          colSpan={columns.length}
          align="center"
          sx={{ ...bodyCellSx, py: 5, color: 'text.secondary', borderBottom: 'none' }}
        >
          {emptyMessage}
        </TableCell>
      </TableRow>
    );
  } else {
    body = rows.map((row, index) => (
      <TableRow key={getRowId ? getRowId(row) : defaultRowId(row, index)}>
        {columns.map((column) => (
          <TableCell key={column.id} align={column.align} sx={bodyCellSx}>
            {renderCell(column, row)}
          </TableCell>
        ))}
      </TableRow>
    ));
  }

  return (
    <Card sx={{ overflow: 'hidden' }}>
      <Box role="region" aria-label={ariaLabel} tabIndex={0} sx={{ overflowX: 'auto' }}>
        <Table aria-label={ariaLabel} aria-busy={loading} sx={{ minWidth }}>
          <TableHead>
            <TableRow sx={{ backgroundColor: HEADER_BACKGROUND }}>
              {columns.map((column) => (
                <TableCell
                  key={column.id}
                  align={column.align}
                  sx={{ ...headerCellSx, width: column.width }}
                >
                  {column.header}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>{body}</TableBody>
        </Table>
      </Box>
      {loading && (
        <Box role="status" sx={visuallyHidden}>
          Cargando registros…
        </Box>
      )}
      {footer}
    </Card>
  );
}
