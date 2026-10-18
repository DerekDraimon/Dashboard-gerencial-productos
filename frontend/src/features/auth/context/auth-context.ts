import { createContext } from 'react';
import type { AuthUser } from '../api/auth-api';

export type AuthStatus = 'checking' | 'authenticated' | 'anonymous' | 'unavailable';

export interface AuthContextValue {
  status: AuthStatus;
  user: AuthUser | null;
  login: (email: string, password: string) => Promise<AuthUser>;
  logout: () => void;
  /** Reloads the session user (e.g. after editing yourself); a failure keeps the current one. */
  refreshUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
