import { httpClient } from '../../../shared/api/http-client';
import type { UserRole } from '../../../shared/auth/user-role';

export type { UserRole };

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  active: boolean;
}

export interface LoginResult {
  token: string;
  user: AuthUser;
}

export async function login(email: string, password: string): Promise<LoginResult> {
  const response = await httpClient.post<LoginResult>(
    '/auth/login',
    { email, password },
    { skipUnauthorizedHandler: true },
  );
  return response.data;
}

export async function getCurrentUser(): Promise<AuthUser> {
  const response = await httpClient.get<AuthUser>('/auth/me');
  return response.data;
}
