import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useNavigate } from 'react-router-dom';
import { SessionBar } from '../features/auth/components/SessionBar';
import { useAuth } from '../features/auth/context/use-auth';
import { LOGIN_PATH } from '../features/auth/routes/ProtectedRoute';
import { AppLayout } from '../shared/layout/AppLayout';

export function SessionLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isPhone = useMediaQuery(theme.breakpoints.down('sm'), { noSsr: true });

  function handleLogout() {
    logout();
    navigate(LOGIN_PATH, { replace: true });
  }

  return (
    <AppLayout
      role={user?.role}
      topbarActions={user && <SessionBar user={user} compact={isPhone} onLogout={handleLogout} />}
    />
  );
}
