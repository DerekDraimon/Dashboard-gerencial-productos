import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { createApp } from '../src/app.js';
import type { User } from '../src/modules/users/index.js';
import { UserModel } from '../src/modules/users/users.model.js';
import { bearer, createUserWithToken } from './helpers/auth.js';

const app = createApp();

let admin: User;
let adminToken = '';

const api = {
  get: (path: string) => request(app).get(path).set('Authorization', bearer(adminToken)),
  post: (path: string) => request(app).post(path).set('Authorization', bearer(adminToken)),
  patch: (path: string) => request(app).patch(path).set('Authorization', bearer(adminToken)),
};

/** Counts every user except the acting admin that each test creates. */
function countOthers(): Promise<number> {
  return UserModel.countDocuments({ _id: { $ne: admin.id } });
}

const validUser = {
  email: 'Jane.Doe@Example.com',
  password: 'secret123',
  name: 'Jane Doe',
  role: 'ADMIN',
};

const missingId = new mongoose.Types.ObjectId().toString();

type ErrorDetail = { path: string; message: string };

async function createUser(overrides: Record<string, unknown> = {}) {
  const res = await api.post('/api/users').send({ ...validUser, ...overrides });
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
    ({ user: admin, token: adminToken } = await createUserWithToken('ADMIN'));
  });

  describe('POST /api/users', () => {
    it('creates a user, hides the password and stores a bcrypt hash', async () => {
      const res = await api.post('/api/users').send(validUser);

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
      const res = await api
        .post('/api/users')
        .send({ email: 'u@example.com', password: 'secret123', name: 'U' });

      expect(res.status).toBe(201);
      expect(res.body.role).toBe('USER');
    });

    it('rejects a duplicate email regardless of case with 409', async () => {
      await createUser();

      const res = await api
        .post('/api/users')
        .send({ ...validUser, email: 'JANE.DOE@example.COM' });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('EMAIL_ALREADY_EXISTS');
      expect(await countOthers()).toBe(1);
    });

    it('maps a unique-index race (E11000) to 409', async () => {
      await createUser();
      // Simulate a concurrent insert that slipped past the pre-check.
      vi.spyOn(UserModel, 'exists').mockResolvedValueOnce(null);

      const res = await api.post('/api/users').send(validUser);

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('EMAIL_ALREADY_EXISTS');
      expect(await countOthers()).toBe(1);
    });

    it.each([
      ['invalid email', { email: 'not-an-email' }, 'email'],
      ['short password', { password: 'short' }, 'password'],
      ['bad role', { role: 'ROOT' }, 'role'],
      ['empty name', { name: '   ' }, 'name'],
      ['name over 100 chars', { name: 'a'.repeat(101) }, 'name'],
    ])('rejects %s with 400 VALIDATION_ERROR', async (_label, overrides, path) => {
      const res = await api.post('/api/users').send({ ...validUser, ...overrides });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(detailPaths(res.body)).toContain(path);
      expect(res.body.error.details[0]).toEqual({ path, message: expect.any(String) });
      expect(await countOthers()).toBe(0);
    });

    it('rejects unknown fields with 400', async () => {
      const res = await api.post('/api/users').send({ ...validUser, isSuperUser: true });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(res.body.error.details).toHaveLength(1);
      expect(await countOthers()).toBe(0);
    });

    it('accepts a 100-char name (boundary)', async () => {
      const res = await api.post('/api/users').send({ ...validUser, name: 'a'.repeat(100) });

      expect(res.status).toBe(201);
    });

    it.each([
      ['73 ASCII bytes', 'a'.repeat(73)],
      ['19 four-byte emoji (76 bytes)', '\u{1F600}'.repeat(19)],
    ])('rejects a password of %s as too long', async (_label, password) => {
      const res = await api.post('/api/users').send({ ...validUser, password });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(res.body.error.details[0]).toEqual({
        path: 'password',
        message: 'password is too long: it must be at most 72 bytes',
      });
      expect(await countOthers()).toBe(0);
    });

    it('accepts 18 four-byte emoji (72 bytes, boundary) and can log in with them', async () => {
      const password = '\u{1F600}'.repeat(18);
      const created = await createUser({ password });

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: created.email, password });

      expect(res.status).toBe(200);
    });

    it('accepts a 72-byte ASCII password (boundary) and can log in with it', async () => {
      const password = 'a'.repeat(72);
      const created = await createUser({ password });

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: created.email, password });

      expect(res.status).toBe(200);
    });
  });

  describe('GET /api/users', () => {
    it('returns a page with meta, newest first', async () => {
      const first = await createUser({ email: 'a@example.com' });
      const second = await createUser({ email: 'b@example.com' });
      const third = await createUser({ email: 'c@example.com' });

      const res = await api.get('/api/users');

      expect(res.status).toBe(200);
      expect(res.body.meta).toEqual({ total: 4, offset: 0, limit: 10 });
      expect(res.body.data.map((u: { id: string }) => u.id)).toEqual([
        third.id,
        second.id,
        first.id,
        admin.id,
      ]);
      expect(res.body.data[0]).not.toHaveProperty('password');
      expect(res.body.data[0]).not.toHaveProperty('_id');
    });

    it('applies offset and limit', async () => {
      await createUser({ email: 'a@example.com' });
      const second = await createUser({ email: 'b@example.com' });
      await createUser({ email: 'c@example.com' });

      const res = await api.get('/api/users?offset=1&limit=1');

      expect(res.status).toBe(200);
      expect(res.body.meta).toEqual({ total: 4, offset: 1, limit: 1 });
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].id).toBe(second.id);
    });

    it('filters by active=false', async () => {
      const inactive = await createUser({ email: 'a@example.com' });
      await createUser({ email: 'b@example.com' });
      await api.patch(`/api/users/${inactive.id}/status`).send({ active: false });

      const res = await api.get('/api/users?active=false');

      expect(res.status).toBe(200);
      expect(res.body.meta.total).toBe(1);
      expect(res.body.data.map((u: { id: string }) => u.id)).toEqual([inactive.id]);
    });

    it('accepts limit=100 (boundary)', async () => {
      const res = await api.get('/api/users?limit=100');

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
      const res = await api.get(`/api/users?${query}`);

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(detailPaths(res.body)).toContain(path);
    });
  });

  describe('GET /api/users/:id', () => {
    it('returns the user', async () => {
      const created = await createUser();

      const res = await api.get(`/api/users/${created.id}`);

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ id: created.id, email: 'jane.doe@example.com' });
      expect(res.body).not.toHaveProperty('password');
    });

    it('answers 404 USER_NOT_FOUND for a missing user', async () => {
      const res = await api.get(`/api/users/${missingId}`);

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('USER_NOT_FOUND');
    });

    it('answers 400 INVALID_ID for a malformed id', async () => {
      const res = await api.get('/api/users/not-an-id');

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('INVALID_ID');
    });
  });

  describe('PATCH /api/users/:id', () => {
    it('updates name and role', async () => {
      const created = await createUser({ role: 'USER' });

      const res = await api
        .patch(`/api/users/${created.id}`)
        .send({ name: 'Renamed', role: 'ADMIN' });

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ id: created.id, name: 'Renamed', role: 'ADMIN' });
      const stored = await UserModel.findById(created.id).lean();
      expect(stored).toMatchObject({ name: 'Renamed', role: 'ADMIN' });
    });

    it('rejects an empty body with 400', async () => {
      const created = await createUser();

      const res = await api.patch(`/api/users/${created.id}`).send({});

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it.each([
      ['password', 'newsecret123'],
      ['email', 'other@example.com'],
    ])('rejects %s in the body with 400 and keeps the stored user', async (field, value) => {
      const created = await createUser();
      const before = await UserModel.findById(created.id).select('+password').lean();

      const res = await api.patch(`/api/users/${created.id}`).send({ [field]: value });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      const after = await UserModel.findById(created.id).select('+password').lean();
      expect(after?.password).toBe(before?.password);
      expect(after?.email).toBe(before?.email);
    });

    it('answers 404 for a missing user', async () => {
      const res = await api.patch(`/api/users/${missingId}`).send({ name: 'X' });

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('USER_NOT_FOUND');
    });

    it('answers 400 INVALID_ID for a malformed id', async () => {
      const res = await api.patch('/api/users/123').send({ name: 'X' });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('INVALID_ID');
    });
  });

  describe('PATCH /api/users/:id/status', () => {
    it('deactivates and reactivates a user without deleting it', async () => {
      const created = await createUser();

      const off = await api.patch(`/api/users/${created.id}/status`).send({ active: false });
      expect(off.status).toBe(200);
      expect(off.body.active).toBe(false);
      expect((await UserModel.findById(created.id).lean())?.active).toBe(false);

      const on = await api.patch(`/api/users/${created.id}/status`).send({ active: true });
      expect(on.status).toBe(200);
      expect(on.body.active).toBe(true);
      expect((await UserModel.findById(created.id).lean())?.active).toBe(true);
      expect(await countOthers()).toBe(1);
    });

    it('requires a boolean active', async () => {
      const created = await createUser();

      const res = await api.patch(`/api/users/${created.id}/status`).send({ active: 'no' });

      expect(res.status).toBe(400);
      expect(detailPaths(res.body)).toContain('active');
    });

    it('answers 404 for a missing user', async () => {
      const res = await api.patch(`/api/users/${missingId}/status`).send({ active: false });

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('USER_NOT_FOUND');
    });
  });

  describe('admin self-protection', () => {
    const cannotModifySelf = {
      error: {
        code: 'CANNOT_MODIFY_SELF',
        message: 'You cannot change your own role or active status',
      },
    };

    async function storedAdmin() {
      return UserModel.findById(admin.id).lean();
    }

    it.each([
      ['PATCH /:id with active=false', '', { active: false }],
      ['PATCH /:id/status with active=false', '/status', { active: false }],
      ['PATCH /:id with a role change', '', { role: 'USER' }],
      ['PATCH /:id with a name and a role change', '', { name: 'Renamed', role: 'USER' }],
    ])('rejects %s on themselves with 409 and keeps the stored user', async (_l, suffix, body) => {
      const before = await storedAdmin();

      const res = await api.patch(`/api/users/${admin.id}${suffix}`).send(body);

      expect(res.status).toBe(409);
      expect(res.body).toEqual(cannotModifySelf);
      expect(await storedAdmin()).toEqual(before);
    });

    it('lets an admin rename themselves', async () => {
      const res = await api.patch(`/api/users/${admin.id}`).send({ name: 'Renamed Admin' });

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ id: admin.id, name: 'Renamed Admin', role: 'ADMIN' });
      expect(await storedAdmin()).toMatchObject({ name: 'Renamed Admin', active: true });
    });

    it('still lets an admin change the role and status of another user', async () => {
      const other = await createUser({ email: 'other@example.com' });

      const demoted = await api.patch(`/api/users/${other.id}`).send({ role: 'USER' });
      const disabled = await api.patch(`/api/users/${other.id}/status`).send({ active: false });

      expect(demoted.status).toBe(200);
      expect(disabled.status).toBe(200);
      expect(await UserModel.findById(other.id).lean()).toMatchObject({
        role: 'USER',
        active: false,
      });
    });
  });
});
