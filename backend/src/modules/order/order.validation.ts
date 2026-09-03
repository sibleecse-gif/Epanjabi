import { z } from 'zod';
import { PaymentType } from '@prisma/client';

export const createOrderSchema = z.object({
  addressId: z.string().min(1, 'Delivery address is required'),
  paymentType: z.enum(['COD', 'BKASH', 'NAGAD', 'ROCKET', 'CARD', 'INTERNET_BANKING']).default('COD'),
  notes: z.string().max(500).optional(),
});

export const cancelOrderSchema = z.object({});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type PaymentMethod = PaymentType;