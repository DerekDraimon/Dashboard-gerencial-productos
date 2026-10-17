import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import NativeSelect from '@mui/material/NativeSelect';
import OutlinedInput from '@mui/material/OutlinedInput';
import Typography from '@mui/material/Typography';
import type { SxProps, Theme } from '@mui/material/styles';
import { useId } from 'react';

const PAGE_SIZE_OPTIONS = [10, 25, 50] as const;

export interface TablePaginationFooterProps {
  offset: number;
  limit: number;
  total: number;
  onOffsetChange: (offset: number) => void;
  onLimitChange: (limit: number) => void;
  pageSizeOptions?: readonly number[];
}

const navButtonSx: SxProps<Theme> = {
  width: 44,
  height: 44,
  borderRadius: '10px',
  border: '1px solid',
  borderColor: 'divider',
  color: 'text.primary',
};

export function TablePaginationFooter({
  offset,
  limit,
  total,
  onOffsetChange,
  onLimitChange,
  pageSizeOptions = PAGE_SIZE_OPTIONS,
}: TablePaginationFooterProps) {
  const selectId = useId();
  const lastPageOffset = Math.max(0, Math.floor((total - 1) / limit) * limit);
  const from = Math.min(offset, lastPageOffset) + 1;
  const to = Math.min(from - 1 + limit, total);
  const options = pageSizeOptions.includes(limit)
    ? pageSizeOptions
    : [...pageSizeOptions, limit].sort((a, b) => a - b);
  const isFirstPage = offset <= 0;
  const isLastPage = offset + limit >= total;

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: { xs: 'column', sm: 'row' },
        alignItems: { xs: 'stretch', sm: 'center' },
        justifyContent: 'space-between',
        gap: 1.5,
        px: 2.5,
        py: 1.5,
        fontSize: 13,
        color: 'text.secondary',
      }}
    >
      <Typography component="span" sx={{ fontSize: 'inherit' }}>
        {total === 0 ? '0 resultados' : `Mostrando ${from}–${to} de ${total}`}
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'flex-end' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mr: 'auto' }}>
          <Box component="label" htmlFor={selectId} sx={{ whiteSpace: 'nowrap' }}>
            Filas por página
          </Box>
          <NativeSelect
            id={selectId}
            value={limit}
            onChange={(event) => onLimitChange(Number(event.target.value))}
            input={<OutlinedInput size="small" sx={{ fontSize: 13, borderRadius: '8px' }} />}
          >
            {options.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </NativeSelect>
        </Box>
        <IconButton
          aria-label="Página anterior"
          disabled={isFirstPage}
          onClick={() => onOffsetChange(Math.max(0, offset - limit))}
          sx={navButtonSx}
        >
          <ChevronLeftIcon fontSize="small" />
        </IconButton>
        <IconButton
          aria-label="Página siguiente"
          disabled={isLastPage}
          onClick={() => onOffsetChange(offset + limit)}
          sx={navButtonSx}
        >
          <ChevronRightIcon fontSize="small" />
        </IconButton>
      </Box>
    </Box>
  );
}
