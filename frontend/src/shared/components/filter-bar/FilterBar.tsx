import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import type { ReactNode } from 'react';

export interface FilterBarProps {
  children: ReactNode;
  ariaLabel?: string;
  onClear?: () => void;
  canClear?: boolean;
}

export function FilterBar({
  children,
  ariaLabel = 'Filtros',
  onClear,
  canClear = true,
}: FilterBarProps) {
  return (
    <Box
      role="search"
      aria-label={ariaLabel}
      sx={{
        display: 'flex',
        flexDirection: { xs: 'column', sm: 'row' },
        flexWrap: 'wrap',
        alignItems: { xs: 'stretch', sm: 'flex-end' },
        gap: 2,
        px: { xs: 2, sm: 2.5 },
        py: 2,
        bgcolor: 'background.paper',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: '14px',
      }}
    >
      {children}
      {onClear && (
        <Button
          variant="outlined"
          onClick={onClear}
          disabled={!canClear}
          sx={{ px: 2, color: 'text.primary', borderColor: 'text.primary' }}
        >
          Limpiar filtros
        </Button>
      )}
    </Box>
  );
}
