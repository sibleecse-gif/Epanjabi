import { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { isProduction } from '../config/env';

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
}

export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    return res.status(422).json({
      success: false,
      message: 'Validation failed',
      details: err.issues.map((i) => ({ field: i.path.join('.'), message: i.message })),
    });
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case 'P2002': {
        const target = (err.meta?.target as string[])?.join(', ') ?? 'field';
        return res.status(409).json({
          success: false,
          message: `A record with this ${target} already exists`,
        });
      }
      case 'P2025':
        return res.status(404).json({ success: false, message: 'Record not found' });
      default:
        break;
    }
  }

  const status = (err as { statusCode?: number }).statusCode ?? 500;
  const message = status === 500 && isProduction ? 'Internal server error' : (err as Error).message;

  if (status >= 500) console.error('❌', err);
  return res.status(status).json({ success: false, message });
}