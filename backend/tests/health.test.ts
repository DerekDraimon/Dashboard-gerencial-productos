import express from 'express';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import { errorHandler } from '../src/shared/middlewares/error-handler.js';
import { requireDb } from '../src/shared/middlewares/require-db.js';

/** Test-only app with a route guarded by requireDb. */
function buildGuardedApp() {
  const app = express();
  app.get('/guarded', requireDb, (_req, res) => {
    res.json({ ok: true });
  });
  app.use(errorHandler);
  return app;
}

describe('database availability', () => {
  let mongo: MongoMemoryServer;

  beforeAll(async () => {
    mongo = await MongoMemoryServer.create();
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongo.stop();
  });

  describe('while MongoDB is disconnected', () => {
    it('GET /api/health answers 503 degraded/disconnected', async () => {
      const res = await request(createApp()).get('/api/health');

      expect(res.status).toBe(503);
      expect(res.body).toEqual({ status: 'degraded', database: 'disconnected' });
    });

    it('requireDb answers 503 DATABASE_UNAVAILABLE', async () => {
      const res = await request(buildGuardedApp()).get('/guarded');

      expect(res.status).toBe(503);
      expect(res.body).toEqual({
        error: {
          code: 'DATABASE_UNAVAILABLE',
          message: 'The database is temporarily unavailable, please retry later',
        },
      });
    });
  });

  describe('while MongoDB is connected', () => {
    beforeAll(async () => {
      await mongoose.connect(mongo.getUri());
    });

    afterAll(async () => {
      await mongoose.disconnect();
    });

    it('GET /api/health answers 200 ok/connected', async () => {
      const res = await request(createApp()).get('/api/health');

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ status: 'ok', database: 'connected' });
    });

    it('requireDb lets the request through', async () => {
      const res = await request(buildGuardedApp()).get('/guarded');

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ ok: true });
    });
  });
});
