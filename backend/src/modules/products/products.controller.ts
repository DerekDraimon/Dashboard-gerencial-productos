import type { RequestHandler } from 'express';
import type { idParamsSchema } from '../../shared/http/object-id.js';
import { validated } from '../../shared/middlewares/validate.js';
import type { listProductsQuerySchema } from './products.schemas.js';
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
