import type { UserRole } from '../../shared/auth/user-role';

const ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: 'Administrador',
  USER: 'Usuario',
};

export function roleLabel(role: UserRole): string {
  return ROLE_LABELS[role];
}
