import { createApp } from './app.js';
import { loadEnv, type Env } from './shared/config/env.js';
import { connectDatabase, disconnectDatabase } from './shared/db/connection.js';

function readEnvOrExit(): Env {
  try {
    return loadEnv();
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

const env = readEnvOrExit();
const app = createApp({ corsOrigin: env.CORS_ORIGIN });

// Non-blocking: the API starts even when MongoDB is down and keeps retrying.
connectDatabase(env.MONGODB_URI);

const server = app.listen(env.PORT, () => {
  console.info(`API listening on http://localhost:${env.PORT}`);
});

server.on('error', (error) => {
  console.error('HTTP server failed to start:', error.message);
  process.exit(1);
});

let shuttingDown = false;

async function shutdown(signal: NodeJS.Signals): Promise<void> {
  if (shuttingDown) {
    return;
  }
  shuttingDown = true;
  console.info(`${signal} received, shutting down`);

  const forceExit = setTimeout(() => process.exit(1), 10_000);
  forceExit.unref();

  try {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
    await disconnectDatabase();
    process.exit(0);
  } catch (error) {
    console.error('Error during shutdown:', error);
    process.exit(1);
  }
}

process.on('SIGINT', () => void shutdown('SIGINT'));
process.on('SIGTERM', () => void shutdown('SIGTERM'));
