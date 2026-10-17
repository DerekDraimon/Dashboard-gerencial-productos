import ImageOutlined from '@mui/icons-material/ImageOutlined';
import Box from '@mui/material/Box';
import { useState } from 'react';

export interface ProductImageProps {
  src?: string;
  alt: string;
  size?: number | string;
  radius?: number;
}

export function ProductImage({ src, alt, size = 40, radius = 8 }: ProductImageProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const frame = { width: size, height: size, borderRadius: `${radius}px`, flex: 'none' };

  if (!src || failedSrc === src) {
    return (
      <Box
        role="img"
        aria-label={alt}
        sx={{
          ...frame,
          bgcolor: '#ECEDE8',
          color: 'text.secondary',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <ImageOutlined fontSize="small" />
      </Box>
    );
  }

  return (
    <Box
      component="img"
      src={src}
      alt={alt}
      onError={() => setFailedSrc(src)}
      sx={{ ...frame, objectFit: 'cover', display: 'block' }}
    />
  );
}
