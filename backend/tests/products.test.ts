import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import { ProductModel } from '../src/modules/products/products.model.js';
import { UserModel } from '../src/modules/users/users.model.js';
import { bearer, createUserWithToken } from './helpers/auth.js';

const app = createApp();

let userToken = '';

const user = () => ({
  get: (path: string) => request(app).get(path).set('Authorization', bearer(userToken)),
});

const validProduct = {
  title: 'Wireless Mouse',
  description: 'Ergonomic mouse with USB receiver',
  price: 25.99,
  category: 'Electronics',
  images: ['https://example.com/mouse-1.jpg', 'http://example.com/mouse-2.png'],
  stock: 40,
};

const missingId = new mongoose.Types.ObjectId().toString();

type ErrorDetail = { path: string; message: string };

function detailPaths(body: { error: { details?: ErrorDetail[] } }): string[] {
  return (body.error.details ?? []).map((detail) => detail.path);
}

/** Inserts products with a fixed `creationAt`; `timestamps: false` keeps Mongoose from overwriting it. */
async function insertAt(items: { title: string; creationAt: string; category?: string }[]) {
  const docs = await ProductModel.insertMany(
    items.map(({ title, creationAt, category }) => ({
      ...validProduct,
      title,
      category: category ?? validProduct.category,
      creationAt: new Date(creationAt),
      updatedAt: new Date(creationAt),
    })),
    { timestamps: false },
  );
  return docs.map((doc) => doc._id.toString());
}

function titles(body: { data: { title: string }[] }): string[] {
  return body.data.map((product) => product.title);
}

