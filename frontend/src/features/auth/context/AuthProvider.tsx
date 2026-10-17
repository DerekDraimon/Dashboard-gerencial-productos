import Box from '@mui/material/Box';
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { configureHttpAuth } from '../../../shared/api/http-client';
import { LoadingState } from '../../../shared/components/states';
import { useNotify } from '../../../shared/feedback/use-notify';
import * as authApi from '../api/auth-api';
import type { AuthUser } from '../api/auth-api';
import { tokenStorage } from '../session/token-storage';
import { AuthContext, type AuthContextValue, type AuthStatus } from './auth-context';

const SESSION_EXPIRED_MESSAGE = 'Tu sesión expiró. Inicia sesión de nuevo.';

interface SessionState {
  status: AuthStatus;
  user: AuthUser | null;
}

const ANONYMOUS: SessionState = { status: 'anonymous', user: null };

export function AuthProvider({ children }: { children: ReactNode }) {
  const [storedToken] = useState(() => tokenStorage.get());
  const tokenRef = useRef(storedToken);
  const [session, setSession] = useState<SessionState>(
    storedToken ? { status: 'checking', user: null } : ANONYMOUS,
  );
  const notify = useNotify();

  const clearSession = useCallback(() => {
    tokenRef.current = null;
    tokenStorage.clear();
    setSession(ANONYMOUS);
  }, []);

  useEffect(() => {
    configureHttpAuth({
      getToken: () => tokenRef.current,
      onUnauthorized: () => {
        // Parallel requests can all answer 401; only the first one ends the session.
        if (!tokenRef.current) return;
        clearSession();
        notify.error(SESSION_EXPIRED_MESSAGE);
      },
    });
    return () => configureHttpAuth({ getToken: () => null, onUnauthorized: () => undefined });
  }, [clearSession, notify]);

  const isChecking = session.status === 'checking';
  useEffect(() => {
    if (!isChecking) return;
    let active = true;
    authApi.getCurrentUser().then(
      (user) => active && setSession({ status: 'authenticated', user }),
      () => active && setSession(ANONYMOUS),
    );
    return () => {
      active = false;
    };
  }, [isChecking]);

  const login = useCallback(async (email: string, password: string) => {
    const { token, user } = await authApi.login(email, password);
    tokenRef.current = token;
    tokenStorage.set(token);
    setSession({ status: 'authenticated', user });
    return user;
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ ...session, login, logout: clearSession }),
    [session, login, clearSession],
  );

  return (
    <AuthContext.Provider value={value}>
      {isChecking ? (
        <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
          <LoadingState />
        </Box>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
}
