import MenuRounded from '@mui/icons-material/MenuRounded';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import type { ReactNode } from 'react';

interface TopbarProps {
  title: string;
  subtitle: string;
  onMenuClick?: () => void;
  actions?: ReactNode;
}

export function Topbar({ title, subtitle, onMenuClick, actions }: TopbarProps) {
  return (
    <Box
      component="header"
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: { xs: 1, md: 2 },
        px: { xs: 2, md: 4 },
        py: { xs: 1.5, md: 2.5 },
        bgcolor: 'background.paper',
        borderBottom: 1,
        borderColor: 'divider',
      }}
    >
      {onMenuClick && (
        <IconButton aria-label="Abrir menú" edge="start" onClick={onMenuClick}>
          <MenuRounded />
        </IconButton>
      )}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25, minWidth: 0 }}>
        <Typography variant="h5" component="h1" noWrap>
          {title}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ fontSize: 13 }}>
          {subtitle}
        </Typography>
      </Box>
      {actions}
    </Box>
  );
}
