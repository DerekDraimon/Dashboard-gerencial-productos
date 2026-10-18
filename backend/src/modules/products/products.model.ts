import { Schema, model } from 'mongoose';
import { PRODUCT_LIMITS } from './products.constants.js';

export interface ProductRecord {
  title: string;
  description: string;
  price: number;
  category: string;
  images: string[];
  stock: number;
  creationAt: Date;
  updatedAt: Date;
}

const productSchema = new Schema<ProductRecord>(
  {
    title: { type: String, required: true, trim: true, maxlength: PRODUCT_LIMITS.titleMaxLength },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: PRODUCT_LIMITS.descriptionMaxLength,
    },
    price: { type: Number, required: true, min: 0.01 },
    category: {
      type: String,
      required: true,
      trim: true,
      maxlength: PRODUCT_LIMITS.categoryMaxLength,
    },
    images: { type: [String], default: [] },
    stock: { type: Number, required: true, min: 0 },
  },
  // No toJSON transform: the service maps documents to `Product` (id, no _id/__v) before they leave it.
  { timestamps: { createdAt: 'creationAt', updatedAt: 'updatedAt' } },
);

productSchema.index({ creationAt: -1 });

export const ProductModel = model<ProductRecord>('Product', productSchema);
