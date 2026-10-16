import bcrypt from 'bcryptjs';
import type { Types } from 'mongoose';
import { AppError } from '../../shared/errors/app-error.js';
import { objectIdSchema } from '../../shared/http/object-id.js';
import type { Page } from '../../shared/http/pagination.js';
import { UserModel, type UserRecord } from './users.model.js';
import type {
  CreateUserInput,
  ListUsersFilter,
  UpdateUserInput,
  User,
  UserWithPassword,
} from './users.types.js';

const BCRYPT_ROUNDS = 10;
const DUPLICATE_KEY_ERROR = 11000;

type StoredUser = Omit<UserRecord, 'password'> & { _id: Types.ObjectId };

function toUser(doc: StoredUser): User {
  return {
    id: doc._id.toString(),
    email: doc.email,
    name: doc.name,
    role: doc.role,
    active: doc.active,
    creationAt: doc.creationAt,
    updatedAt: doc.updatedAt,
  };
}

function userNotFound(): AppError {
  return new AppError(404, 'USER_NOT_FOUND', 'User not found');
}

function emailAlreadyExists(): AppError {
  return new AppError(409, 'EMAIL_ALREADY_EXISTS', 'A user with this email already exists');
}

function isDuplicateKeyError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: unknown }).code === DUPLICATE_KEY_ERROR
  );
}

export async function listUsers({ offset, limit, active }: ListUsersFilter): Promise<Page<User>> {
  const filter = active === undefined ? {} : { active };
  const [docs, total] = await Promise.all([
    // `_id` breaks ties between users created in the same millisecond.
    UserModel.find(filter).sort({ creationAt: -1, _id: -1 }).skip(offset).limit(limit).lean(),
    UserModel.countDocuments(filter),
  ]);
  return { data: docs.map(toUser), meta: { total, offset, limit } };
}

export async function findUserById(id: string): Promise<User | null> {
  if (!objectIdSchema.safeParse(id).success) {
    return null;
  }
  const doc = await UserModel.findById(id).lean();
  return doc ? toUser(doc) : null;
}

export async function getUserById(id: string): Promise<User> {
  const user = await findUserById(id);
  if (!user) {
    throw userNotFound();
  }
  return user;
}

/**
 * The pre-check gives a clean 409 in the common case; the unique index catches the race where
 * two requests pass it at once (E11000), mapped to the same 409.
 */
export async function createUser(input: CreateUserInput): Promise<User> {
  const email = input.email.trim().toLowerCase();
  if (await UserModel.exists({ email })) {
    throw emailAlreadyExists();
  }

  const password = await bcrypt.hash(input.password, BCRYPT_ROUNDS);
  try {
    const doc = await UserModel.create({ ...input, email, password });
    return toUser(doc.toObject());
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      throw emailAlreadyExists();
    }
    throw error;
  }
}

/** Keeps an admin from locking themselves out by deactivating or demoting their own account. */
function assertNotModifyingOwnAccess(id: string, changes: UpdateUserInput, actorId?: string): void {
  if (actorId === id && (changes.role !== undefined || changes.active !== undefined)) {
    throw new AppError(
      409,
      'CANNOT_MODIFY_SELF',
      'You cannot change your own role or active status',
    );
  }
}

export async function updateUser(
  id: string,
  changes: UpdateUserInput,
  actorId?: string,
): Promise<User> {
  assertNotModifyingOwnAccess(id, changes, actorId);
  const doc = await UserModel.findByIdAndUpdate(
    id,
    { $set: changes },
    { returnDocument: 'after', runValidators: true },
  ).lean();
  if (!doc) {
    throw userNotFound();
  }
  return toUser(doc);
}

export async function setUserStatus(id: string, active: boolean, actorId?: string): Promise<User> {
  return updateUser(id, { active }, actorId);
}

export async function findByEmailWithPassword(email: string): Promise<UserWithPassword | null> {
  const doc = await UserModel.findOne({ email: email.trim().toLowerCase() })
    .select('+password')
    .lean();
  return doc ? { ...toUser(doc), password: doc.password } : null;
}

export function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}
