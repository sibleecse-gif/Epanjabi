import { Request, Response } from 'express';
import { ApiResponse } from '../../utils/apiResponse';
import { asyncHandler } from '../../utils/asyncHandler';
import { authenticate } from '../../middleware/auth.middleware';
import { CartService } from './cart.service';

const service = new CartService();

export const getCart = [
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const cart = await service.getCart(req.user!.id);
    return ApiResponse.success(res, cart);
  }),
];

export const addToCart = [
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const item = await service.addItem(req.user!.id, req.body);
    return ApiResponse.created(res, { item }, 'Added to cart');
  }),
];

export const updateCartItem = [
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const item = await service.updateItem(req.user!.id, req.params.id, req.body);
    return ApiResponse.success(res, { item }, 'Cart updated');
  }),
];

export const removeFromCart = [
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    await service.removeItem(req.user!.id, req.params.id);
    return ApiResponse.success(res, null, 'Item removed from cart');
  }),
];

export const clearCart = [
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    await service.clear(req.user!.id);
    return ApiResponse.success(res, null, 'Cart cleared');
  }),
];