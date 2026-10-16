import { createServer } from 'node:net';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  connectDatabase,
  disconnectDatabase,
  isDatabaseConnected,
} from '../src/shared/db/connection.js';

/** Reserves a free TCP port and releases it so MongoDB can bind it later. */
async function getFreePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = createServer();
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      if (address === null || typeof address === 'string') {
        reject(new Error('Could not resolve a free port'));
        return;
      }
      server.close(() => resolve(address.port));
    });
  });
}

const silentLogger = { info: () => undefined, warn: () => undefined, error: () => undefined };

describe('connectDatabase', () => {
  let mongo: MongoMemoryServer | undefined;

  afterEach(async () => {
    await disconnectDatabase();
    await mongo?.stop();
    mongo = undefined;
  });

  it('does not throw when MongoDB is down and connects once it becomes available', async () => {
    const port = await getFreePort();
    const warn = vi.fn();

    expect(() =>
      connectDatabase(`mongodb://127.0.0.1:${port}/retry-test`, {
        retryDelayMs: 100,
        serverSelectionTimeoutMS: 300,
        logger: { ...silentLogger, warn },
      }),
    ).not.toThrow();

    await vi.waitFor(() => expect(warn).toHaveBeenCalled(), { timeout: 5_000 });
    expect(isDatabaseConnected()).toBe(false);

    mongo = await MongoMemoryServer.create({ instance: { port, ip: '127.0.0.1' } });

    await vi.waitFor(() => expect(isDatabaseConnected()).toBe(true), {
      timeout: 15_000,
      interval: 100,
    });
  });

  it('stops retrying after disconnectDatabase is called', async () => {
    const port = await getFreePort();
    const warn = vi.fn();

    connectDatabase(`mongodb://127.0.0.1:${port}/retry-test`, {
      retryDelayMs: 50,
      serverSelectionTimeoutMS: 200,
      logger: { ...silentLogger, warn },
    });
    await vi.waitFor(() => expect(warn).toHaveBeenCalled(), { timeout: 5_000 });

    await disconnectDatabase();
    // An attempt already in flight may still report once; no new attempts may start.
    const callsAfterStop = warn.mock.calls.length;
    await new Promise((resolve) => setTimeout(resolve, 800));

    expect(warn.mock.calls.length).toBeLessThanOrEqual(callsAfterStop + 1);
    expect(isDatabaseConnected()).toBe(false);
  });
});
