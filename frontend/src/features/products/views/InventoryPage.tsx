import AddIcon from '@mui/icons-material/Add';
import DeleteOutlined from '@mui/icons-material/DeleteOutlined';
import EditOutlined from '@mui/icons-material/EditOutlined';
import VisibilityOutlined from '@mui/icons-material/VisibilityOutlined';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useState } from 'react';
import { ErrorState } from '../../../shared/components/states';
import { useAuth } from '../../auth/context/use-auth';
import type { Product } from '../api/products-api';
import { ProductDetailDrawer } from '../components/ProductDetailDrawer';
import { ProductFilters } from '../components/ProductFilters';
import { ProductFormDialog } from '../components/ProductFormDialog';
import { ProductsTable } from '../components/ProductsTable';
import { useDeleteProduct } from '../hooks/useDeleteProduct';
import { useProducts } from '../hooks/useProducts';

const actionSx = { width: 44, height: 44, borderRadius: '10px' } as const;

export function InventoryPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const theme = useTheme();
  const isPhone = useMediaQuery(theme.breakpoints.down('sm'), { noSsr: true });
  const products = useProducts();
  const { filters } = products;
  const hasFilters = Object.values(filters).some((value) => value !== '');
  const [detail, setDetail] = useState<Product | null>(null);
  const [creating, setCreating] = useState(false);
  // The id outlives `open` so the dialog keeps its content during the closing transition.
  const [editing, setEditing] = useState({ id: '', open: false });
  const removeProduct = useDeleteProduct(products);

  function renderActions(product: Product) {
    if (!isAdmin) {
      return (
        <IconButton
          aria-label={`Ver detalle de ${product.title}`}
          onClick={() => setDetail(product)}
          sx={actionSx}
        >
          <VisibilityOutlined fontSize="small" />
        </IconButton>
      );
    }
    return (
      <>
        <IconButton
          aria-label={`Editar ${product.title}`}
          onClick={() => setEditing({ id: product.id, open: true })}
          sx={actionSx}
        >
          <EditOutlined fontSize="small" />
        </IconButton>
        <IconButton
          aria-label={`Eliminar ${product.title}`}
          onClick={() => void removeProduct(product)}
          sx={{ ...actionSx, color: 'error.main' }}
        >
          <DeleteOutlined fontSize="small" />
        </IconButton>
      </>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
      {isAdmin && (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          {isPhone ? (
            <IconButton
              aria-label="Nuevo producto"
              onClick={() => setCreating(true)}
              sx={{ ...actionSx, bgcolor: 'primary.main', color: 'primary.contrastText' }}
            >
              <AddIcon />
            </IconButton>
          ) : (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setCreating(true)}
              sx={{ px: 2.25, fontWeight: 700 }}
            >
              Nuevo producto
            </Button>
          )}
        </Box>
      )}
      <ProductFilters
        filters={filters}
        dateRangeError={products.dateRangeError}
        onSearchChange={products.setSearch}
        onFromChange={products.setFrom}
        onToChange={products.setTo}
        onClear={products.clearFilters}
      />
      {products.error ? (
        <ErrorState
          title="No pudimos cargar los productos"
          error={products.error}
          onRetry={products.reload}
        />
      ) : (
        <ProductsTable
          rows={products.rows}
          total={products.total}
          loading={products.loading}
          pagination={products.pagination}
          emptyMessage={
            hasFilters
              ? 'No hay productos que coincidan con los filtros'
              : 'Todavía no hay productos'
          }
          renderActions={renderActions}
        />
      )}
      <ProductDetailDrawer product={detail} onClose={() => setDetail(null)} />
      {isAdmin && (
        <>
          <ProductFormDialog
            open={creating}
            mode="create"
            onClose={() => setCreating(false)}
            onSaved={products.reload}
          />
          <ProductFormDialog
            open={editing.open}
            mode="edit"
            productId={editing.id}
            onClose={() => setEditing((current) => ({ ...current, open: false }))}
            onSaved={products.refresh}
          />
        </>
      )}
    </Box>
  );
}
