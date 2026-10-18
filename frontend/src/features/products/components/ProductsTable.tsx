import Box from '@mui/material/Box';
import type { ReactNode } from 'react';
import {
  DataTable,
  TablePaginationFooter,
  type DataTableColumn,
} from '../../../shared/components/data-table';
import { StatusChip } from '../../../shared/components/status-chip';
import { formatDate } from '../../../shared/format/date';
import { formatMoney } from '../../../shared/format/money';
import type { Pagination } from '../../../shared/hooks';
import type { Product } from '../api/products-api';
import { ProductImage } from './ProductImage';

export interface ProductsTableProps {
  rows: Product[];
  total: number;
  loading: boolean;
  pagination: Pick<Pagination, 'offset' | 'limit' | 'setOffset' | 'setLimit'>;
  emptyMessage: string;
  renderActions: (product: Product) => ReactNode;
}

const numericSx = { fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' } as const;

export function ProductsTable({
  rows,
  total,
  loading,
  pagination,
  emptyMessage,
  renderActions,
}: ProductsTableProps) {
  const columns: DataTableColumn<Product>[] = [
    {
      id: 'title',
      header: 'Título',
      render: ({ title, images }) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <ProductImage src={images[0]} alt={title} />
          <Box component="span" sx={{ fontWeight: 600 }}>
            {title}
          </Box>
        </Box>
      ),
    },
    {
      id: 'category',
      header: 'Categoría',
      render: ({ category }) => <StatusChip label={category} variant="neutral" />,
    },
    {
      id: 'price',
      header: 'Precio',
      align: 'right',
      render: ({ price }) => (
        <Box component="span" sx={numericSx}>
          {formatMoney(price)}
        </Box>
      ),
    },
    {
      id: 'stock',
      header: 'Stock',
      align: 'right',
      render: ({ stock }) => (
        <Box component="span" sx={numericSx}>
          {stock}
        </Box>
      ),
    },
    {
      id: 'creationAt',
      header: 'Fecha de creación',
      render: ({ creationAt }) => (
        <Box component="span" sx={{ color: 'text.secondary', whiteSpace: 'nowrap' }}>
          {formatDate(creationAt)}
        </Box>
      ),
    },
    {
      id: 'actions',
      header: 'Acciones',
      align: 'right',
      render: (product) => (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
          {renderActions(product)}
        </Box>
      ),
    },
  ];

  return (
    <DataTable
      ariaLabel="Productos"
      columns={columns}
      rows={rows}
      loading={loading}
      emptyMessage={emptyMessage}
      minWidth={680}
      footer={
        <TablePaginationFooter
          offset={pagination.offset}
          limit={pagination.limit}
          total={total}
          onOffsetChange={pagination.setOffset}
          onLimitChange={pagination.setLimit}
        />
      }
    />
  );
}
