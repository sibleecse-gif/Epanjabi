import { NextFunction, Request, Response } from 'express';
import { Role } from '@prisma/client';
import { ApiResponse } from '../utils/apiResponse';

export function requireAdmin(roles: Role[] = [Role.ADMIN, Role.SUPER_ADMIN]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return ApiResponse.error(res, 'Authentication required', 401);
    }
    if (!roles.includes(req.user.role)) {
      return ApiResponse.error(res, 'Admin access required', 403);
    }
    next();
  };
}