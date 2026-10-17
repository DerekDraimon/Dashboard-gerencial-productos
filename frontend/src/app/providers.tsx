import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import type { ReactNode } from 'react';
import { AuthProvider } from '../features/auth/context/AuthProvider';
import { ConfirmProvider } from '../shared/components/confirm-dialog';
import { NotificationProvider } from '../shared/feedback/NotificationProvider';
import { theme } from './theme';

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <NotificationProvider>
        <AuthProvider>
          <ConfirmProvider>{children}</ConfirmProvider>
        </AuthProvider>
      </NotificationProvider>
    </ThemeProvider>
  );
}
