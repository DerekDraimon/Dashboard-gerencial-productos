import bcrypt from 'bcryptjs';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { UserModel } from '../src/modules/users/users.model.js';
import { readSeedPasswords, seedUsers } from '../src/scripts/seed-users.js';

const passwords = { adminPassword: 'Admin123!', userPassword: 'User1234!' };

describe('readSeedPasswords', () => {
  it('returns both passwords', () => {
    expect(
      readSeedPasswords({ SEED_ADMIN_PASSWORD: 'Admin123!', SEED_USER_PASSWORD: 'User1234!' }),
    ).toEqual(passwords);
  });

  it('fails with a message naming every missing variable', () => {
    expect(() => readSeedPasswords({ SEED_USER_PASSWORD: '' })).toThrow(
      /SEED_ADMIN_PASSWORD.*SEED_USER_PASSWORD/s,
    );
  });

  it('rejects passwords shorter than 8 characters', () => {
    expect(() =>
      readSeedPasswords({ SEED_ADMIN_PASSWORD: 'short', SEED_USER_PASSWORD: 'User1234!' }),
    ).toThrow(/SEED_ADMIN_PASSWORD/);
  });
});

describe('seedUsers', () => {
  let mongo: MongoMemoryServer;

  beforeAll(async () => {
    mongo = await MongoMemoryServer.create();
    await mongoose.connect(mongo.getUri());
    await UserModel.init();
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongo.stop();
  });

  it('creates the admin and user accounts and is idempotent', async () => {
    const first = await seedUsers(passwords);
    const second = await seedUsers(passwords);

    expect(first).toEqual({
      created: ['admin@dashboard.test', 'user@dashboard.test'],
      skipped: [],
    });
    expect(second).toEqual({
      created: [],
      skipped: ['admin@dashboard.test', 'user@dashboard.test'],
    });

    const users = await UserModel.find().select('+password').sort({ email: 1 }).lean();
    expect(users.map((u) => [u.email, u.name, u.role, u.active])).toEqual([
      ['admin@dashboard.test', 'Administrador', 'ADMIN', true],
      ['user@dashboard.test', 'Usuario de prueba', 'USER', true],
    ]);
    expect(await bcrypt.compare('Admin123!', users[0]?.password ?? '')).toBe(true);
    expect(await bcrypt.compare('User1234!', users[1]?.password ?? '')).toBe(true);
  });
});
