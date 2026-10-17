import Box from '@mui/material/Box';
import type { ReactNode } from 'react';

export interface FilterFieldProps {
  label: string;
  htmlFor: string;
  children: ReactNode;
  flex?: string;
}

export function FilterField({ label, htmlFor, children, flex = '1 1 160px' }: FilterFieldProps) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75, flex: { sm: flex } }}>
      <Box
        component="label"
        htmlFor={htmlFor}
        sx={{ fontSize: 12, fontWeight: 600, color: 'text.secondary' }}
      >
        {label}
      </Box>
      {children}
    </Box>
  );
}
