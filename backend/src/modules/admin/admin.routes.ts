import { Router } from 'express';
import {
  dashboard,
  listOrders,
  updateOrderStatus,
  listPayments,
  reviewPayment,
  listUsers,
  setUserActive,
  salesReport,
  products,
  getProduct,
  createCategory,
  categories,
} from './admin.controller';
import { validate } from '../../middleware/validate.middleware';
import { z } from 'zod';

const router = Router();

router.get('/dashboard', dashboard);
router.get('/orders', listOrders);
router.patch('/orders/:id', validate(z.object({ status: z.string().min(1) })), updateOrderStatus);
router.get('/payments', listPayments);
router.patch('/payments/:id', validate(z.object({ action: z.enum(['approve', 'reject']) })), reviewPayment);
router.get('/users', listUsers);
router.patch('/users/:id', validate(z.object({ isActive: z.boolean() })), setUserActive);
router.get('/reports/sales', salesReport);
router.get('/products', products);
router.get('/products/:id', getProduct);
router.get('/categories', categories);
router.post('/categories', validate(z.object({ name: z.string().min(2), description: z.string().optional(), icon: z.string().optional() })), createCategory);

export default router;