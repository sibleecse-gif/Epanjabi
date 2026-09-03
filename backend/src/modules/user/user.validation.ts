import { z } from 'zod';

export const updateProfileSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  phone: z
    .string()
    .regex(/^01[3-9]\d{8}$/, 'Enter a valid Bangladeshi phone number')
    .optional(),
  avatar: z.string().url().optional().nullable(),
});

export const createAddressSchema = z.object({
  fullName: z.string().min(2, 'Recipient name is required'),
  phone: z.string().min(11, 'Enter a valid phone number'),
  fullAddress: z.string().min(10, 'Full address is required'),
  district: z.string().min(2, 'District is required'),
  thana: z.string().min(2, 'Thana is required'),
  postcode: z.string().optional(),
  isDefault: z.boolean().optional().default(false),
});

export const updateAddressSchema = createAddressSchema.partial();

export type CreateAddressInput = z.infer<typeof createAddressSchema>;