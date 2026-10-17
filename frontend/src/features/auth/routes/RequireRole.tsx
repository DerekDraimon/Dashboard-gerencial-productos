import type { ReactNode } from 'react';
import type { UserRole } from '../api/auth-api';
import { useAuth } from '../context/use-auth';
import { ForbiddenPage } from '../views/ForbiddenPage';

export interface RequireRoleProps {
  roles: readonly UserRole[];
  children: ReactNode;
}

export function RequireRole({ roles, children }: RequireRoleProps) {
  const { user } = useAuth();
  return user && roles.includes(user.role) ? children : <ForbiddenPage />;
}
