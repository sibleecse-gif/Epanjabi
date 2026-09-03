import type { z } from 'zod';
import type { createProductSchema, updateProductSchema } from './product.validation';

export type { ListingQuery } from './product.validation';

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;