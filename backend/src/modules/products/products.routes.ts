import { Router } from 'express';
import { authorize } from '../../shared/auth/authorize.js';
import { validateObjectIdParam } from '../../shared/http/object-id.js';
import { validate } from '../../shared/middlewares/validate.js';
import * as controller from './products.controller.js';
import {
  createProductBodySchema,
  listProductsQuerySchema,
  updateProductBodySchema,
} from './products.schemas.js';

export const productsRouter = Router();

const adminOnly = authorize('ADMIN');

productsRouter.get('/', validate({ query: listProductsQuerySchema }), controller.listProducts);
// Must stay before `/:id`, which would otherwise capture it and answer 400 INVALID_ID.
productsRouter.get('/categories', controller.listCategories);
productsRouter.get('/:id', validateObjectIdParam, controller.getProduct);
productsRouter.post(
  '/',
  adminOnly,
  validate({ body: createProductBodySchema }),
  controller.createProduct,
);
productsRouter.patch(
  '/:id',
  adminOnly,
  validateObjectIdParam,
  validate({ body: updateProductBodySchema }),
  controller.updateProduct,
);
productsRouter.delete('/:id', adminOnly, validateObjectIdParam, controller.deleteProduct);
