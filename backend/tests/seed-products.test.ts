import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { ProductModel } from '../src/modules/products/products.model.js';
import { SAMPLE_PRODUCTS, seedProducts } from '../src/scripts/seed-products.js';

const DAY_MS = 24 * 60 * 60 * 1000;
const now = new Date('2026-10-16T12:00:00Z');

describe('seedProducts', () => {
  let mongo: MongoMemoryServer;

  beforeAll(async () => {
    mongo = await MongoMemoryServer.create();
    await mongoose.connect(mongo.getUri());
    await ProductModel.init();
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongo.stop();
  });

  beforeEach(async () => {
    await ProductModel.deleteMany({});
  });

  it('inserts about 20 products over 5 categories spread over the last 60 days', async () => {
    const result = await seedProducts(now);

    expect(result).toEqual({ inserted: SAMPLE_PRODUCTS.length, skipped: false });
    expect(SAMPLE_PRODUCTS.length).toBeGreaterThanOrEqual(18);
    expect(SAMPLE_PRODUCTS.length).toBeLessThanOrEqual(22);

    const products = await ProductModel.find().lean();
    expect(products).toHaveLength(SAMPLE_PRODUCTS.length);
    expect([...new Set(products.map((p) => p.category))].sort()).toEqual([
      'Deportes',
      'Electrónica',
      'Hogar',
      'Juguetes',
      'Libros',
    ]);
    expect(new Set(products.map((p) => p.price)).size).toBeGreaterThan(10);
    expect(new Set(products.map((p) => p.stock)).size).toBeGreaterThan(10);

    const ages = products.map((p) => (now.getTime() - p.creationAt.getTime()) / DAY_MS);
    expect(Math.min(...ages)).toBeGreaterThanOrEqual(0);
    expect(Math.max(...ages)).toBeLessThanOrEqual(60);
    expect(Math.max(...ages) - Math.min(...ages)).toBeGreaterThan(30);
    expect(new Set(products.map((p) => p.creationAt.toISOString())).size).toBe(products.length);
  });

  it('is idempotent: a second run keeps the same products', async () => {
    await seedProducts(now);
    const before = await ProductModel.find().sort({ _id: 1 }).lean();

    const second = await seedProducts(now);

    expect(second).toEqual({ inserted: 0, skipped: true });
    expect(await ProductModel.find().sort({ _id: 1 }).lean()).toEqual(before);
  });

  it('does not touch a collection that already has products', async () => {
    const existing = await ProductModel.create({
      title: 'Existing',
      description: 'Created by hand',
      price: 9.99,
      category: 'Misc',
      stock: 3,
    });

    const result = await seedProducts(now);

    expect(result).toEqual({ inserted: 0, skipped: true });
    const all = await ProductModel.find().lean();
    expect(all).toEqual([existing.toObject()]);
  });
});
