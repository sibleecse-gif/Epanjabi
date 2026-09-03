import jwt, { SignOptions } from 'jsonwebtoken';
import crypto from 'crypto';
import { env } from '../config/env';

interface AccessPayload {
  userId: string;
  email: string;
  role: string;
  type: 'access';
}

interface RefreshPayload {
  userId: string;
  tokenId: string;
  type: 'refresh';
}

export function generateAccessToken(payload: { userId: string; email: string; role: string }): string {
  const token = jwt.sign({ ...payload, type: 'access' } satisfies AccessPayload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN,
  } as SignOptions);
  return token;
}

export function generateRefreshToken(payload: { userId: string }): {
  token: string;
  tokenId: string;
} {
  const tokenId = crypto.randomUUID();
  const token = jwt.sign({ userId: payload.userId, tokenId, type: 'refresh' } satisfies RefreshPayload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN,
  } as SignOptions);
  return { token, tokenId };
}

export function verifyAccessToken(token: string): AccessPayload | null {
  try {
    return jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessPayload;
  } catch {
    return null;
  }
}

export function verifyRefreshToken(token: string): RefreshPayload | null {
  try {
    return jwt.verify(token, env.JWT_REFRESH_SECRET) as RefreshPayload;
  } catch {
    return null;
  }
}

export function getJwtExpiry(expiresIn: string): number {
  const match = expiresIn.match(/^(\d+)([mhd])$/);
  if (!match) return 3600;
  const n = parseInt(match[1], 10);
  const unit = match[2];
  return n * (unit === 'm' ? 60 : unit === 'h' ? 3600 : 86400);
}