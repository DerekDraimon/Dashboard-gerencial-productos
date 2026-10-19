import Box from '@mui/material/Box';

export type StatusChipVariant = 'neutral' | 'strong' | 'success' | 'muted';

export interface StatusChipProps {
  label: string;
  variant?: StatusChipVariant;
}

const variantColors: Record<StatusChipVariant, { bgcolor: string; color: string }> = {
  neutral: { bgcolor: 'tint.sage', color: 'text.primary' },
  strong: { bgcolor: 'ink.main', color: 'inverse.text' },
  success: { bgcolor: 'secondary.main', color: 'text.primary' },
  muted: { bgcolor: 'divider', color: 'text.primary' },
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
