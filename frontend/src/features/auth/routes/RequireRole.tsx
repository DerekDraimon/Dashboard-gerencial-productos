import type { ReactNode } from 'react';
import { canAccess, type UserRole } from '../../../shared/auth/user-role';
import { useAuth } from '../context/use-auth';
import { ForbiddenPage } from '../views/ForbiddenPage';

export interface RequireRoleProps {
  roles: readonly UserRole[];
  children: ReactNode;
}

export function RequireRole({ roles, children }: RequireRoleProps) {
  const { user } = useAuth();
  return canAccess(user?.role, roles) ? children : <ForbiddenPage />;
}
