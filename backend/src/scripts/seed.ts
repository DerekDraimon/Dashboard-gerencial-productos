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
