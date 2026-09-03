import { Response } from 'express';

export class ApiResponse {
  static success<T>(res: Response, data: T, message = 'Success', statusCode = 200) {
    return res.status(statusCode).json({ success: true, message, data });
  }

  static created<T>(res: Response, data: T, message = 'Created successfully') {
    return this.success(res, data, message, 201);
  }

  static error(res: Response, message: string, statusCode = 400, details?: unknown) {
    return res.status(statusCode).json({
      success: false,
      message,
      ...(details !== undefined ? { details } : {}),
    });
  }
}