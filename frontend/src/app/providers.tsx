import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import type { ReactNode } from 'react';
import { ConfirmProvider } from '../shared/components/confirm-dialog';
import { NotificationProvider } from '../shared/feedback/NotificationProvider';
import { theme } from './theme';

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <NotificationProvider>
        <ConfirmProvider>{children}</ConfirmProvider>
      </NotificationProvider>
    </ThemeProvider>
  );
}
