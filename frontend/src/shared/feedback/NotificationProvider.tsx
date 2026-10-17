import Alert, { type AlertColor } from '@mui/material/Alert';
import Snackbar, { type SnackbarCloseReason } from '@mui/material/Snackbar';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import { useMemo, useReducer, useRef, type ReactNode } from 'react';
import { NotificationContext, type Notifier } from './notification-context';

interface Notification {
  id: number;
  message: string;
  severity: AlertColor;
}

interface QueueState {
  current: Notification | null;
  open: boolean;
  pending: Notification[];
}

type QueueAction =
  { type: 'enqueue'; notification: Notification } | { type: 'close' } | { type: 'exited' };

const AUTO_HIDE_MS = 4000;
const MAX_PENDING = 5;
const INITIAL_STATE: QueueState = { current: null, open: false, pending: [] };

function queueReducer(state: QueueState, action: QueueAction): QueueState {
  switch (action.type) {
    case 'enqueue':
      return state.current
        ? { ...state, pending: [...state.pending, action.notification].slice(-MAX_PENDING) }
        : { ...state, current: action.notification, open: true };
    case 'close':
      return { ...state, open: false };
    case 'exited': {
      const [next, ...pending] = state.pending;
      return { current: next ?? null, open: next !== undefined, pending };
    }
  }
}

export function NotificationProvider({ children }: { children: ReactNode }) {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  const [{ current, open }, dispatch] = useReducer(queueReducer, INITIAL_STATE);
  const nextId = useRef(0);

  const notifier = useMemo<Notifier>(() => {
    const enqueue = (message: string, severity: AlertColor) => {
      nextId.current += 1;
      dispatch({ type: 'enqueue', notification: { id: nextId.current, message, severity } });
    };
    return {
      success: (message) => enqueue(message, 'success'),
      error: (message) => enqueue(message, 'error'),
    };
  }, []);

  const handleClose = (_event?: unknown, reason?: SnackbarCloseReason) => {
    if (reason !== 'clickaway') {
      dispatch({ type: 'close' });
    }
  };

  return (
    <NotificationContext.Provider value={notifier}>
      {children}
      <Snackbar
        key={current?.id}
        open={open}
        autoHideDuration={AUTO_HIDE_MS}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: isDesktop ? 'right' : 'center' }}
        slotProps={{ transition: { onExited: () => dispatch({ type: 'exited' }) } }}
      >
        <Alert
          severity={current?.severity ?? 'success'}
          variant="filled"
          onClose={handleClose}
          sx={{ width: '100%' }}
        >
          {current?.message}
        </Alert>
      </Snackbar>
    </NotificationContext.Provider>
  );
}
