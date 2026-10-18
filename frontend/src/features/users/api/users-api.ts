import { httpClient } from '../../../shared/api/http-client';
import type { UserRole } from '../../../shared/auth/user-role';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  active: boolean;
  creationAt: string;
  updatedAt: string;
}

export interface UserPage {
  data: User[];
  meta: { total: number; offset: number; limit: number };
}

export interface ListUsersParams {
  offset: number;
  limit: number;
  /** Omitted means every user, active or not. */
  active?: boolean;
}

export interface RequestOptions {
  signal?: AbortSignal;
}

export interface CreateUserInput {
  name: string;
  email: string;
  password: string;
  role: UserRole;
}

export interface UpdateUserInput {
  name?: string;
  role?: UserRole;
}

function userPath(id: string): string {
  return `/users/${encodeURIComponent(id)}`;
}

export async function listUsers(
  { offset, limit, active }: ListUsersParams,
  { signal }: RequestOptions = {},
): Promise<UserPage> {
  const params: Record<string, number | boolean> = { offset, limit };
  if (active !== undefined) params.active = active;
  const response = await httpClient.get<UserPage>('/users', { params, signal });
  return response.data;
}

export async function getUser(id: string, { signal }: RequestOptions = {}): Promise<User> {
  const response = await httpClient.get<User>(userPath(id), { signal });
  return response.data;
}

export async function createUser(input: CreateUserInput): Promise<User> {
  const response = await httpClient.post<User>('/users', input);
  return response.data;
}

export async function updateUser(id: string, patch: UpdateUserInput): Promise<User> {
  const response = await httpClient.patch<User>(userPath(id), patch);
  return response.data;
}

export async function setUserStatus(id: string, active: boolean): Promise<User> {
  const response = await httpClient.patch<User>(`${userPath(id)}/status`, { active });
  return response.data;
}
