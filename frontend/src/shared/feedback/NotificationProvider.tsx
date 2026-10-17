import Alert, { type AlertColor } from '@mui/material/Alert';
import Snackbar, { type SnackbarCloseReason } from '@mui/material/Snackbar';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { NotificationContext, type Notifier } from './notification-context';

interface Notification {
  id: number;
  message: string;
  severity: AlertColor;
}

const AUTO_HIDE_MS = 4000;

export function NotificationProvider({ children }: { children: ReactNode }) {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  const [notification, setNotification] = useState<Notification | null>(null);
  const [open, setOpen] = useState(false);

  const show = useCallback((message: string, severity: AlertColor) => {
    setNotification({ id: Date.now(), message, severity });
    setOpen(true);
  }, []);

  const notifier = useMemo<Notifier>(
    () => ({
      success: (message) => show(message, 'success'),
      error: (message) => show(message, 'error'),
    }),
    [show],
  );

  const handleClose = (_event?: unknown, reason?: SnackbarCloseReason) => {
    if (reason !== 'clickaway') {
      setOpen(false);
    }
  };

  return (
    <NotificationContext.Provider value={notifier}>
      {children}
      <Snackbar
        key={notification?.id}
        open={open}
        autoHideDuration={AUTO_HIDE_MS}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: isDesktop ? 'right' : 'center' }}
      >
        <Alert
          severity={notification?.severity ?? 'success'}
          variant="filled"
          onClose={handleClose}
          sx={{ width: '100%' }}
        >
          {notification?.message}
        </Alert>
      </Snackbar>
    </NotificationContext.Provider>
  );
}
