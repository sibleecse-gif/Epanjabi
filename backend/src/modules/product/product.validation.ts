import { z } from 'zod';

export const createProductSchema = z.object({
  name: z.string().min(2).max(200),
  description: z.string().min(10),
  price: z.number().int().positive(),
  comparePrice: z.number().int().positive().optional().nullable(),
  categoryId: z.string().min(1),
  sizes: z.array(z.string()).default(['M', 'L', 'XL', 'XXL']),
  stock: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  images: z.array(z.string().url()).optional(),
});

export const updateProductSchema = createProductSchema.partial();

export const listingQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(12),
  category: z.string().optional(),
  q: z.string().optional(),
  sort: z.enum(['newest', 'price_asc', 'price_desc', 'popular']).default('newest'),
  featured: z.enum(['true', 'false']).optional(),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type ListingQuery = z.infer<typeof listingQuerySchema>;