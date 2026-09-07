import { Router } from 'express';
import {
  initiatePayment,
  sandboxNotify,
  paymentSuccess,
  paymentFail,
  paymentCancel,
  paymentIpn,
  createBkashPayment,
  executeBkashPayment,
} from './payment.controller';
import { validate } from '../../middleware/validate.middleware';
import { authenticate } from '../../middleware/auth.middleware';
import { bkashCreateSchema, bkashExecuteSchema, initiatePaymentSchema } from './payment.validation';

const router = Router();

router.post('/initiate', authenticate, validate(initiatePaymentSchema), initiatePayment);

// Gateway webhooks (callbacks from SSLCommerz)
router.post('/success', paymentSuccess);
router.post('/fail', paymentFail);
router.post('/cancel', paymentCancel);
router.post('/ipn', paymentIpn);

// bKash
router.post('/bkash/create', authenticate, validate(bkashCreateSchema), createBkashPayment);
router.post('/bkash/execute', authenticate, validate(bkashExecuteSchema), executeBkashPayment);

// Sandbox simulator (dev only)
router.post('/sandbox/:orderId/:status', sandboxNotify);

export default router;