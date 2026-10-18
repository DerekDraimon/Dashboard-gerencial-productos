import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import { ProductModel } from '../src/modules/products/products.model.js';
import { UserModel } from '../src/modules/users/users.model.js';
import { bearer, createUserWithToken } from './helpers/auth.js';

const app = createApp();

let adminToken = '';
let userToken = '';

function as(token: string) {
  return {
    get: (path: string) => request(app).get(path).set('Authorization', bearer(token)),
    post: (path: string) => request(app).post(path).set('Authorization', bearer(token)),
    patch: (path: string) => request(app).patch(path).set('Authorization', bearer(token)),
    delete: (path: string) => request(app).delete(path).set('Authorization', bearer(token)),
  };
}

const admin = () => as(adminToken);
const user = () => as(userToken);

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
type ProductBody = { id: string; title: string; creationAt: string; updatedAt: string };

function detailPaths(body: { error: { details?: ErrorDetail[] } }): string[] {
  return (body.error.details ?? []).map((detail) => detail.path);
}

async function createProduct(overrides: Record<string, unknown> = {}): Promise<ProductBody> {
  const res = await admin()
    .post('/api/products')
    .send({ ...validProduct, ...overrides });
  expect(res.status).toBe(201);
  return res.body as ProductBody;
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
    ({ token: adminToken } = await createUserWithToken('ADMIN'));
    ({ token: userToken } = await createUserWithToken('USER'));
  });

  describe('POST /api/products', () => {
    it('lets an ADMIN create a product with every field and persists it', async () => {
      const res = await admin().post('/api/products').send(validProduct);

      expect(res.status).toBe(201);
      expect(res.body).toEqual({
        id: expect.any(String),
        ...validProduct,
        creationAt: expect.any(String),
        updatedAt: expect.any(String),
      });
      expect(res.body).not.toHaveProperty('_id');
      expect(res.body).not.toHaveProperty('__v');

      const stored = await ProductModel.findById(res.body.id).lean();
      expect(stored).toMatchObject(validProduct);
      expect(stored?.creationAt).toBeInstanceOf(Date);
    });

    it('trims text fields and defaults images to an empty array', async () => {
      const { images, ...withoutImages } = validProduct;
      void images;

      const res = await admin()
        .post('/api/products')
        .send({ ...withoutImages, title: '  Mouse  ', category: ' Electronics ' });

      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({ title: 'Mouse', category: 'Electronics', images: [] });
    });

    it('answers 403 FORBIDDEN to a USER and stores nothing', async () => {
      const res = await user().post('/api/products').send(validProduct);

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
      expect(await ProductModel.countDocuments()).toBe(0);
    });

    it('answers 401 UNAUTHENTICATED without a token', async () => {
      const res = await request(app).post('/api/products').send(validProduct);

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHENTICATED');
      expect(await ProductModel.countDocuments()).toBe(0);
    });

    it.each([
      ['price 0', { price: 0 }, 'price'],
      ['negative price', { price: -5 }, 'price'],
      ['price with 3 decimals', { price: 10.999 }, 'price'],
      ['price as a string', { price: '10' }, 'price'],
      ['negative stock', { stock: -1 }, 'stock'],
      ['fractional stock', { stock: 1.5 }, 'stock'],
      ['invalid image URL', { images: ['not-a-url'] }, 'images.0'],
      ['non-http image URL', { images: ['ftp://example.com/a.jpg'] }, 'images.0'],
      [
        '11 images',
        { images: Array.from({ length: 11 }, (_v, i) => `https://example.com/${i}.jpg`) },
        'images',
      ],
      ['empty title', { title: '   ' }, 'title'],
      ['title over 120 chars', { title: 'a'.repeat(121) }, 'title'],
      ['description over 2000 chars', { description: 'a'.repeat(2001) }, 'description'],
      ['category over 60 chars', { category: 'a'.repeat(61) }, 'category'],
      ['unknown field', { sku: 'X-1' }, ''],
    ])('rejects %s with 400 VALIDATION_ERROR', async (_label, overrides, path) => {
      const res = await admin()
        .post('/api/products')
        .send({ ...validProduct, ...overrides });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(detailPaths(res.body)).toContain(path);
      expect(await ProductModel.countDocuments()).toBe(0);
    });

    it.each(['title', 'description', 'price', 'category', 'stock'])(
      'rejects a missing %s with 400',
      async (field) => {
        const body = Object.fromEntries(
          Object.entries(validProduct).filter(([key]) => key !== field),
        );

        const res = await admin().post('/api/products').send(body);

        expect(res.status).toBe(400);
        expect(res.body.error.code).toBe('VALIDATION_ERROR');
        expect(detailPaths(res.body)).toContain(field);
        expect(await ProductModel.countDocuments()).toBe(0);
      },
    );

    it.each([
      ['price 0.01', { price: 0.01 }],
      ['stock 0', { stock: 0 }],
      ['10 images', { images: Array.from({ length: 10 }, (_v, i) => `https://e.com/${i}.jpg`) }],
      ['a 120-char title', { title: 'a'.repeat(120) }],
    ])('accepts %s (boundary)', async (_label, overrides) => {
      const res = await admin()
        .post('/api/products')
        .send({ ...validProduct, ...overrides });

      expect(res.status).toBe(201);
      expect(await ProductModel.findById(res.body.id).lean()).toMatchObject(overrides);
    });
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

    it('filters by the exact category', async () => {
      await insertAt([
        { title: 'Ball', category: 'Deportes', creationAt: '2026-01-01T00:00:00Z' },
        { title: 'Racket', category: 'Deportes', creationAt: '2026-01-02T00:00:00Z' },
        {
          title: 'Ski boots',
          category: 'Deportes de invierno',
          creationAt: '2026-01-03T00:00:00Z',
        },
        { title: 'Novel', category: 'Libros', creationAt: '2026-01-04T00:00:00Z' },
      ]);

      const res = await user().get(`/api/products?category=${encodeURIComponent('Deportes')}`);

      expect(res.status).toBe(200);
      expect(res.body.meta.total).toBe(2);
      expect(titles(res.body)).toEqual(['Racket', 'Ball']);
    });

    it('combines category with search and date range', async () => {
      await insertAt([
        { title: 'Mouse old', category: 'Electrónica', creationAt: '2026-01-01T00:00:00Z' },
        { title: 'Mouse new', category: 'Electrónica', creationAt: '2026-03-01T00:00:00Z' },
        { title: 'Mouse toy', category: 'Juguetes', creationAt: '2026-03-01T00:00:00Z' },
      ]);

      const res = await user().get(
        `/api/products?category=${encodeURIComponent('Electrónica')}&search=mouse&from=2026-02-01`,
      );

      expect(titles(res.body)).toEqual(['Mouse new']);
    });

    it('ignores an empty category', async () => {
      await insertAt([
        { title: 'Ball', category: 'Deportes', creationAt: '2026-01-01T00:00:00Z' },
        { title: 'Novel', category: 'Libros', creationAt: '2026-01-02T00:00:00Z' },
      ]);

      const res = await user().get('/api/products?category=%20');

      expect(res.status).toBe(200);
      expect(res.body.meta.total).toBe(2);
    });

    it.each([
      [`category=${'x'.repeat(61)}`, 'category'],
      ['category=Libros&category=Deportes', 'category'],
    ])('rejects %s with 400 VALIDATION_ERROR', async (query, path) => {
      const res = await user().get(`/api/products?${query}`);

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(detailPaths(res.body)).toContain(path);
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
      const created = await createProduct();

      const res = await user().get(`/api/products/${created.id}`);

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        id: created.id,
        ...validProduct,
        creationAt: created.creationAt,
        updatedAt: created.updatedAt,
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

  describe('PATCH /api/products/:id', () => {
    it('updates only the given fields and refreshes updatedAt', async () => {
      const [id] = await insertAt([{ title: 'Old title', creationAt: '2026-01-01T00:00:00Z' }]);

      const res = await admin().patch(`/api/products/${id}`).send({ price: 30.5, stock: 0 });

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ id, title: 'Old title', price: 30.5, stock: 0 });
      expect(res.body.creationAt).toBe('2026-01-01T00:00:00.000Z');
      expect(new Date(res.body.updatedAt).getTime()).toBeGreaterThan(
        new Date('2026-01-01T00:00:00Z').getTime(),
      );
      const stored = await ProductModel.findById(id).lean();
      expect(stored).toMatchObject({
        title: 'Old title',
        description: validProduct.description,
        price: 30.5,
        stock: 0,
      });
    });

    it('rejects an empty body with 400 and keeps the product', async () => {
      const created = await createProduct();
      const before = await ProductModel.findById(created.id).lean();

      const res = await admin().patch(`/api/products/${created.id}`).send({});

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(await ProductModel.findById(created.id).lean()).toEqual(before);
    });

    it('validates the fields it receives', async () => {
      const created = await createProduct();

      const res = await admin().patch(`/api/products/${created.id}`).send({ price: 0 });

      expect(res.status).toBe(400);
      expect(detailPaths(res.body)).toContain('price');
      expect((await ProductModel.findById(created.id).lean())?.price).toBe(validProduct.price);
    });

    it('answers 404 PRODUCT_NOT_FOUND for a missing product', async () => {
      const res = await admin().patch(`/api/products/${missingId}`).send({ stock: 1 });

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('PRODUCT_NOT_FOUND');
    });

    it('answers 403 to a USER and keeps the product', async () => {
      const created = await createProduct();

      const res = await user().patch(`/api/products/${created.id}`).send({ stock: 1 });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
      expect((await ProductModel.findById(created.id).lean())?.stock).toBe(validProduct.stock);
    });

    it('answers 400 INVALID_ID for a malformed id', async () => {
      const res = await admin().patch('/api/products/123').send({ stock: 1 });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('INVALID_ID');
    });
  });

  describe('response shape', () => {
    it('never exposes _id or __v in list, detail or update responses', async () => {
      const created = await createProduct();
      const expectedKeys = [
        'category',
        'creationAt',
        'description',
        'id',
        'images',
        'price',
        'stock',
        'title',
        'updatedAt',
      ];

      const list = await user().get('/api/products');
      const detail = await user().get(`/api/products/${created.id}`);
      const updated = await admin().patch(`/api/products/${created.id}`).send({ stock: 3 });

      expect(Object.keys(list.body.data[0]).sort()).toEqual(expectedKeys);
      expect(Object.keys(detail.body).sort()).toEqual(expectedKeys);
      expect(Object.keys(updated.body).sort()).toEqual(expectedKeys);
    });
  });

  describe('DELETE /api/products/:id', () => {
    it('deletes the product (204) and a second delete answers 404', async () => {
      const created = await createProduct();

      const first = await admin().delete(`/api/products/${created.id}`);
      expect(first.status).toBe(204);
      expect(first.body).toEqual({});
      expect(await ProductModel.findById(created.id).lean()).toBeNull();

      const second = await admin().delete(`/api/products/${created.id}`);
      expect(second.status).toBe(404);
      expect(second.body.error.code).toBe('PRODUCT_NOT_FOUND');
    });

    it('answers 403 to a USER and keeps the product', async () => {
      const created = await createProduct();

      const res = await user().delete(`/api/products/${created.id}`);

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
      expect(await ProductModel.countDocuments()).toBe(1);
    });

    it('answers 400 INVALID_ID for a malformed id', async () => {
      const res = await admin().delete('/api/products/not-an-id');

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('INVALID_ID');
    });
  });
});
