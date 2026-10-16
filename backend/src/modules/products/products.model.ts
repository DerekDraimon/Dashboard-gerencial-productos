import { Schema, model } from 'mongoose';

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
    title: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, required: true, trim: true, maxlength: 2000 },
    price: { type: Number, required: true, min: 0.01 },
    category: { type: String, required: true, trim: true, maxlength: 60 },
    images: { type: [String], default: [] },
    stock: { type: Number, required: true, min: 0 },
  },
  {
    timestamps: { createdAt: 'creationAt', updatedAt: 'updatedAt' },
    toJSON: {
      transform: (_doc, ret) => {
        const { _id, __v, ...rest } = ret;
        void __v;
        return { id: String(_id), ...rest };
      },
    },
  },
);

productSchema.index({ creationAt: -1 });

export const ProductModel = model<ProductRecord>('Product', productSchema);
