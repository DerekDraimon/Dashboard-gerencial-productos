import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    // mongodb-memory-server may download a MongoDB binary on first run.
    hookTimeout: 120_000,
    testTimeout: 30_000,
    // Suites log in far more often than the production default allows; the limit itself is
    // covered by tests/auth-rate-limit.test.ts with a low max.
    env: { LOGIN_RATE_LIMIT_MAX: '1000' },
  },
});
