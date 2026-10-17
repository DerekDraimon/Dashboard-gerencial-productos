import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import Typography from '@mui/material/Typography';
import { useState } from 'react';
import { StatusChip } from '../../../shared/components/status-chip';
import { formatDate } from '../../../shared/format/date';
import { formatMoney } from '../../../shared/format/money';
import type { Product } from '../api/products-api';
import { ProductImage } from './ProductImage';

export type ProductDetailData = Omit<Product, 'id' | 'creationAt' | 'updatedAt'> &
  Partial<Pick<Product, 'creationAt' | 'updatedAt'>>;

export interface ProductDetailProps {
  product: ProductDetailData;
  compact?: boolean;
  titleId?: string;
}

const UNSAVED_DATE = 'Al guardar';

export function ProductDetail({ product, compact = false, titleId }: ProductDetailProps) {
  const [selected, setSelected] = useState(0);
  const images = product.images.slice(0, 10);
  const current = Math.min(selected, Math.max(0, images.length - 1));
  const facts = [
    { term: 'Stock', value: `${product.stock} unidades` },
    { term: 'Creado', value: product.creationAt ? formatDate(product.creationAt) : UNSAVED_DATE },
    {
      term: 'Actualizado',
      value: product.updatedAt ? formatDate(product.updatedAt) : UNSAVED_DATE,
    },
  ];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: compact ? 1.5 : 2.5 }}>
      <ProductImage
        src={images[current]}
        alt={product.title}
        aspectRatio="4 / 3"
        radius={compact ? 10 : 14}
      />
      {images.length > 1 && (
        <Box
          role="group"
          aria-label="Galería"
          sx={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', gap: 1 }}
        >
          {images.map((image, index) => (
            <ButtonBase
              key={`${index}-${image}`}
              aria-label={`Ver imagen ${index + 1}`}
              aria-pressed={index === current}
              onClick={() => setSelected(index)}
              sx={{
                borderRadius: '8px',
                outline: index === current ? '2px solid' : 'none',
                outlineColor: 'text.primary',
              }}
            >
              <ProductImage src={image} alt="" aspectRatio="1 / 1" />
            </ButtonBase>
          ))}
        </Box>
      )}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25, alignItems: 'flex-start' }}>
        <StatusChip label={product.category} variant="neutral" />
        <Typography
          id={titleId}
          component="h2"
          sx={{ fontSize: compact ? 18 : 22, fontWeight: 700, overflowWrap: 'anywhere' }}
        >
          {product.title}
        </Typography>
        <Typography sx={{ fontSize: compact ? 20 : 26, fontWeight: 700, letterSpacing: '-0.3px' }}>
          {formatMoney(product.price)}
        </Typography>
        <Typography
          sx={{ fontSize: 14, lineHeight: 1.6, color: '#3A3D43', whiteSpace: 'pre-line' }}
        >
          {product.description}
        </Typography>
      </Box>
      <Box
        component="dl"
        sx={{
          m: 0,
          display: 'grid',
          gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
          gap: 1.5,
          p: 2,
          borderRadius: '12px',
          bgcolor: '#F5F6F3',
          fontSize: 13,
        }}
      >
        {facts.map(({ term, value }) => (
          <div key={term}>
            <Box component="dt" sx={{ color: 'text.secondary' }}>
              {term}
            </Box>
            <Box component="dd" sx={{ m: 0, fontWeight: 700 }}>
              {value}
            </Box>
          </div>
        ))}
      </Box>
    </Box>
  );
}
