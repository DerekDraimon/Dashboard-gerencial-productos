import Box from '@mui/material/Box';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { HOME_PATH } from '../../../shared/layout/navigation';
import { LoginForm, type LoginCredentials } from '../components/LoginForm';
import { LoginShowcase } from '../components/LoginShowcase';
import { useAuth } from '../context/use-auth';

function readString(source: object, key: string): string {
  const value: unknown = (source as Record<string, unknown>)[key];
  return typeof value === 'string' ? value : '';
}

function redirectTarget(state: unknown): string {
  if (typeof state !== 'object' || state === null || !('from' in state)) return HOME_PATH;
  const { from } = state;
  if (typeof from !== 'object' || from === null) return HOME_PATH;
  const pathname = readString(from, 'pathname');
  if (!pathname.startsWith('/')) return HOME_PATH;
  return `${pathname}${readString(from, 'search')}${readString(from, 'hash')}`;
}

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'), { noSsr: true });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<unknown>(null);

  async function handleSubmit({ email, password }: LoginCredentials) {
    setSubmitting(true);
    setError(null);
    try {
      await login(email, password);
      navigate(redirectTarget(location.state), { replace: true });
    } catch (loginError) {
      setError(loginError);
      setSubmitting(false);
    }
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: { xs: 'column', md: 'row' },
        bgcolor: 'background.default',
      }}
    >
      <LoginShowcase compact={!isDesktop} />
      <Box
        component="main"
        sx={{
          flex: '1 1 0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          px: { xs: 2, sm: 3 },
          py: { xs: 4, md: 6 },
        }}
      >
        <LoginForm onSubmit={handleSubmit} submitting={submitting} error={error} />
      </Box>
    </Box>
  );
}
