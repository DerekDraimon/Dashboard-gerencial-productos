import CloseIcon from '@mui/icons-material/Close';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import { useId } from 'react';
import type { Product } from '../api/products-api';
import { ProductDetail } from './ProductDetail';

export interface ProductDetailDrawerProps {
  product: Product | null;
  onClose: () => void;
}

export function ProductDetailDrawer({ product, onClose }: ProductDetailDrawerProps) {
  const titleId = useId();

  return (
    <Drawer
      anchor="right"
      open={product !== null}
      onClose={onClose}
      slotProps={{
        paper: {
          role: 'dialog',
          'aria-modal': true,
          'aria-labelledby': titleId,
          sx: { width: { xs: '100%', sm: 440 } },
        },
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 3,
          py: 1.5,
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Box component="span" sx={{ fontSize: 13, fontWeight: 600, color: 'text.secondary' }}>
          Detalle del producto
        </Box>
        <IconButton
          aria-label="Cerrar detalle"
          onClick={onClose}
          sx={{ width: 44, height: 44, borderRadius: '10px' }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>
      <Box sx={{ p: 3 }}>
        {product && <ProductDetail key={product.id} product={product} titleId={titleId} />}
      </Box>
    </Drawer>
  );
}
