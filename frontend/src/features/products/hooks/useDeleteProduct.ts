import { useCallback } from 'react';
import { ApiError } from '../../../shared/api/api-error';
import { useConfirm } from '../../../shared/components/confirm-dialog';
import { useNotify } from '../../../shared/feedback/use-notify';
import { deleteProduct, type Product } from '../api/products-api';
import type { UseProductsResult } from './useProducts';

const UNEXPECTED_ERROR = 'No se pudo eliminar el producto. Inténtalo de nuevo.';

export function useDeleteProduct(products: UseProductsResult): (product: Product) => Promise<void> {
  const confirm = useConfirm();
  const notify = useNotify();
  const { rows, pagination, removeLocally, refresh } = products;

  return useCallback(
    async (product: Product) => {
      const confirmed = await confirm({
        title: '¿Eliminar este producto?',
        message: `«${product.title}» se eliminará del inventario. Esta acción no se puede deshacer.`,
        confirmLabel: 'Eliminar',
        variant: 'danger',
      });
      if (!confirmed) return;

      try {
        await deleteProduct(product.id);
      } catch (error) {
        notify.error(error instanceof ApiError ? error.message : UNEXPECTED_ERROR);
        return;
      }

      const pageBecomesEmpty = rows.length === 1 && pagination.offset > 0;
      removeLocally(product.id);
      notify.success('Producto eliminado');
      if (pageBecomesEmpty) pagination.previous();
      else refresh();
    },
    [confirm, notify, rows, pagination, removeLocally, refresh],
  );
}
