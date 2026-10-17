import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import type { ReactNode } from 'react';

interface StateLayoutProps {
  icon: ReactNode;
  iconColors: { bgcolor: string; color: string };
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  role?: 'alert';
}

export function StateLayout({
  icon,
  iconColors,
  title,
  description,
  action,
  role,
}: StateLayoutProps) {
  return (
    <Box
      role={role}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        gap: 1.5,
        py: 6,
        px: 2,
      }}
    >
      <Box
        sx={{
          ...iconColors,
          width: 48,
          height: 48,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {icon}
      </Box>
      <Typography component="h2" sx={{ fontSize: 16, fontWeight: 700 }}>
        {title}
      </Typography>
      {description && (
        <Typography sx={{ fontSize: 14, color: 'text.secondary', maxWidth: 420 }}>
          {description}
        </Typography>
      )}
      {action && <Box sx={{ mt: 1 }}>{action}</Box>}
    </Box>
  );
}
