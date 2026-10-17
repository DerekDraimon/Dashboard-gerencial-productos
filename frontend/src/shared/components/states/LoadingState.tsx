import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';

export interface LoadingStateProps {
  label?: string;
}

export function LoadingState({ label }: LoadingStateProps) {
  return (
    <Box
      role="status"
      aria-label={label ? undefined : 'Cargando'}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 1.5,
        py: 6,
      }}
    >
      <CircularProgress size={32} />
      {label && <Typography sx={{ fontSize: 14, color: 'text.secondary' }}>{label}</Typography>}
    </Box>
  );
}
