export type UserRole = 'ADMIN' | 'USER';

export function canAccess(
  role: UserRole | undefined,
  allowedRoles: readonly UserRole[] | undefined,
): boolean {
  return !allowedRoles || (role !== undefined && allowedRoles.includes(role));
}
