import { Router } from 'express';
import {
  listProducts,
  getFeaturedProducts,
  getProductBySlug,
  listCategories,
  createProduct,
  updateProduct,
  deleteProduct,
  uploadProductImages,
} from './product.controller';
import { validate } from '../../middleware/validate.middleware';
import { createProductSchema, listingQuerySchema, updateProductSchema } from './product.validation';

const router = Router();

router.get('/categories', listCategories);
router.get('/featured', getFeaturedProducts);
router.get('/', validate(listingQuerySchema, 'query'), listProducts);
router.get('/:slug', getProductBySlug);

router.post('/', validate(createProductSchema), createProduct);
router.put('/:id', validate(updateProductSchema), updateProduct);
router.delete('/:id', deleteProduct);
router.post('/:id/images', uploadProductImages);

export default router;