import Box from '@mui/material/Box';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { findNavigationItem } from './navigation';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

export function AppLayout() {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'), { noSsr: true });
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const current = findNavigationItem(useLocation().pathname);

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <Sidebar
        variant={isDesktop ? 'permanent' : 'temporary'}
        open={isDesktop || isDrawerOpen}
        onClose={() => setDrawerOpen(false)}
      />
      <Box sx={{ flexGrow: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <Topbar
          title={current?.title ?? ''}
          subtitle={current?.subtitle ?? ''}
          onMenuClick={isDesktop ? undefined : () => setDrawerOpen(true)}
        />
        <Box component="main" sx={{ p: { xs: 2, md: 4 }, width: '100%', maxWidth: 1240 }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}
