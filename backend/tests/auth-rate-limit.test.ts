import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { createApp } from '../src/app.js';
import { usersService } from '../src/modules/users/index.js';
import { UserModel } from '../src/modules/users/users.model.js';
import { bearer } from './helpers/auth.js';

const MAX_ATTEMPTS = 3;

const credentials = { email: 'jane@example.com', password: 'secret123' };
const wrongCredentials = { ...credentials, password: 'wrong-password' };

const tooManyRequests = {
  error: {
    code: 'TOO_MANY_REQUESTS',
    message: 'Too many login attempts, please try again later',
  },
};

describe('login rate limit', () => {
  let mongo: MongoMemoryServer;

  beforeAll(async () => {
    vi.stubEnv('LOGIN_RATE_LIMIT_MAX', String(MAX_ATTEMPTS));
    vi.stubEnv('LOGIN_RATE_LIMIT_WINDOW_MS', '60000');
    mongo = await MongoMemoryServer.create();
    await mongoose.connect(mongo.getUri());
    await UserModel.init();
  });

  afterAll(async () => {
    vi.unstubAllEnvs();
    await mongoose.disconnect();
    await mongo.stop();
  });

  beforeEach(async () => {
    await UserModel.deleteMany({});
    await usersService.createUser({ ...credentials, name: 'Jane', role: 'USER' });
  });

  it('answers 429 TOO_MANY_REQUESTS once the max attempts are used, even with the right password', async () => {
    const app = createApp();

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      const res = await request(app).post('/api/auth/login').send(wrongCredentials);
      expect(res.status).toBe(401);
    }
    const blocked = await request(app).post('/api/auth/login').send(credentials);

    expect(blocked.status).toBe(429);
    expect(blocked.body).toEqual(tooManyRequests);
    expect(blocked.body).not.toHaveProperty('token');
  });

  it('counts successful logins as attempts too', async () => {
    const app = createApp();

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      const res = await request(app).post('/api/auth/login').send(credentials);
      expect(res.status).toBe(200);
    }
    const blocked = await request(app).post('/api/auth/login').send(credentials);

    expect(blocked.status).toBe(429);
    expect(blocked.body).toEqual(tooManyRequests);
  });

  it('counts invalid bodies as attempts', async () => {
    const app = createApp();

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      const res = await request(app).post('/api/auth/login').send({ email: 'nope' });
      expect(res.status).toBe(400);
    }
    const blocked = await request(app).post('/api/auth/login').send(credentials);

    expect(blocked.status).toBe(429);
  });

  it('leaves other routes untouched once login is blocked', async () => {
    const app = createApp();
    const { body } = await request(app).post('/api/auth/login').send(credentials);
    for (let attempt = 2; attempt <= MAX_ATTEMPTS; attempt++) {
      await request(app).post('/api/auth/login').send(wrongCredentials);
    }
    expect((await request(app).post('/api/auth/login').send(credentials)).status).toBe(429);

    const me = await request(app).get('/api/auth/me').set('Authorization', bearer(body.token));
    const health = await request(app).get('/api/health');

    expect(me.status).toBe(200);
    expect(health.status).not.toBe(429);
  });

  it('keeps a separate counter per app instance', async () => {
    const blockedApp = createApp();
    for (let attempt = 1; attempt <= MAX_ATTEMPTS + 1; attempt++) {
      await request(blockedApp).post('/api/auth/login').send(wrongCredentials);
    }

    const res = await request(createApp()).post('/api/auth/login').send(credentials);

    expect(res.status).toBe(200);
  });

  async function exhaustFrom(app: ReturnType<typeof createApp>, forwardedFor: string) {
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      await request(app)
        .post('/api/auth/login')
        .set('X-Forwarded-For', forwardedFor)
        .send(wrongCredentials);
    }
  }

  it('keys on the X-Forwarded-For client IP when trust proxy is configured', async () => {
    const app = createApp({ trustProxy: 1 });
    await exhaustFrom(app, '203.0.113.10');

    const blocked = await request(app)
      .post('/api/auth/login')
      .set('X-Forwarded-For', '203.0.113.10')
      .send(credentials);
    const otherClient = await request(app)
      .post('/api/auth/login')
      .set('X-Forwarded-For', '203.0.113.20')
      .send(credentials);

    expect(blocked.status).toBe(429);
    expect(otherClient.status).toBe(200);
  });

  it('ignores X-Forwarded-For when trust proxy is not configured', async () => {
    const app = createApp();
    await exhaustFrom(app, '203.0.113.10');

    const res = await request(app)
      .post('/api/auth/login')
      .set('X-Forwarded-For', '203.0.113.20')
      .send(credentials);

    expect(res.status).toBe(429);
  });
});
