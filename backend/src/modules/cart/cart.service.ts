import { prisma } from '../../config/database';
import { redis } from '../../config/redis';
import { AddToCartInput } from './cart.validation';

const CART_CACHE_PREFIX = 'cart:';

export class CartService {
  private async getDbCart(userId: string) {
    return prisma.cart.findMany({
      where: { userId },
      include: {
        product: {
          include: {
            images: { orderBy: [{ isPrimary: 'desc' }, { sortOrder: 'asc' }], take: 1 },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  private async invalidate(userId: string) {
    await redis.del(`${CART_CACHE_PREFIX}${userId}`);
  }

  async getCart(userId: string) {
    const key = `${CART_CACHE_PREFIX}${userId}`;
    interface CartResult {
      items: Awaited<ReturnType<CartService['getDbCart']>>;
      subtotal: number;
      totalItems: number;
    }
    const cached = await redis.get<CartResult>(key);
    if (cached) return cached;

    const items = await this.getDbCart(userId);
    const subtotal = items.reduce((sum, i) => sum + i.product.price * i.qty, 0);

    const result = { items, subtotal, totalItems: items.reduce((s, i) => s + i.qty, 0) };
    await redis.set(key, JSON.stringify(result), 1800);
    return result;
  }

  async addItem(userId: string, input: AddToCartInput) {
    const product = await prisma.product.findUnique({ where: { id: input.productId } });
    if (!product || !product.isActive) {
      const err = new Error('Product not found') as Error & { statusCode: number };
      err.statusCode = 404;
      throw err;
    }
    if (!product.sizes.includes(input.size)) {
      const err = new Error(`Size ${input.size} is not available`) as Error & { statusCode: number };
      err.statusCode = 400;
      throw err;
    }

    if (product.stock <= 0) {
      const err = new Error('Product is out of stock') as Error & { statusCode: number };
      err.statusCode = 409;
      throw err;
    }

    const existing = await prisma.cart.findUnique({
      where: { userId_productId_size: { userId, productId: input.productId, size: input.size } },
    });

    let item;
    if (existing) {
      const newQty = Math.min(existing.qty + input.qty, product.stock);
      if (newQty < existing.qty + input.qty) {
        const err = new Error('Requested quantity exceeds available stock') as Error & { statusCode: number };
        err.statusCode = 409;
        throw err;
      }
      item = await prisma.cart.update({
        where: { id: existing.id },
        data: { qty: newQty },
      });
    } else {
      if (input.qty > product.stock) {
        const err = new Error('Requested quantity exceeds available stock') as Error & { statusCode: number };
        err.statusCode = 409;
        throw err;
      }
      item = await prisma.cart.create({
        data: { userId, productId: input.productId, size: input.size, qty: input.qty },
      });
    }

    await this.invalidate(userId);
    return item;
  }

  async updateItem(userId: string, itemId: string, data: { qty?: number; size?: string }) {
    const item = await prisma.cart.findFirst({ where: { id: itemId, userId } });
    if (!item) {
      const err = new Error('Cart item not found') as Error & { statusCode: number };
      err.statusCode = 404;
      throw err;
    }

    const product = await prisma.product.findUnique({ where: { id: item.productId } });
    if (data.size && product && !product.sizes.includes(data.size)) {
      const err = new Error(`Size ${data.size} is not available`) as Error & { statusCode: number };
      err.statusCode = 400;
      throw err;
    }

    if (data.qty !== undefined) {
      if (!product) {
        const err = new Error('Product not found') as Error & { statusCode: number };
        err.statusCode = 404;
        throw err;
      }
      if (data.qty > product.stock) {
        const err = new Error('Requested quantity exceeds available stock') as Error & { statusCode: number };
        err.statusCode = 409;
        throw err;
      }
    }

    const updated = await prisma.cart.update({
      where: { id: itemId },
      data: {
        qty: data.qty,
        size: data.size,
      },
    });

    await this.invalidate(userId);
    return updated;
  }

  async removeItem(userId: string, itemId: string) {
    const item = await prisma.cart.findFirst({ where: { id: itemId, userId } });
    if (!item) {
      const err = new Error('Cart item not found') as Error & { statusCode: number };
      err.statusCode = 404;
      throw err;
    }
    await prisma.cart.delete({ where: { id: itemId } });
    await this.invalidate(userId);
  }

  async clear(userId: string) {
    await prisma.cart.deleteMany({ where: { userId } });
    await this.invalidate(userId);
  }
}