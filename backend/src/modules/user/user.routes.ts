import { Router } from 'express';
import {
  getProfile,
  updateProfile,
  listAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
} from './user.controller';
import { validate } from '../../middleware/validate.middleware';
import { updateProfileSchema, createAddressSchema, updateAddressSchema } from './user.validation';

const router = Router();

router.get('/profile', getProfile);
router.patch('/profile', validate(updateProfileSchema), updateProfile);

router.get('/addresses', listAddresses);
router.post('/addresses', validate(createAddressSchema), createAddress);
router.patch('/addresses/:id', validate(updateAddressSchema), updateAddress);
router.delete('/addresses/:id', deleteAddress);
router.patch('/addresses/:id/default', setDefaultAddress);

export default router;