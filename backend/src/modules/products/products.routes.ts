import { Router } from 'express';
import { validateObjectIdParam } from '../../shared/http/object-id.js';
import { validate } from '../../shared/middlewares/validate.js';
import * as controller from './products.controller.js';
import { listProductsQuerySchema } from './products.schemas.js';

export const productsRouter = Router();

productsRouter.get('/', validate({ query: listProductsQuerySchema }), controller.listProducts);
// Must stay before `/:id`, which would otherwise capture it and answer 400 INVALID_ID.
productsRouter.get('/categories', controller.listCategories);
productsRouter.get('/:id', validateObjectIdParam, controller.getProduct);
