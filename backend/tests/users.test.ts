import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { createApp } from '../src/app.js';
import { UserModel } from '../src/modules/users/users.model.js';

const app = createApp();

const validUser = {
  email: 'Jane.Doe@Example.com',
  password: 'secret123',
  name: 'Jane Doe',
  role: 'ADMIN',
};

const missingId = new mongoose.Types.ObjectId().toString();

type ErrorDetail = { path: string; message: string };

/** Creates a user through the API and returns the response body. */
async function createUser(overrides: Record<string, unknown> = {}) {
  const res = await request(app)
    .post('/api/users')
    .send({ ...validUser, ...overrides });
  expect(res.status).toBe(201);
  return res.body as { id: string; email: string; active: boolean };
}

function detailPaths(body: { error: { details?: ErrorDetail[] } }): string[] {
  return (body.error.details ?? []).map((detail) => detail.path);
}

describe('users module', () => {
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
    vi.restoreAllMocks();
    await UserModel.deleteMany({});
  });

  describe('POST /api/users', () => {
    it('creates a user, hides the password and stores a bcrypt hash', async () => {
      const res = await request(app).post('/api/users').send(validUser);

      expect(res.status).toBe(201);
      expect(res.body).toEqual({
        id: expect.any(String),
        email: 'jane.doe@example.com',
        name: 'Jane Doe',
        role: 'ADMIN',
        active: true,
        creationAt: expect.any(String),
        updatedAt: expect.any(String),
      });

      const stored = await UserModel.findById(res.body.id).select('+password').lean();
      expect(stored?.email).toBe('jane.doe@example.com');
      expect(stored?.password).not.toBe(validUser.password);
      expect(stored?.password).toMatch(/^\$2[aby]\$\d{2}\$/);
    });

    it('defaults role to USER', async () => {
      const res = await request(app)
        .post('/api/users')
        .send({ email: 'u@example.com', password: 'secret123', name: 'U' });

      expect(res.status).toBe(201);
      expect(res.body.role).toBe('USER');
    });

    it('rejects a duplicate email regardless of case with 409', async () => {
      await createUser();

      const res = await request(app)
        .post('/api/users')
        .send({ ...validUser, email: 'JANE.DOE@example.COM' });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('EMAIL_ALREADY_EXISTS');
      expect(await UserModel.countDocuments()).toBe(1);
    });

    it('maps a unique-index race (E11000) to 409', async () => {
      await createUser();
      // Simulate a concurrent insert that slipped past the pre-check.
      vi.spyOn(UserModel, 'exists').mockResolvedValueOnce(null);

      const res = await request(app).post('/api/users').send(validUser);

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('EMAIL_ALREADY_EXISTS');
      expect(await UserModel.countDocuments()).toBe(1);
    });

    it.each([
      ['invalid email', { email: 'not-an-email' }, 'email'],
      ['short password', { password: 'short' }, 'password'],
      ['bad role', { role: 'ROOT' }, 'role'],
      ['empty name', { name: '   ' }, 'name'],
      ['name over 100 chars', { name: 'a'.repeat(101) }, 'name'],
    ])('rejects %s with 400 VALIDATION_ERROR', async (_label, overrides, path) => {
      const res = await request(app)
        .post('/api/users')
        .send({ ...validUser, ...overrides });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(detailPaths(res.body)).toContain(path);
      expect(res.body.error.details[0]).toEqual({ path, message: expect.any(String) });
      expect(await UserModel.countDocuments()).toBe(0);
    });

    it('rejects unknown fields with 400', async () => {
      const res = await request(app)
        .post('/api/users')
        .send({ ...validUser, isSuperUser: true });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(res.body.error.details).toHaveLength(1);
      expect(await UserModel.countDocuments()).toBe(0);
    });

    it('accepts a 100-char name (boundary)', async () => {
      const res = await request(app)
        .post('/api/users')
        .send({ ...validUser, name: 'a'.repeat(100) });

      expect(res.status).toBe(201);
    });
  });

  describe('GET /api/users', () => {
    it('returns a page with meta, newest first', async () => {
      const first = await createUser({ email: 'a@example.com' });
      const second = await createUser({ email: 'b@example.com' });
      const third = await createUser({ email: 'c@example.com' });

      const res = await request(app).get('/api/users');

      expect(res.status).toBe(200);
      expect(res.body.meta).toEqual({ total: 3, offset: 0, limit: 10 });
      expect(res.body.data.map((u: { id: string }) => u.id)).toEqual([
        third.id,
        second.id,
        first.id,
      ]);
      expect(res.body.data[0]).not.toHaveProperty('password');
      expect(res.body.data[0]).not.toHaveProperty('_id');
    });

    it('applies offset and limit', async () => {
      await createUser({ email: 'a@example.com' });
      const second = await createUser({ email: 'b@example.com' });
      await createUser({ email: 'c@example.com' });

      const res = await request(app).get('/api/users?offset=1&limit=1');

      expect(res.status).toBe(200);
      expect(res.body.meta).toEqual({ total: 3, offset: 1, limit: 1 });
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].id).toBe(second.id);
    });

    it('filters by active=false', async () => {
      const inactive = await createUser({ email: 'a@example.com' });
      await createUser({ email: 'b@example.com' });
      await request(app).patch(`/api/users/${inactive.id}/status`).send({ active: false });

      const res = await request(app).get('/api/users?active=false');

      expect(res.status).toBe(200);
      expect(res.body.meta.total).toBe(1);
      expect(res.body.data.map((u: { id: string }) => u.id)).toEqual([inactive.id]);
    });

    it('accepts limit=100 (boundary)', async () => {
      const res = await request(app).get('/api/users?limit=100');

      expect(res.status).toBe(200);
      expect(res.body.meta.limit).toBe(100);
    });

    it.each([
      ['limit=101', 'limit'],
      ['limit=0', 'limit'],
      ['offset=-1', 'offset'],
      ['limit=abc', 'limit'],
      ['active=maybe', 'active'],
    ])('rejects %s with 400 VALIDATION_ERROR', async (query, path) => {
      const res = await request(app).get(`/api/users?${query}`);

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(detailPaths(res.body)).toContain(path);
    });
  });

  describe('GET /api/users/:id', () => {
    it('returns the user', async () => {
      const created = await createUser();

      const res = await request(app).get(`/api/users/${created.id}`);

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ id: created.id, email: 'jane.doe@example.com' });
      expect(res.body).not.toHaveProperty('password');
    });

    it('answers 404 USER_NOT_FOUND for a missing user', async () => {
      const res = await request(app).get(`/api/users/${missingId}`);

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('USER_NOT_FOUND');
    });

    it('answers 400 INVALID_ID for a malformed id', async () => {
      const res = await request(app).get('/api/users/not-an-id');

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('INVALID_ID');
    });
  });

  describe('PATCH /api/users/:id', () => {
    it('updates name and role', async () => {
      const created = await createUser({ role: 'USER' });

      const res = await request(app)
        .patch(`/api/users/${created.id}`)
        .send({ name: 'Renamed', role: 'ADMIN' });

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ id: created.id, name: 'Renamed', role: 'ADMIN' });
      const stored = await UserModel.findById(created.id).lean();
      expect(stored).toMatchObject({ name: 'Renamed', role: 'ADMIN' });
    });

    it('rejects an empty body with 400', async () => {
      const created = await createUser();

      const res = await request(app).patch(`/api/users/${created.id}`).send({});

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it.each([
      ['password', 'newsecret123'],
      ['email', 'other@example.com'],
    ])('rejects %s in the body with 400 and keeps the stored user', async (field, value) => {
      const created = await createUser();
      const before = await UserModel.findById(created.id).select('+password').lean();

      const res = await request(app)
        .patch(`/api/users/${created.id}`)
        .send({ [field]: value });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      const after = await UserModel.findById(created.id).select('+password').lean();
      expect(after?.password).toBe(before?.password);
      expect(after?.email).toBe(before?.email);
    });

    it('answers 404 for a missing user', async () => {
      const res = await request(app).patch(`/api/users/${missingId}`).send({ name: 'X' });

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('USER_NOT_FOUND');
    });

    it('answers 400 INVALID_ID for a malformed id', async () => {
      const res = await request(app).patch('/api/users/123').send({ name: 'X' });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('INVALID_ID');
    });
  });

  describe('PATCH /api/users/:id/status', () => {
    it('deactivates and reactivates a user without deleting it', async () => {
      const created = await createUser();

      const off = await request(app)
        .patch(`/api/users/${created.id}/status`)
        .send({ active: false });
      expect(off.status).toBe(200);
      expect(off.body.active).toBe(false);
      expect((await UserModel.findById(created.id).lean())?.active).toBe(false);

      const on = await request(app).patch(`/api/users/${created.id}/status`).send({ active: true });
      expect(on.status).toBe(200);
      expect(on.body.active).toBe(true);
      expect((await UserModel.findById(created.id).lean())?.active).toBe(true);
      expect(await UserModel.countDocuments()).toBe(1);
    });

    it('requires a boolean active', async () => {
      const created = await createUser();

      const res = await request(app)
        .patch(`/api/users/${created.id}/status`)
        .send({ active: 'no' });

      expect(res.status).toBe(400);
      expect(detailPaths(res.body)).toContain('active');
    });

    it('answers 404 for a missing user', async () => {
      const res = await request(app)
        .patch(`/api/users/${missingId}/status`)
        .send({ active: false });

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('USER_NOT_FOUND');
    });
  });
});
