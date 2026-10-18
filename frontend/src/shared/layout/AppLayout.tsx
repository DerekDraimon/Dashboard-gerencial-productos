import Box from '@mui/material/Box';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import { useState, type ReactNode } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import type { UserRole } from '../auth/user-role';
import { findNavigationItem, subtitleFor } from './navigation';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

export interface AppLayoutProps {
  role?: UserRole;
  topbarActions?: ReactNode;
}

export function AppLayout({ role, topbarActions }: AppLayoutProps) {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'), { noSsr: true });
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const [wasDesktop, setWasDesktop] = useState(isDesktop);
  // Adjusting state during render (not in an effect) closes the drawer in the same pass.
  if (wasDesktop !== isDesktop) {
    setWasDesktop(isDesktop);
    if (isDesktop) setDrawerOpen(false);
  }
  const current = findNavigationItem(useLocation().pathname);

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <Sidebar
        variant={isDesktop ? 'permanent' : 'temporary'}
        open={isDesktop || isDrawerOpen}
        onClose={() => setDrawerOpen(false)}
        role={role}
      />
      <Box sx={{ flexGrow: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <Topbar
          title={current?.title ?? ''}
          subtitle={current ? subtitleFor(current, role) : ''}
          onMenuClick={isDesktop ? undefined : () => setDrawerOpen(true)}
          actions={topbarActions}
        />
        <Box component="main" sx={{ p: { xs: 2, md: 4 }, width: '100%', maxWidth: 1240 }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}
