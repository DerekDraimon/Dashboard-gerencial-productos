import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    // mongodb-memory-server may download a MongoDB binary on first run.
    hookTimeout: 120_000,
    testTimeout: 30_000,
  },
});
