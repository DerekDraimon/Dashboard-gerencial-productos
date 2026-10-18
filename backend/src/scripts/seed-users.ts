import { AppError } from '../shared/errors/app-error.js';
import { usersService, type UserRole } from '../modules/users/index.js';

export interface SeedPasswords {
  adminPassword: string;
  userPassword: string;
}

export interface SeedResult {
  created: string[];
  skipped: string[];
}

const MIN_PASSWORD_LENGTH = 8;

export function readSeedPasswords(source: {
  SEED_ADMIN_PASSWORD?: string;
  SEED_USER_PASSWORD?: string;
}): SeedPasswords {
  const problems: string[] = [];
  const check = (name: keyof typeof source): string => {
    const value = source[name] ?? '';
    if (value === '') {
      problems.push(`  - ${name} is required`);
    } else if (value.length < MIN_PASSWORD_LENGTH) {
      problems.push(`  - ${name} must be at least ${MIN_PASSWORD_LENGTH} characters`);
    }
    return value;
  };
  const adminPassword = check('SEED_ADMIN_PASSWORD');
  const userPassword = check('SEED_USER_PASSWORD');

  if (problems.length > 0) {
    throw new Error(
      `Cannot seed test users:\n${problems.join('\n')}\n` +
        'Set them in backend/.env (see backend/.env.example).',
    );
  }
  return { adminPassword, userPassword };
}

/** Idempotent: an existing email is skipped and its password and role are left unchanged. */
export async function seedUsers(passwords: SeedPasswords): Promise<SeedResult> {
  const accounts: { email: string; name: string; role: UserRole; password: string }[] = [
    {
      email: 'admin@dashboard.test',
      name: 'Administrador',
      role: 'ADMIN',
      password: passwords.adminPassword,
    },
    {
      email: 'user@dashboard.test',
      name: 'Usuario de prueba',
      role: 'USER',
      password: passwords.userPassword,
    },
  ];

  const result: SeedResult = { created: [], skipped: [] };
  for (const account of accounts) {
    try {
      await usersService.createUser(account);
      result.created.push(account.email);
    } catch (error) {
      if (error instanceof AppError && error.code === 'EMAIL_ALREADY_EXISTS') {
        result.skipped.push(account.email);
        continue;
      }
      throw error;
    }
  }
  return result;
}
