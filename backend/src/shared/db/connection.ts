import mongoose from 'mongoose';

/** Minimal logger contract so callers (and tests) can redirect connection logs. */
export interface DbLogger {
  info: (message: string) => void;
  warn: (message: string) => void;
  error: (message: string) => void;
}

export interface ConnectDatabaseOptions {
  /** Delay between failed initial connection attempts. Default: 5000 ms. */
  retryDelayMs?: number;
  /** How long the driver waits for a server on each attempt. Default: 5000 ms. */
  serverSelectionTimeoutMS?: number;
  logger?: DbLogger;
}

const READY_STATE_CONNECTED = 1;

let retryTimer: NodeJS.Timeout | undefined;
let stopped = true;
let listenersAttached = false;
/** Set after the first successful connection; from then on the driver reconnects by itself. */
let hasConnected = false;

/** True when Mongoose holds an open connection that can serve queries. */
export function isDatabaseConnected(): boolean {
  return mongoose.connection.readyState === READY_STATE_CONNECTED;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function attachLifecycleListeners(logger: DbLogger): void {
  if (listenersAttached) {
    return;
  }
  listenersAttached = true;
  // Before the first connection, failures are reported by the retry loop instead.
  mongoose.connection.on('disconnected', () => {
    if (hasConnected && !stopped) {
      logger.warn('MongoDB disconnected; the driver will try to reconnect');
    }
  });
  mongoose.connection.on('reconnected', () => logger.info('MongoDB reconnected'));
  mongoose.connection.on('error', (error: unknown) => {
    if (!hasConnected) {
      return;
    }
    logger.error(`MongoDB connection error: ${errorMessage(error)}`);
  });
}

/**
 * Starts connecting to MongoDB without blocking or throwing, so the HTTP server can
 * come up even when the database is down.
 *
 * Mongoose only reconnects automatically after a first successful connection; a
 * failed *initial* connection is final. This function covers that gap by retrying
 * the initial connection every `retryDelayMs` until it succeeds or
 * `disconnectDatabase()` is called. Meanwhile, routes guarded by `requireDb`
 * answer 503 and `/api/health` reports `degraded`.
 */
export function connectDatabase(uri: string, options: ConnectDatabaseOptions = {}): void {
  const { retryDelayMs = 5000, serverSelectionTimeoutMS = 5000, logger = console } = options;
  stopped = false;
  attachLifecycleListeners(logger);

  const attempt = async (attemptNumber: number): Promise<void> => {
    if (stopped) {
      return;
    }
    try {
      await mongoose.connect(uri, { serverSelectionTimeoutMS });
      hasConnected = true;
      logger.info('MongoDB connected');
    } catch (error) {
      if (stopped) {
        return;
      }
      logger.warn(
        `MongoDB connection attempt ${attemptNumber} failed (${errorMessage(error)}); ` +
          `retrying in ${retryDelayMs} ms`,
      );
      retryTimer = setTimeout(() => void attempt(attemptNumber + 1), retryDelayMs);
    }
  };

  void attempt(1);
}

/** Cancels pending retries and closes the connection (used on graceful shutdown). */
export async function disconnectDatabase(): Promise<void> {
  stopped = true;
  if (retryTimer !== undefined) {
    clearTimeout(retryTimer);
    retryTimer = undefined;
  }
  await mongoose.disconnect();
}
