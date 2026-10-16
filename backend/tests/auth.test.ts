import jwt from 'jsonwebtoken';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import { usersService } from '../src/modules/users/index.js';
import { UserModel } from '../src/modules/users/users.model.js';
import { bearer, createUserWithToken, signExpiredToken } from './helpers/auth.js';

const app = createApp();

const credentials = { email: 'jane@example.com', password: 'secret123' };

const invalidCredentials = {
  error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' },
};

async function createJane(active = true) {
  const user = await usersService.createUser({ ...credentials, name: 'Jane', role: 'USER' });
  if (!active) {
    await usersService.setUserStatus(user.id, false);
  }
  return user;
}

describe('auth module', () => {
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

  beforeEach(async () => {
    await UserModel.deleteMany({});
  });

  describe('POST /api/auth/login', () => {
    it('returns a token for the user and the user without the password', async () => {
      const jane = await createJane();

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'JANE@example.com', password: credentials.password });

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        token: expect.any(String),
        user: {
          id: jane.id,
          email: 'jane@example.com',
          name: 'Jane',
          role: 'USER',
          active: true,
          creationAt: expect.any(String),
          updatedAt: expect.any(String),
        },
      });
      const payload = jwt.decode(res.body.token) as { sub: string; role: string; exp: number };
      expect(payload).toMatchObject({ sub: jane.id, role: 'USER' });
      expect(payload.exp).toEqual(expect.any(Number));
    });

    it('answers the same 401 for a wrong password and for an unknown email', async () => {
      await createJane();

      const wrongPassword = await request(app)
        .post('/api/auth/login')
        .send({ ...credentials, password: 'wrong-password' });
      const unknownEmail = await request(app)
        .post('/api/auth/login')
        .send({ ...credentials, email: 'nobody@example.com' });

      expect(wrongPassword.status).toBe(401);
      expect(wrongPassword.body).toEqual(invalidCredentials);
      expect(unknownEmail.status).toBe(401);
      expect(unknownEmail.body).toEqual(invalidCredentials);
    });

    it('answers 403 USER_INACTIVE for an inactive user with the right password', async () => {
      await createJane(false);

      const res = await request(app).post('/api/auth/login').send(credentials);

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('USER_INACTIVE');
      expect(res.body).not.toHaveProperty('token');
    });

    it('answers 401, not 403, for an inactive user with a wrong password', async () => {
      await createJane(false);

      const res = await request(app)
        .post('/api/auth/login')
        .send({ ...credentials, password: 'wrong-password' });

      expect(res.status).toBe(401);
      expect(res.body).toEqual(invalidCredentials);
    });

    it.each([
      ['missing password', { email: credentials.email }, 'password'],
      ['invalid email', { ...credentials, email: 'nope' }, 'email'],
      ['unknown field', { ...credentials, role: 'ADMIN' }, ''],
    ])('rejects %s with 400 VALIDATION_ERROR', async (_label, body, path) => {
      const res = await request(app).post('/api/auth/login').send(body);

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(res.body.error.details[0]).toEqual({ path, message: expect.any(String) });
    });
  });

  describe('GET /api/auth/me', () => {
    it('returns the current user', async () => {
      const { user, token } = await createUserWithToken('USER');

      const res = await request(app).get('/api/auth/me').set('Authorization', bearer(token));

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ id: user.id, email: user.email, role: 'USER' });
      expect(res.body).not.toHaveProperty('password');
    });

    it.each([
      ['no Authorization header', undefined],
      ['a non-Bearer scheme', 'Basic abc'],
      ['an empty Bearer token', 'Bearer '],
    ])('answers 401 UNAUTHENTICATED with %s', async (_label, header) => {
      const req = request(app).get('/api/auth/me');
      const res = header === undefined ? await req : await req.set('Authorization', header);

      expect(res.status).toBe(401);
      expect(res.body).toEqual({
        error: { code: 'UNAUTHENTICATED', message: 'Authentication is required' },
      });
    });

    it('answers 401 INVALID_TOKEN for a garbage token', async () => {
      const res = await request(app).get('/api/auth/me').set('Authorization', bearer('garbage'));

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('INVALID_TOKEN');
    });

    it('answers 401 INVALID_TOKEN for a token signed with another secret', async () => {
      const { user } = await createUserWithToken('USER');
      const forged = jwt.sign(
        { sub: user.id, role: 'ADMIN' },
        'another-secret-at-least-32-chars!!',
      );

      const res = await request(app).get('/api/auth/me').set('Authorization', bearer(forged));

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('INVALID_TOKEN');
    });

    it('answers 401 INVALID_TOKEN for an expired token', async () => {
      const { user } = await createUserWithToken('USER');

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', bearer(signExpiredToken(user.id, 'USER')));

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('INVALID_TOKEN');
    });

    it('answers 401 once the user is deactivated after the token was issued', async () => {
      const { user, token } = await createUserWithToken('USER');
      await usersService.setUserStatus(user.id, false);

      const res = await request(app).get('/api/auth/me').set('Authorization', bearer(token));

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('INVALID_TOKEN');
    });

    it('answers 401 once the user no longer exists', async () => {
      const { user, token } = await createUserWithToken('USER');
      await UserModel.deleteOne({ _id: user.id });

      const res = await request(app).get('/api/auth/me').set('Authorization', bearer(token));

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('INVALID_TOKEN');
    });
  });

  describe('/api/users guard', () => {
    it('answers 401 UNAUTHENTICATED without a token', async () => {
      const res = await request(app).get('/api/users');

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHENTICATED');
    });

    it('answers 403 FORBIDDEN for a USER token and creates nothing', async () => {
      const { token } = await createUserWithToken('USER');

      const list = await request(app).get('/api/users').set('Authorization', bearer(token));
      const create = await request(app)
        .post('/api/users')
        .set('Authorization', bearer(token))
        .send({ email: 'x@example.com', password: 'secret123', name: 'X' });

      expect(list.status).toBe(403);
      expect(list.body).toEqual({
        error: { code: 'FORBIDDEN', message: 'You do not have permission to perform this action' },
      });
      expect(create.status).toBe(403);
      expect(await UserModel.countDocuments()).toBe(1);
    });

    it('lets an ADMIN token through', async () => {
      const { token } = await createUserWithToken('ADMIN');

      const res = await request(app).get('/api/users').set('Authorization', bearer(token));

      expect(res.status).toBe(200);
      expect(res.body.meta.total).toBe(1);
    });

    it('uses the stored role, so a demoted admin is rejected with the old token', async () => {
      const { user, token } = await createUserWithToken('ADMIN');
      await usersService.updateUser(user.id, { role: 'USER' });

      const res = await request(app).get('/api/users').set('Authorization', bearer(token));

      expect(res.status).toBe(403);
    });
  });
});
