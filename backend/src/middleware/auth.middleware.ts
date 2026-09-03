import { NextFunction, Request, Response } from 'express';
import { ApiResponse } from '../utils/apiResponse';
import { verifyAccessToken } from '../utils/generateToken';
import { prisma } from '../config/database';

export async function authenticate(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return ApiResponse.error(res, 'Authentication required', 401);
  }

  const token = header.slice(7);
  const payload = verifyAccessToken(token);

  if (!payload) {
    return ApiResponse.error(res, 'Invalid or expired token', 401);
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { id: true, email: true, name: true, role: true, isActive: true },
  });

  if (!user || !user.isActive) {
    return ApiResponse.error(res, 'Account is inactive or does not exist', 401);
  }

  req.user = user;
  next();
}