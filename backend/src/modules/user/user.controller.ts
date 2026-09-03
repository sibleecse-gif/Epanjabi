import { Request, Response } from 'express';
import { ApiResponse } from '../../utils/apiResponse';
import { asyncHandler } from '../../utils/asyncHandler';
import { authenticate } from '../../middleware/auth.middleware';
import { UserService } from './user.service';
import type { Role } from '@prisma/client';

const service = new UserService();

export const getProfile = [
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    return ApiResponse.success(res, { user: req.user });
  }),
];

export const updateProfile = [
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const user = await service.updateProfile(req.user!.id, req.body);
    return ApiResponse.success(res, { user }, 'Profile updated');
  }),
];

export const listAddresses = [
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const addresses = await service.listAddresses(req.user!.id);
    return ApiResponse.success(res, { addresses });
  }),
];

export const createAddress = [
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const address = await service.createAddress(req.user!.id, req.body);
    return ApiResponse.created(res, { address }, 'Address added');
  }),
];

export const updateAddress = [
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const address = await service.updateAddress(req.user!.id, req.params.id, req.body);
    return ApiResponse.success(res, { address }, 'Address updated');
  }),
];

export const deleteAddress = [
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    await service.deleteAddress(req.user!.id, req.params.id);
    return ApiResponse.success(res, null, 'Address deleted');
  }),
];

export const setDefaultAddress = [
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const address = await service.setDefaultAddress(req.user!.id, req.params.id);
    return ApiResponse.success(res, { address }, 'Default address set');
  }),
];

export type { Role };