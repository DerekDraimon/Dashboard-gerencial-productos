export const USER_ROLES = ['ADMIN', 'USER'] as const;

export type UserRole = (typeof USER_ROLES)[number];

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  active: boolean;
  creationAt: Date;
  updatedAt: Date;
}

export interface UserWithPassword extends User {
  password: string;
}

export interface CreateUserInput {
  email: string;
  password: string;
  name: string;
  role?: UserRole;
}

export interface UpdateUserInput {
  name?: string;
  role?: UserRole;
  active?: boolean;
}

export interface ListUsersFilter {
  offset: number;
  limit: number;
  active?: boolean;
}
