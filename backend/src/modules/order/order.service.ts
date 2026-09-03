import { OrderStatus, PaymentStatus, PaymentType, Prisma } from '@prisma/client';
import { prisma } from '../../config/database';
import { redis } from '../../config/redis';
import { sendEmail, orderConfirmationEmail } from '../../utils/sendEmail';
import { sendSMS } from '../../utils/sendSMS';
import { CreateOrderInput } from './order.validation';
import { PaymentService } from '../payment/payment.service';

const ORDER_LOCK_PREFIX = 'lock:product:';
const DELIVERY_FEE = 60;

export class OrderService {
  private paymentService: PaymentService;

  constructor() {
    this.paymentService = new PaymentService();
  }

  async createOrder(userId: string, input: CreateOrderInput) {
    const address = await prisma.address.findFirst({ where: { id: input.addressId, userId } });
    if (!address) {
      const err = new Error('Delivery address not found') as Error & { statusCode: number };
      err.statusCode = 404;
      throw err;
    }

    const cartItems = await prisma.cart.findMany({
      where: { userId },
      include: { product: true },
    });

    if (!cartItems.length) {
      const err = new Error('Your cart is empty') as Error & { statusCode: number };
      err.statusCode = 400;
      throw err;
    }

    // Validate stock & acquire inventory lock (10 min TTL)
    for (const item of cartItems) {
      const lockKey = `${ORDER_LOCK_PREFIX}${item.productId}:${item.size}`;
      const locked = await redis.exists(lockKey);
      if (locked) {
        const err = new Error(`"${item.product.name}" is being checked out by another customer. Try again shortly.`) as Error & {
          statusCode: number;
        };
        err.statusCode = 409;
        throw err;
      }
      if (item.product.stock < item.qty || item.qty > item.product.stock) {
        const err = new Error(`Insufficient stock for "${item.product.name}"`) as Error & { statusCode: number };
        err.statusCode = 409;
        throw err;
      }
    }

    const subtotal = cartItems.reduce((sum, i) => sum + i.product.price * i.qty, 0);
    const grandTotal = subtotal + DELIVERY_FEE;
    const isOnline = input.paymentType !== 'COD';

    const now = new Date();
    const orderNumber = await this.generateOrderNumber(now);
    const user = await prisma.user.findUnique({ where: { id: userId } });

    const result = await prisma.$transaction(async (tx) => {
      // Lock stock
      for (const item of cartItems) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.qty } },
        });
      }

      const order = await tx.order.create({
        data: {
          orderNumber,
          userId,
          addressId: address.id,
          subtotal,
          deliveryFee: DELIVERY_FEE,
          discount: 0,
          grandTotal,
          paymentType: input.paymentType,
          paymentStatus: isOnline ? PaymentStatus.PENDING : PaymentStatus.APPROVED,
          notes: input.notes,
          items: {
            create: cartItems.map((i) => ({
              productId: i.productId,
              name: i.product.name,
              price: i.product.price,
              qty: i.qty,
              size: i.size,
            })),
          },
        },
        include: { items: true, address: true },
      });

      if (isOnline) {
        await tx.payment.create({
          data: {
            orderId: order.id,
            method: input.paymentType,
            amount: grandTotal,
            status: PaymentStatus.PENDING,
          },
        });
      }

      await tx.cart.deleteMany({ where: { userId } });
      return order;
    });

    for (const item of cartItems) {
      await redis.set(`${ORDER_LOCK_PREFIX}${item.productId}:${item.size}`, result.id, 600);
    }

    // Notifications
    const banglaTotal = this.toBanglaNumber(grandTotal);
    const smsMessage = `আগদুম ফ্যাশন: আপনার অর্ডার #${orderNumber} গ্রহণ করা হয়েছে। সর্বমোট: ${banglaTotal} টাকা। ডেলিভারি: ৩-৫ কর্মদিবস। ধন্যবাদ!`;
    await sendSMS({ to: user?.phone ?? '', message: smsMessage });
    await sendEmail({
      to: user?.email ?? '',
      subject: `Order #${orderNumber} confirmed`,
      html: orderConfirmationEmail(orderNumber, grandTotal, DELIVERY_FEE),
    });

    // For online payments, initiate the gateway session
    let gatewayUrl: string | null = null;
    if (isOnline) {
      gatewayUrl = await this.paymentService.initiate(
        {
          id: result.id,
          orderNumber: result.orderNumber,
          grandTotal: result.grandTotal,
          paymentType: result.paymentType,
        },
        user
          ? { name: user.name, email: user.email, phone: user.phone }
          : undefined
      );
    }

    return { order: result, gatewayUrl, isOnline };
  }

  async listUserOrders(userId: string) {
    return prisma.order.findMany({
      where: { userId },
      include: {
        items: true,
        payment: true,
        address: { select: { district: true, thana: true, fullAddress: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getOrderDetail(userId: string, orderId: string) {
    const order = await prisma.order.findFirst({
      where: { id: orderId, userId },
      include: { items: true, payment: true, address: true },
    });
    if (!order) {
      const err = new Error('Order not found') as Error & { statusCode: number };
      err.statusCode = 404;
      throw err;
    }
    return order;
  }

  async cancelOrder(userId: string, orderId: string) {
    const order = await prisma.order.findFirst({ where: { id: orderId, userId } });
    if (!order) {
      const err = new Error('Order not found') as Error & { statusCode: number };
      err.statusCode = 404;
      throw err;
    }
    if (order.status !== OrderStatus.PENDING && order.status !== OrderStatus.CONFIRMED) {
      const err = new Error('This order can no longer be cancelled') as Error & { statusCode: number };
      err.statusCode = 400;
      throw err;
    }

    const items = await prisma.orderItem.findMany({ where: { orderId } });

    const updated = await prisma.$transaction(async (tx) => {
      for (const item of items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.qty } },
        });
      }
      return tx.order.update({
        where: { id: orderId },
        data: {
          status: OrderStatus.CANCELLED,
          ...(order.paymentStatus === PaymentStatus.APPROVED
            ? { paymentStatus: PaymentStatus.REFUNDED }
            : {}),
        },
      });
    });

    const lockKeys = items.map(
      (i) => `${ORDER_LOCK_PREFIX}${i.productId}:${i.size}`
    );
    if (lockKeys.length) await redis.del(...lockKeys);

    return updated;
  }

  private async generateOrderNumber(date: Date): Promise<string> {
    const yyyymmdd = [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, '0'),
      String(date.getDate()).padStart(2, '0'),
    ].join('');

    const count = await prisma.order.count({
      where: { createdAt: { gte: new Date(date.setHours(0, 0, 0, 0)), lt: new Date(date.setHours(23, 59, 59, 999)) } },
    });

    return `AGD-${yyyymmdd}-${String(count + 1).padStart(4, '0')}`;
  }

  private toBanglaNumber(num: number): string {
    const digits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
    return String(num)
      .split('')
      .map((c) => (/\d/.test(c) ? digits[parseInt(c, 10)] : c))
      .join('');
  }
}