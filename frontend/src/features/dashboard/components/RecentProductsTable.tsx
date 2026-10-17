import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { Link } from 'react-router-dom';
import { DataTable, type DataTableColumn } from '../../../shared/components/data-table';
import { StatusChip } from '../../../shared/components/status-chip';
import { formatDate } from '../../../shared/format/date';
import { formatMoney } from '../../../shared/format/money';
import type { Product } from '../../products/api/products-api';

const TITLE = 'Últimos 5 productos creados';
const INVENTORY_PATH = '/inventory';

const columns: DataTableColumn<Product>[] = [
  {
    id: 'title',
    header: 'Título',
    render: ({ title }) => <Box sx={{ fontWeight: 600 }}>{title}</Box>,
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
      <Box component="span" sx={{ fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
        {formatMoney(price)}
      </Box>
    ),
  },
  {
    id: 'creationAt',
    header: 'Fecha de creación',
    render: ({ creationAt }) => (
      <Box component="span" sx={{ color: 'text.secondary' }}>
        {formatDate(creationAt)}
      </Box>
    ),
  },
];

export interface RecentProductsTableProps {
  products: Product[];
  loading?: boolean;
}

export function RecentProductsTable({ products, loading = false }: RecentProductsTableProps) {
  return (
    <Box component="section" aria-label="Actividad reciente" sx={{ display: 'grid', gap: 2 }}>
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 1.5,
        }}
      >
        <div>
          <Typography component="h2" sx={{ fontSize: 16, fontWeight: 700 }}>
            {TITLE}
          </Typography>
          <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>
            Ordenados por fecha de creación
          </Typography>
        </div>
        <Button
          component={Link}
          to={INVENTORY_PATH}
          variant="contained"
          color="primary"
          sx={{ px: 2, fontWeight: 700 }}
        >
          Ver inventario
        </Button>
      </Box>
      <DataTable
        ariaLabel={TITLE}
        columns={columns}
        rows={products}
        loading={loading}
        minWidth={560}
      />
    </Box>
  );
}
