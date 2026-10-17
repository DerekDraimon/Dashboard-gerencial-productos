import type { UserRole } from './api/auth-api';

const ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: 'Administrador',
  USER: 'Usuario',
};

export function roleLabel(role: UserRole): string {
  return ROLE_LABELS[role];
}
