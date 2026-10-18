import type { Types } from 'mongoose';
import { AppError } from '../../shared/errors/app-error.js';
import type { Page } from '../../shared/http/pagination.js';
import { ProductModel, type ProductRecord } from './products.model.js';
import type {
  CreateProductInput,
  ImportProductInput,
  ListProductsFilter,
  Product,
  UpdateProductInput,
} from './products.types.js';

const DAY_MS = 24 * 60 * 60 * 1000;

type StoredProduct = ProductRecord & { _id: Types.ObjectId };

function toProduct(doc: StoredProduct): Product {
  return {
    id: doc._id.toString(),
    title: doc.title,
    description: doc.description,
    price: doc.price,
    category: doc.category,
    images: doc.images,
    stock: doc.stock,
    creationAt: doc.creationAt,
    updatedAt: doc.updatedAt,
  };
}

function productNotFound(): AppError {
  return new AppError(404, 'PRODUCT_NOT_FOUND', 'Product not found');
}

/** The search text goes into a `$regex`, so metacharacters are escaped to make `.*` match literally. */
function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function buildListFilter({ search, category, from, to }: ListProductsFilter) {
  const creationAt: { $gte?: Date; $lt?: Date } = {};
  if (from) {
    creationAt.$gte = from;
  }
  if (to) {
    // `to` is a whole day: everything before the start of the next day.
    creationAt.$lt = new Date(to.getTime() + DAY_MS);
  }
  return {
    ...(search ? { title: { $regex: escapeRegex(search), $options: 'i' } } : {}),
    ...(category ? { category } : {}),
    ...(from || to ? { creationAt } : {}),
  };
}

export async function listProducts(filter: ListProductsFilter): Promise<Page<Product>> {
  const { offset, limit } = filter;
  const query = buildListFilter(filter);
  const [docs, total] = await Promise.all([
    // `_id` breaks ties between products created in the same millisecond.
    ProductModel.find(query).sort({ creationAt: -1, _id: -1 }).skip(offset).limit(limit).lean(),
    ProductModel.countDocuments(query),
  ]);
  return { data: docs.map(toProduct), meta: { total, offset, limit } };
}

export async function listCategories(): Promise<string[]> {
  const categories = await ProductModel.distinct('category');
  return categories.sort((a, b) => a.localeCompare(b));
}

export async function getProductById(id: string): Promise<Product> {
  const doc = await ProductModel.findById(id).lean();
  if (!doc) {
    throw productNotFound();
  }
  return toProduct(doc);
}

export async function createProduct(input: CreateProductInput): Promise<Product> {
  const doc = await ProductModel.create(input);
  return toProduct(doc.toObject());
}

export async function hasProducts(): Promise<boolean> {
  return (await ProductModel.exists({})) !== null;
}

/**
 * Keeps the given `creationAt` (and uses it as `updatedAt`): with timestamps on, Mongoose would
 * overwrite both with the insert time.
 */
export async function importProducts(items: ImportProductInput[]): Promise<number> {
  const docs = await ProductModel.insertMany(
    items.map((item) => ({ images: [], ...item, updatedAt: item.creationAt })),
    { timestamps: false },
  );
  return docs.length;
}

export async function updateProduct(id: string, changes: UpdateProductInput): Promise<Product> {
  const doc = await ProductModel.findByIdAndUpdate(
    id,
    { $set: changes },
    { returnDocument: 'after', runValidators: true },
  ).lean();
  if (!doc) {
    throw productNotFound();
  }
  return toProduct(doc);
}

export async function deleteProduct(id: string): Promise<void> {
  const doc = await ProductModel.findByIdAndDelete(id).lean();
  if (!doc) {
    throw productNotFound();
  }
}
