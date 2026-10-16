/**
 * `npm run seed`: creates the ADMIN and USER test accounts in the database from `MONGODB_URI`.
 * Exits with code 1 and a clear message when configuration or the database is unavailable.
 */
import mongoose from 'mongoose';
import { loadEnv } from '../shared/config/env.js';
import { readSeedPasswords, seedUsers } from './seed-users.js';

async function main(): Promise<void> {
  const env = loadEnv();
  const passwords = readSeedPasswords(env);

  await mongoose.connect(env.MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
  try {
    const { created, skipped } = await seedUsers(passwords);
    for (const email of created) {
      console.info(`created  ${email}`);
    }
    for (const email of skipped) {
      console.info(`skipped  ${email} (already exists)`);
    }
  } finally {
    await mongoose.disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
