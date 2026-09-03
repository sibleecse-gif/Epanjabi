import { NextFunction, Request, Response } from 'express';
import { ApiResponse } from '../utils/apiResponse';

/**
 * Simple in-memory rate limiter (windowMs per IP+route).
 * Swap for express-rate-limit or redis-backed limiter in production.
 */

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

export function rateLimit({ windowMs = 15 * 60 * 1000, max = 200 } = {}) {
  return (req: Request, res: Response, next: NextFunction) => {
    const key = `${req.ip}:${req.path}`;
    const now = Date.now();
    let bucket = buckets.get(key);

    if (!bucket || now > bucket.resetAt) {
      bucket = { count: 0, resetAt: now + windowMs };
      buckets.set(key, bucket);
    }

    bucket.count += 1;
    if (bucket.count > max) {
      return ApiResponse.error(res, 'Too many requests, please try again later', 429);
    }

    next();
  };
}

export function strictRateLimit({ windowMs = 15 * 60 * 1000, max = 10 } = {}) {
  return rateLimit({ windowMs, max });
}