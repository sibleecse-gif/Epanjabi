import { z } from 'zod';

export const initiatePaymentSchema = z.object({
  orderId: z.string().min(1),
});

export const gatewayCallbackSchema = z.object({
  status: z.string(),
  tran_id: z.string().optional(),
  order_id: z.string().optional(),
  amount: z.coerce.number().optional(),
  currency: z.string().optional(),
  val_id: z.string().optional(),
  card_type: z.string().optional(),
  error: z.string().optional(),
});

export const bkashCreateSchema = z.object({
  orderId: z.string().min(1),
});

export const bkashExecuteSchema = z.object({
  paymentID: z.string().min(1),
  orderId: z.string().min(1),
});