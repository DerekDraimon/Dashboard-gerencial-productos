import Box from '@mui/material/Box';

export type StatusChipVariant = 'neutral' | 'strong' | 'success' | 'muted';

export interface StatusChipProps {
  label: string;
  variant?: StatusChipVariant;
}

const INK = '#24262B';

const variantColors: Record<StatusChipVariant, { bgcolor: string; color: string }> = {
  neutral: { bgcolor: '#E6EDE6', color: INK },
  strong: { bgcolor: INK, color: '#F5F6F3' },
  success: { bgcolor: '#9DB59F', color: INK },
  muted: { bgcolor: '#E4E5E0', color: INK },
};

export function StatusChip({ label, variant = 'neutral' }: StatusChipProps) {
  return (
    <Box
      component="span"
      sx={{
        ...variantColors[variant],
        display: 'inline-block',
        padding: '4px 10px',
        borderRadius: '999px',
        fontSize: '12px',
        fontWeight: 600,
        lineHeight: 1.4,
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </Box>
  );
}