describe('products module', () => {
  let mongo: MongoMemoryServer;

  beforeAll(async () => {
    mongo = await MongoMemoryServer.create();
    await mongoose.connect(mongo.getUri());
    await UserModel.init();
    await ProductModel.init();
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongo.stop();
  });

  beforeEach(async () => {
    await UserModel.deleteMany({});
    await ProductModel.deleteMany({});
    ({ token: userToken } = await createUserWithToken('USER'));
  });

  describe('GET /api/products', () => {
    it('returns a page with meta, newest first', async () => {
      await insertAt([
        { title: 'Old', creationAt: '2026-01-01T10:00:00Z' },
        { title: 'Newest', creationAt: '2026-03-01T10:00:00Z' },
        { title: 'Middle', creationAt: '2026-02-01T10:00:00Z' },
      ]);

      const res = await user().get('/api/products');

      expect(res.status).toBe(200);
      expect(res.body.meta).toEqual({ total: 3, offset: 0, limit: 10 });
      expect(titles(res.body)).toEqual(['Newest', 'Middle', 'Old']);
      expect(res.body.data[0]).toEqual({
        id: expect.any(String),
        ...validProduct,
        title: 'Newest',
        creationAt: '2026-03-01T10:00:00.000Z',
        updatedAt: '2026-03-01T10:00:00.000Z',
      });
    });

    it('applies offset and limit', async () => {
      await insertAt([
        { title: 'A', creationAt: '2026-01-01T00:00:00Z' },
        { title: 'B', creationAt: '2026-01-02T00:00:00Z' },
        { title: 'C', creationAt: '2026-01-03T00:00:00Z' },
      ]);

      const res = await user().get('/api/products?offset=1&limit=1');

      expect(res.status).toBe(200);
      expect(res.body.meta).toEqual({ total: 3, offset: 1, limit: 1 });
      expect(titles(res.body)).toEqual(['B']);
    });

    it('searches titles case-insensitively by substring', async () => {
      await insertAt([
        { title: 'Wireless Mouse', creationAt: '2026-01-01T00:00:00Z' },
        { title: 'Gaming MOUSEPAD', creationAt: '2026-01-02T00:00:00Z' },
        { title: 'Keyboard', creationAt: '2026-01-03T00:00:00Z' },
      ]);

      const res = await user().get('/api/products?search=mouse');

      expect(res.status).toBe(200);
      expect(res.body.meta.total).toBe(2);
      expect(titles(res.body)).toEqual(['Gaming MOUSEPAD', 'Wireless Mouse']);
    });

    it('treats regex characters in the search literally', async () => {
      await insertAt([
        { title: 'Cable .* edition', creationAt: '2026-01-01T00:00:00Z' },
        { title: 'Cable standard', creationAt: '2026-01-02T00:00:00Z' },
      ]);

      const res = await user().get(`/api/products?search=${encodeURIComponent('.*')}`);

      expect(res.status).toBe(200);
      expect(titles(res.body)).toEqual(['Cable .* edition']);
    });

    it('filters by an inclusive creationAt date range', async () => {
      await insertAt([
        { title: 'Day before from', creationAt: '2026-03-09T23:59:59.999Z' },
        { title: 'Start of from', creationAt: '2026-03-10T00:00:00.000Z' },
        { title: 'End of to', creationAt: '2026-03-15T23:59:59.999Z' },
        { title: 'Day after to', creationAt: '2026-03-16T00:00:00.000Z' },
      ]);

      const res = await user().get('/api/products?from=2026-03-10&to=2026-03-15');

      expect(res.status).toBe(200);
      expect(res.body.meta.total).toBe(2);
      expect(titles(res.body)).toEqual(['End of to', 'Start of from']);
    });

    it('accepts only from or only to, and from equal to to', async () => {
      await insertAt([
        { title: 'March 9', creationAt: '2026-03-09T12:00:00Z' },
        { title: 'March 10', creationAt: '2026-03-10T12:00:00Z' },
      ]);

      const fromOnly = await user().get('/api/products?from=2026-03-10');
      const toOnly = await user().get('/api/products?to=2026-03-09');
      const sameDay = await user().get('/api/products?from=2026-03-10&to=2026-03-10');

      expect(titles(fromOnly.body)).toEqual(['March 10']);
      expect(titles(toOnly.body)).toEqual(['March 9']);
      expect(titles(sameDay.body)).toEqual(['March 10']);
    });

    it('combines search and date range', async () => {
      await insertAt([
        { title: 'Mouse old', creationAt: '2026-01-01T00:00:00Z' },
        { title: 'Mouse new', creationAt: '2026-03-01T00:00:00Z' },
        { title: 'Keyboard new', creationAt: '2026-03-01T00:00:00Z' },
      ]);

      const res = await user().get('/api/products?search=mouse&from=2026-02-01');

      expect(titles(res.body)).toEqual(['Mouse new']);
    });

    it('rejects from after to with 400', async () => {
      const res = await user().get('/api/products?from=2026-03-16&to=2026-03-15');

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(detailPaths(res.body)).toContain('from');
    });

    it.each([
      ['from=2026-3-1', 'from'],
      ['to=2026-02-30', 'to'],
      ['from=yesterday', 'from'],
      ['to=2026-03-15T10:00:00Z', 'to'],
      ['limit=101', 'limit'],
      ['offset=-1', 'offset'],
    ])('rejects %s with 400 VALIDATION_ERROR', async (query, path) => {
      const res = await user().get(`/api/products?${query}`);

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(detailPaths(res.body)).toContain(path);
    });

    it('answers 401 without a token', async () => {
      const res = await request(app).get('/api/products');

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHENTICATED');
    });
  });

  describe('GET /api/products/categories', () => {
    it('returns the distinct categories sorted', async () => {
      await insertAt([
        { title: 'A', creationAt: '2026-01-01T00:00:00Z', category: 'Toys' },
        { title: 'B', creationAt: '2026-01-02T00:00:00Z', category: 'Books' },
        { title: 'C', creationAt: '2026-01-03T00:00:00Z', category: 'Toys' },
        { title: 'D', creationAt: '2026-01-04T00:00:00Z', category: 'Electronics' },
      ]);

      const res = await user().get('/api/products/categories');

      expect(res.status).toBe(200);
      expect(res.body).toEqual(['Books', 'Electronics', 'Toys']);
    });
  });

  describe('GET /api/products/:id', () => {
    it('lets a USER see the detail', async () => {
      const [id] = await insertAt([
        { title: validProduct.title, creationAt: '2026-01-01T00:00:00Z' },
      ]);

      const res = await user().get(`/api/products/${id}`);

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        id,
        ...validProduct,
        creationAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      });
    });

    it('answers 404 PRODUCT_NOT_FOUND for a missing product', async () => {
      const res = await user().get(`/api/products/${missingId}`);

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('PRODUCT_NOT_FOUND');
    });

    it('answers 400 INVALID_ID for a malformed id', async () => {
      const res = await user().get('/api/products/not-an-id');

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('INVALID_ID');
    });
  });
});
