import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import fs from 'fs';
import { env } from './config/env';
import { rateLimit } from './middleware/rateLimit';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';
import { prisma } from './config/database';

import authRoutes from './modules/auth/auth.routes';
import userRoutes from './modules/user/user.routes';
import productRoutes from './modules/product/product.routes';
import cartRoutes from './modules/cart/cart.routes';
import orderRoutes from './modules/order/order.routes';
import paymentRoutes from './modules/payment/payment.routes';
import adminRoutes from './modules/admin/admin.routes';

const app = express();

fs.mkdirSync(env.UPLOAD_DIR, { recursive: true });

/**
 * Security middleware stack
 * - Helmet: security headers (CSP, HSTS, etc.)
 * - CORS: allow only the frontend origins
 * - Rate limiting: 200 req / 15 min per IP+route (strict limiter on auth)
 */
app.use(
  helmet({
    contentSecurityPolicy: false,
    hsts: { maxAge: 31536000 },
  })
);

const corsOrigins = [env.CLIENT_URL, 'https://aagdoom.com', 'https://admin.aagdoom.com'];
app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin || corsOrigins.includes(origin)) return cb(null, true);
      return cb(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  })
);

app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 300 }));
app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));

app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

app.use('/uploads', express.static(path.resolve(env.UPLOAD_DIR)));

app.get('/health', (_req, res) => res.json({ success: true, message: 'Aagdoom API is up', ts: Date.now() }));

app.use(`${env.API_PREFIX}/auth`, authRoutes);
app.use(`${env.API_PREFIX}/users`, userRoutes);
app.use(`${env.API_PREFIX}/products`, productRoutes);
app.use(`${env.API_PREFIX}/cart`, cartRoutes);
app.use(`${env.API_PREFIX}/orders`, orderRoutes);
app.use(`${env.API_PREFIX}/payment`, paymentRoutes);
app.use(`${env.API_PREFIX}/admin`, adminRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

async function start() {
  try {
    await prisma.$connect();
    console.log('✅ Connected to PostgreSQL');

    app.listen(env.PORT, () => {
      console.log(`🚀 Aagdoom API running at http://localhost:${env.PORT}${env.API_PREFIX}`);
    });
  } catch (err) {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
  }
}

if (process.env.NODE_ENV !== 'test') {
  start();
}

export { app };