import { OrderStatus, PaymentStatus } from '@prisma/client';
import axios from 'axios';
import crypto from 'crypto';
import { prisma } from '../../config/database';
import { env } from '../../config/env';
import { sendEmail } from '../../utils/sendEmail';
import { sendSMS } from '../../utils/sendSMS';

/**
 * Payment gateway abstraction.
 *
 * When real credentials (SSLCommerz / bKash) are absent, a **sandbox gateway**
 * is used so the whole flow works end-to-end in development:
 *   1. OrderService creates the order + payment row
 *   2. PaymentService.initiate() returns a sandbox gateway URL pointing to
 *      the frontend mock-pay page
 *   3. The mock page calls /payment/sandbox/:orderId/:status which simulates
 *      the gateway webhook (success / fail / cancel)
 *
 * To go live: fill the env vars and implement the SSLCOMMERZ_* / BKASH_* branches.
 */

interface OrderLike {
  id: string;
  orderNumber: string;
  grandTotal: number;
  paymentType: string;
}

interface CustomerLike {
  name: string;
  email: string;
  phone: string;
}

export class PaymentService {
  get sandboxMode() {
    return !env.SSLCOMMERZ_STORE_ID || !env.SSLCOMMERZ_STORE_PASS;
  }

  async initiate(order: OrderLike, user?: CustomerLike): Promise<string> {
    if (!this.sandboxMode) {
      return this.initiateSslCommerz(order, user);
    }
    return `${env.CLIENT_URL}/payment/mock?orderId=${order.id}&txid=${crypto
      .randomBytes(12)
      .toString('hex')}`;
  }

  private async initiateSslCommerz(order: OrderLike, user?: CustomerLike): Promise<string> {
    const base = env.SSLCOMMERZ_SANDBOX === 'true' ? 'https://sandbox.sslcommerz.com' : 'https://secure.sslcommerz.com';
    const form = new URLSearchParams({
      store_id: env.SSLCOMMERZ_STORE_ID!,
      store_passwd: env.SSLCOMMERZ_STORE_PASS!,
      total_amount: String(order.grandTotal),
      currency: 'BDT',
      tran_id: `AGD-${order.id}`,
      product_category: 'clothing',
      cus_name: user?.name ?? 'Aagdoom Customer',
      cus_email: user?.email ?? '',
      cus_phone: user?.phone ?? '',
      success_url: `${env.CLIENT_URL}/api/payment/success`,
      fail_url: `${env.CLIENT_URL}/api/payment/fail`,
      cancel_url: `${env.CLIENT_URL}/api/payment/cancel`,
    });

    const res = await axios.post(`${base}/gwprocess/v4/api.php`, form.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });

    const data = res.data as { status: string; GatewayPageURL?: string; sessionkey?: string };
    if (data.status !== 'SUCCESS' || !data.GatewayPageURL) {
      throw new Error('SSLCommerz session creation failed');
    }
    return data.GatewayPageURL;
  }

  /** Handle a gateway webhook / callback when the payment is approved. */
  async handleApproved(orderId: string, gatewayRef?: string, gatewayData?: unknown) {
    const order = await prisma.order.findUnique({ where: { id: orderId }, include: { user: true } });
    if (!order) throw Object.assign(new Error('Order not found'), { statusCode: 404 });

    const isOnline = order.paymentType !== 'COD';

    await prisma.$transaction([
      prisma.payment.updateMany({
        where: { orderId },
        data: {
          status: PaymentStatus.APPROVED,
          gatewayRef: gatewayRef ?? order.transactionId,
          gatewayData: (gatewayData as object) ?? undefined,
          verifiedAt: new Date(),
        },
      }),
      prisma.order.update({
        where: { id: orderId },
        data: {
          paymentStatus: PaymentStatus.APPROVED,
          transactionId: gatewayRef ?? order.transactionId,
          status: OrderStatus.CONFIRMED,
        },
      }),
    ]);

    if (isOnline) {
      const banglaTotal = this.toBanglaNumber(order.grandTotal);
      await sendSMS({
        to: order.user.phone,
        message: `আগদুম ফ্যাশন: অর্ডার #${order.orderNumber} এর পেমেন্ট সফল হয়েছে। সর্বমোট: ${banglaTotal} টাকা। ধন্যবাদ!`,
      });
      await sendEmail({
        to: order.user.email,
        subject: `Payment received for order #${order.orderNumber}`,
        html: `<p>Your payment of <strong>${order.grandTotal} BDT</strong> for order <strong>#${order.orderNumber}</strong> has been approved.</p>`,
      });
    }
  }

  /** Handle a gateway failure / cancellation webhook. */
  async handleFailed(orderId: string, gatewayData?: unknown) {
    const order = await prisma.order.findUnique({ where: { id: orderId }, include: { items: true, user: true } });
    if (!order) throw Object.assign(new Error('Order not found'), { statusCode: 404 });

    await prisma.$transaction([
      prisma.payment.updateMany({
        where: { orderId },
        data: { status: PaymentStatus.FAILED, gatewayData: (gatewayData as object) ?? undefined },
      }),
      prisma.order.update({ where: { id: orderId }, data: { paymentStatus: PaymentStatus.FAILED } }),
    ]);

    // Restore stock
    for (const item of order.items) {
      await prisma.product.update({
        where: { id: item.productId },
        data: { stock: { increment: item.qty } },
      });
    }
  }

  /** bKash integration (sandbox simulated, real via API). */
  async createBkashSession(orderId: string) {
    const order = await prisma.order.findUnique({ where: { id: orderId }, include: { user: true, payment: true } });
    if (!order) throw Object.assign(new Error('Order not found'), { statusCode: 404 });
    if (!order.payment) throw Object.assign(new Error('No payment row for this order'), { statusCode: 400 });

    if (env.BKASH_APP_KEY) {
      // Real bKash create-payment call would go here using the token endpoint.
      throw new Error('bKash live integration requires implementation with your credentials');
    }

    // Sandbox
    const paymentID = `BK-${crypto.randomBytes(10).toString('hex')}`;
    await prisma.payment.update({
      where: { orderId },
      data: { gatewayRef: paymentID, status: PaymentStatus.PROCESSING },
    });
    return {
      paymentID,
      createTime: new Date().toISOString(),
      gatewayUrl: `${env.CLIENT_URL}/payment/mock?orderId=${order.id}&txid=${paymentID}`,
      merchantInvoiceNumber: order.orderNumber,
    };
  }

  async executeBkashSession(paymentID: string, orderId: string) {
    // In sandbox, executing simulates a successful callback.
    if (!env.BKASH_APP_KEY) {
      await this.handleApproved(orderId, paymentID, { paymentID, provider: 'bkash-sandbox' });
      return { paymentID, transactionStatus: 'Completed', orderId };
    }
    throw new Error('bKash live integration requires implementation with your credentials');
  }

  private toBanglaNumber(num: number): string {
    const digits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
    return String(num)
      .split('')
      .map((c) => (/\d/.test(c) ? digits[parseInt(c, 10)] : c))
      .join('');
  }
}