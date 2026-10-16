import type { RequestHandler } from 'express';
import type { idParamsSchema } from '../../shared/http/object-id.js';
import { validated } from '../../shared/middlewares/validate.js';
import type {
  createProductBodySchema,
  listProductsQuerySchema,
  updateProductBodySchema,
} from './products.schemas.js';
import * as productsService from './products.service.js';

export const listProducts: RequestHandler = async (_req, res) => {
  const query = validated<typeof listProductsQuerySchema>(res, 'query');
  res.json(await productsService.listProducts(query));
};

export const listCategories: RequestHandler = async (_req, res) => {
  res.json(await productsService.listCategories());
};

export const getProduct: RequestHandler = async (_req, res) => {
  const { id } = validated<typeof idParamsSchema>(res, 'params');
  res.json(await productsService.getProductById(id));
};

export const createProduct: RequestHandler = async (_req, res) => {
  const body = validated<typeof createProductBodySchema>(res, 'body');
  res.status(201).json(await productsService.createProduct(body));
};

export const updateProduct: RequestHandler = async (_req, res) => {
  const { id } = validated<typeof idParamsSchema>(res, 'params');
  const body = validated<typeof updateProductBodySchema>(res, 'body');
  res.json(await productsService.updateProduct(id, body));
};

export const deleteProduct: RequestHandler = async (_req, res) => {
  const { id } = validated<typeof idParamsSchema>(res, 'params');
  await productsService.deleteProduct(id);
  res.status(204).end();
};
