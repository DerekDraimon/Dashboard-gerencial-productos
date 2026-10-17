import { createContext } from 'react';
import type { AuthUser } from '../api/auth-api';

export type AuthStatus = 'checking' | 'authenticated' | 'anonymous' | 'unavailable';

export interface AuthContextValue {
  status: AuthStatus;
  user: AuthUser | null;
  login: (email: string, password: string) => Promise<AuthUser>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
