import { Request, Response } from 'express';
import { ApiResponse } from '../../utils/apiResponse';
import { asyncHandler } from '../../utils/asyncHandler';
import { AuthService } from './auth.service';
import { authenticate } from '../../middleware/auth.middleware';

const service = new AuthService();

export const register = asyncHandler(async (req: Request, res: Response) => {
  const { user, tokens } = await service.register(req.body);
  return ApiResponse.created(res, { user, tokens }, 'Account created successfully');
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { user, tokens } = await service.login(req.body.email, req.body.password);
  return ApiResponse.success(res, { user, tokens }, 'Login successful');
});

export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const { user, tokens } = await service.refresh(req.body.refreshToken);
  return ApiResponse.success(res, { user, tokens }, 'Tokens refreshed');
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  await service.logout(req.body.refreshToken ?? '');
  return ApiResponse.success(res, null, 'Logged out successfully');
});

export const getMe = [
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const user = await service.getMe(req.user!.id);
    return ApiResponse.success(res, { user });
  }),
];

export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
  await service.forgotPassword(req.body.email);
  return ApiResponse.success(
    res,
    null,
    'If an account exists for that email, a password reset link has been sent'
  );
});

export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  await service.resetPassword(req.body.token, req.body.password);
  return ApiResponse.success(res, null, 'Password reset successfully');
});