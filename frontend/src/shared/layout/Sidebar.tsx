import ShowChartRounded from '@mui/icons-material/ShowChartRounded';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import Typography from '@mui/material/Typography';
import { NavLink } from 'react-router-dom';
import type { UserRole } from '../auth/user-role';
import { canOpen, NAVIGATION_ITEMS } from './navigation';

export const SIDEBAR_WIDTH = 248;

interface SidebarProps {
  variant: 'permanent' | 'temporary';
  open: boolean;
  onClose: () => void;
  role?: UserRole;
}

export function Sidebar({ variant, open, onClose, role }: SidebarProps) {
  const closeIfTemporary = variant === 'temporary' ? onClose : undefined;

  return (
    <Drawer
      variant={variant}
      open={open}
      onClose={onClose}
      sx={{
        width: { md: SIDEBAR_WIDTH },
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: SIDEBAR_WIDTH,
          boxSizing: 'border-box',
          border: 0,
          bgcolor: 'ink.main',
          color: 'inverse.text',
        },
      }}
    >
      <Box
        component="nav"
        aria-label="Navegación principal"
        sx={{ display: 'flex', flexDirection: 'column', gap: 4, px: 2, py: 3 }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 1 }}>
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: 1,
              bgcolor: 'primary.main',
              color: 'ink.main',
              display: 'grid',
              placeItems: 'center',
            }}
          >
            <ShowChartRounded sx={{ fontSize: 20 }} />
          </Box>
          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            <Typography sx={{ fontWeight: 700, fontSize: 15 }}>Gerencial</Typography>
            <Typography sx={{ fontSize: 12, color: 'inverse.muted' }}>
              Inventario de productos
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          {NAVIGATION_ITEMS.filter((item) => canOpen(item, role)).map(({ path, label, Icon }) => (
            <Box
              key={path}
              component={NavLink}
              to={path}
              onClick={closeIfTemporary}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                minHeight: 44,
                px: 1.5,
                borderRadius: 1,
                color: 'inverse.soft',
                fontSize: 14,
                fontWeight: 500,
                textDecoration: 'none',
                '&:hover': { bgcolor: 'inverse.hover' },
                '&.active': { bgcolor: 'primary.main', color: 'ink.main', fontWeight: 700 },
                '&:focus-visible': { outline: '2px solid', outlineColor: 'primary.main' },
              }}
            >
              <Icon sx={{ fontSize: 20 }} />
              {label}
            </Box>
          ))}
        </Box>
      </Box>
    </Drawer>
  );
}
