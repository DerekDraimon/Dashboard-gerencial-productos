import VisibilityOutlined from '@mui/icons-material/VisibilityOutlined';
import Box from '@mui/material/Box';
import { useWatch, type Control } from 'react-hook-form';
import type { ProductFormValues } from './ProductFormDialog';
import { ProductDetail } from './ProductDetail';

export interface ProductFormPreviewProps {
  control: Control<ProductFormValues>;
}

function toNumber(text: string): number {
  const normalized = text.trim().replace(',', '.');
  return normalized === '' ? Number.NaN : Number(normalized);
}

export function ProductFormPreview({ control }: ProductFormPreviewProps) {
  const values = useWatch({ control });
  const stock = Number.parseInt(values.stock ?? '', 10);

  return (
    <Box component="aside" aria-label="Vista previa del detalle">
      <Box
        sx={{
          border: '2px solid',
          borderColor: 'text.primary',
          borderRadius: '16px',
          overflow: 'hidden',
          bgcolor: 'background.paper',
          boxShadow: '0 6px 18px rgba(36, 38, 43, 0.12)',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            px: 1.75,
            py: 1.25,
            bgcolor: 'text.primary',
            color: '#F5F6F3',
            fontSize: 12,
            fontWeight: 600,
          }}
        >
          <VisibilityOutlined sx={{ fontSize: 16 }} />
          Vista previa · Detalle del producto
        </Box>
        <Box sx={{ p: 2 }}>
          <ProductDetail
            compact
            product={{
              title: values.title?.trim() || 'Título del producto',
              description: values.description?.trim() ?? '',
              price: toNumber(values.price ?? ''),
              category: values.category?.trim() || 'Categoría',
              images: (values.images ?? []).filter((image): image is string => Boolean(image)),
              stock: Number.isNaN(stock) ? 0 : stock,
            }}
          />
        </Box>
      </Box>
    </Box>
  );
}
