import { z } from 'zod';

export const addToCartSchema = z.object({
  productId: z.string().min(1),
  size: z.string().min(1),
  qty: z.number().int().min(1).max(99).default(1),
});

export const updateCartItemSchema = z.object({
  qty: z.number().int().min(1).max(99).optional(),
  size: z.string().min(1).optional(),
});

export type AddToCartInput = z.infer<typeof addToCartSchema>;