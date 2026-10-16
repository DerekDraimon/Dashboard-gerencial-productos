import bcrypt from 'bcryptjs';
import type { Types } from 'mongoose';
import { AppError } from '../../shared/errors/app-error.js';
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

/** Lists users newest first, optionally filtered by `active`. */
export async function listUsers({ offset, limit, active }: ListUsersFilter): Promise<Page<User>> {
  const filter = active === undefined ? {} : { active };
  const [docs, total] = await Promise.all([
    // `_id` breaks ties between users created in the same millisecond.
    UserModel.find(filter).sort({ creationAt: -1, _id: -1 }).skip(offset).limit(limit).lean(),
    UserModel.countDocuments(filter),
  ]);
  return { data: docs.map(toUser), meta: { total, offset, limit } };
}

/** @throws AppError 404 `USER_NOT_FOUND` */
export async function getUserById(id: string): Promise<User> {
  const doc = await UserModel.findById(id).lean();
  if (!doc) {
    throw userNotFound();
  }
  return toUser(doc);
}

/**
 * Creates a user with a bcrypt-hashed password.
 *
 * Duplicates are detected twice: a pre-check gives a clean 409 in the common case, and
 * the unique index catches the race where two requests pass the pre-check at once
 * (MongoDB error E11000), which is mapped to the same 409.
 *
 * @throws AppError 409 `EMAIL_ALREADY_EXISTS` (case-insensitive: emails are stored lowercase)
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

/** Partially updates name, role and/or active. @throws AppError 404 `USER_NOT_FOUND` */
export async function updateUser(id: string, changes: UpdateUserInput): Promise<User> {
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

/** Deactivates or reactivates a user; users are never physically deleted. */
export async function setUserStatus(id: string, active: boolean): Promise<User> {
  return updateUser(id, { active });
}

/** For authentication: the user and its hash, or `null` when the email is unknown. */
export async function findByEmailWithPassword(email: string): Promise<UserWithPassword | null> {
  const doc = await UserModel.findOne({ email: email.trim().toLowerCase() })
    .select('+password')
    .lean();
  return doc ? { ...toUser(doc), password: doc.password } : null;
}

/** Compares a plain password with a stored bcrypt hash. */
export function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}
