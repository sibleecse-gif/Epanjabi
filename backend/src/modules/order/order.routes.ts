import { Router } from 'express';
import { createOrder, listOrders, getOrderDetail, cancelOrder } from './order.controller';
import { validate } from '../../middleware/validate.middleware';
import { createOrderSchema } from './order.validation';

const router = Router();

router.post('/', validate(createOrderSchema), createOrder);
router.get('/', listOrders);
router.get('/:id', getOrderDetail);
router.patch('/:id/cancel', cancelOrder);

export default router;