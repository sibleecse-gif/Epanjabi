import { Role } from '@prisma/client';

export interface UpdateProfileInput {
  name?: string;
  phone?: string;
  avatar?: string | null;
}

export { CreateAddressInput } from './user.validation';