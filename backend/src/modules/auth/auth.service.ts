import { Role } from '@prisma/client';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { prisma } from '../../config/database';
import { redis } from '../../config/redis';
import { env } from '../../config/env';
import { generateAccessToken, generateRefreshToken, getJwtExpiry, verifyRefreshToken } from '../../utils/generateToken';
import { sendEmail } from '../../utils/sendEmail';
import { RegisterInput } from './auth.validation';

const REFRESH_BLACKLIST_PREFIX = 'auth:blacklist:';
const PASSWORD_RESET_PREFIX = 'auth:reset:';

export class AuthService {
  private sanitizeUser(user: { id: string; email: string; name: string; role: Role; phone: string; avatar: string | null }) {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      avatar: user.avatar,
    };
  }

  private async issueTokens(userId: string, email: string, role: Role) {
    const accessToken = generateAccessToken({ userId, email, role });
    const refresh = generateRefreshToken({ userId });
    return {
      accessToken,
      refreshToken: refresh.token,
      refreshTokenId: refresh.tokenId,
      expiresIn: getJwtExpiry(env.JWT_ACCESS_EXPIRES_IN),
    };
  }

  async register(input: RegisterInput) {
    const existing = await prisma.user.findFirst({
      where: { OR: [{ email: input.email }, { phone: input.phone }] },
    });
    if (existing) {
      const err = new Error('An account with this email or phone already exists') as Error & { statusCode: number };
      err.statusCode = 409;
      throw err;
    }

    const hashed = await bcrypt.hash(input.password, 10);
    const user = await prisma.user.create({
      data: {
        name: input.name,
        email: input.email,
        phone: input.phone,
        password: hashed,
      },
    });

    const tokens = await this.issueTokens(user.id, user.email, user.role);
    return { user: this.sanitizeUser(user), tokens };
  }

  async login(email: string, password: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.isActive) {
      const err = new Error('Invalid email or password') as Error & { statusCode: number };
      err.statusCode = 401;
      throw err;
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      const err = new Error('Invalid email or password') as Error & { statusCode: number };
      err.statusCode = 401;
      throw err;
    }

    const tokens = await this.issueTokens(user.id, user.email, user.role);
    return { user: this.sanitizeUser(user), tokens };
  }

  async refresh(refreshToken: string) {
    const payload = verifyRefreshToken(refreshToken);
    if (!payload) {
      const err = new Error('Invalid refresh token') as Error & { statusCode: number };
      err.statusCode = 401;
      throw err;
    }

    const blacklisted = await redis.exists(`${REFRESH_BLACKLIST_PREFIX}${payload.tokenId}`);
    if (blacklisted) {
      const err = new Error('Refresh token has been revoked') as Error & { statusCode: number };
      err.statusCode = 401;
      throw err;
    }

    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user || !user.isActive) {
      const err = new Error('Account not found') as Error & { statusCode: number };
      err.statusCode = 401;
      throw err;
    }

    const tokens = await this.issueTokens(user.id, user.email, user.role);
    return { user: this.sanitizeUser(user), tokens };
  }

  async logout(refreshToken: string) {
    const payload = verifyRefreshToken(refreshToken);
    if (payload) {
      await redis.set(`${REFRESH_BLACKLIST_PREFIX}${payload.tokenId}`, '1', 7 * 24 * 3600);
    }
  }

  async getMe(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      const err = new Error('User not found') as Error & { statusCode: number };
      err.statusCode = 404;
      throw err;
    }
    return this.sanitizeUser(user);
  }

  async forgotPassword(email: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    // Always return success to avoid user enumeration
    if (!user) return { sent: false };

    const token = crypto.randomBytes(32).toString('hex');
    await redis.set(`${PASSWORD_RESET_PREFIX}${token}`, user.id, 30 * 60);

    const resetUrl = `${env.CLIENT_URL}/reset-password?token=${token}`;
    await sendEmail({
      to: user.email,
      subject: 'Reset your Aagdoom password',
      html: `<p>Hello ${user.name},</p><p>Click <a href="${resetUrl}">here</a> to reset your password. This link expires in 30 minutes.</p>`,
    });

    return { sent: true };
  }

  async resetPassword(token: string, newPassword: string) {
    const userId = await redis.get<string>(`${PASSWORD_RESET_PREFIX}${token}`);
    if (!userId) {
      const err = new Error('Invalid or expired reset token') as Error & { statusCode: number };
      err.statusCode = 400;
      throw err;
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({ where: { id: userId }, data: { password: hashed } });
    await redis.del(`${PASSWORD_RESET_PREFIX}${token}`);
  }
}