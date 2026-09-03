import { OrderStatus, PaymentStatus, Prisma, Role } from '@prisma/client';
import { prisma } from '../../config/database';

export class AdminService {
  async dashboardStats() {
    const [today, week, month, yearEnd] = await Promise.all([
      this.revenueBetween(new Date(new Date().setHours(0, 0, 0, 0)), new Date()),
      this.revenueBetween(new Date(Date.now() - 7 * 86400000), new Date()),
      this.revenueBetween(new Date(new Date().setDate(new Date().getDate() - 30)), new Date()),
      this.revenueBetween(new Date(new Date().getFullYear(), 0, 1), new Date()),
    ]);

    const [
      totalOrders,
      pendingOrders,
      pendingPayments,
      totalProducts,
      totalUsers,
      lowStock,
      recentOrders,
      topSelling,
    ] = await Promise.all([
      prisma.order.count(),
      prisma.order.count({ where: { status: OrderStatus.PENDING } }),
      prisma.payment.count({ where: { status: PaymentStatus.PENDING } }),
      prisma.product.count(),
      prisma.user.count({ where: { role: Role.USER } }),
      prisma.product.count({ where: { stock: { lte: 5 }, isActive: true } }),
      prisma.order.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { name: true, email: true } } },
      }),
      prisma.orderItem.groupBy({
        by: ['productId'],
        _sum: { qty: true },
        orderBy: { _sum: { qty: 'desc' } },
        take: 5,
      }),
    ]);

    const topProducts = await prisma.product.findMany({
      where: { id: { in: topSelling.map((t) => t.productId) } },
      select: { id: true, name: true, price: true },
    });

    return {
      revenue: { today, week, month, year: yearEnd },
      totalOrders,
      pendingOrders,
      pendingPayments,
      totalProducts,
      totalUsers,
      lowStock,
      recentOrders,
      topSelling: topProducts.map((p) => {
        const agg = topSelling.find((t) => t.productId === p.id);
        return { ...p, totalQty: agg?._sum.qty ?? 0 };
      }),
    };
  }

  private async revenueBetween(from: Date, to: Date) {
    const res = await prisma.order.aggregate({
      where: {
        createdAt: { gte: from, lte: to },
        status: { notIn: [OrderStatus.CANCELLED, OrderStatus.RETURNED] },
      },
      _sum: { grandTotal: true },
      _count: true,
    });
    return { amount: res._sum.grandTotal ?? 0, orders: res._count };
  }

  async listOrders(params: { page: number; limit: number; status?: OrderStatus; search?: string }) {
    const where: Prisma.OrderWhereInput = {};
    if (params.status) where.status = params.status;
    if (params.search) {
      where.orderNumber = { contains: params.search, mode: 'insensitive' };
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          items: true,
          user: { select: { name: true, email: true, phone: true } },
          address: { select: { district: true, thana: true, fullAddress: true } },
          payment: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: (params.page - 1) * params.limit,
        take: params.limit,
      }),
      prisma.order.count({ where }),
    ]);

    return { orders, total, page: params.page, limit: params.limit, totalPages: Math.ceil(total / params.limit) };
  }

  async updateOrderStatus(orderId: string, status: OrderStatus) {
    return prisma.order.update({ where: { id: orderId }, data: { status } });
  }

  async listPayments(params: { page: number; limit: number; status?: PaymentStatus }) {
    const where: Prisma.PaymentWhereInput = {};
    if (params.status) where.status = params.status;

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        include: { order: { include: { user: { select: { name: true, email: true, phone: true } } } } },
        orderBy: { createdAt: 'desc' },
        skip: (params.page - 1) * params.limit,
        take: params.limit,
      }),
      prisma.payment.count({ where }),
    ]);

    return { payments, total, page: params.page, limit: params.limit, totalPages: Math.ceil(total / params.limit) };
  }

  async reviewPayment(paymentId: string, action: 'approve' | 'reject') {
    const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
    if (!payment) throw Object.assign(new Error('Payment not found'), { statusCode: 404 });

    const status = action === 'approve' ? PaymentStatus.APPROVED : PaymentStatus.FAILED;

    const updated = await prisma.$transaction([
      prisma.payment.update({
        where: { id: paymentId },
        data: { status, verifiedAt: action === 'approve' ? new Date() : undefined },
      }),
      prisma.order.update({
        where: { id: payment.orderId },
        data: {
          paymentStatus: status,
          ...(action === 'approve' ? { status: OrderStatus.CONFIRMED } : {}),
        },
      }),
    ]);

    return updated;
  }

  async listUsers(params: { page: number; limit: number; search?: string }) {
    const where: Prisma.UserWhereInput = {};
    if (params.search) {
      where.OR = [
        { name: { contains: params.search, mode: 'insensitive' } },
        { email: { contains: params.search, mode: 'insensitive' } },
        { phone: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          isActive: true,
          createdAt: true,
          _count: { select: { orders: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (params.page - 1) * params.limit,
        take: params.limit,
      }),
      prisma.user.count({ where }),
    ]);

    return { users, total, page: params.page, limit: params.limit, totalPages: Math.ceil(total / params.limit) };
  }

  async setUserActive(userId: string, isActive: boolean) {
    return prisma.user.update({ where: { id: userId }, data: { isActive } });
  }

  async salesReport(from: Date, to: Date) {
    const orders = await prisma.order.findMany({
      where: {
        createdAt: { gte: from, lte: to },
        status: { notIn: [OrderStatus.CANCELLED, OrderStatus.RETURNED] },
      },
      include: { items: true },
      orderBy: { createdAt: 'asc' },
    });

    const totalRevenue = orders.reduce((s, o) => s + o.grandTotal, 0);
    const totalOrders = orders.length;
    const byPaymentType: Record<string, { orders: number; revenue: number }> = {};

    for (const o of orders) {
      byPaymentType[o.paymentType] ??= { orders: 0, revenue: 0 };
      byPaymentType[o.paymentType].orders += 1;
      byPaymentType[o.paymentType].revenue += o.grandTotal;
    }

    const perDay: Record<string, { orders: number; revenue: number }> = {};
    for (const o of orders) {
      const day = o.createdAt.toISOString().slice(0, 10);
      perDay[day] ??= { orders: 0, revenue: 0 };
      perDay[day].orders += 1;
      perDay[day].revenue += o.grandTotal;
    }

    return {
      from,
      to,
      totalRevenue,
      totalOrders,
      avgOrderValue: totalOrders ? Math.round(totalRevenue / totalOrders) : 0,
      byPaymentType,
      perDay,
    };
  }

  async listAdminProducts(params: { page: number; limit: number; q?: string }) {
    const where: Prisma.ProductWhereInput = {};
    if (params.q) where.name = { contains: params.q, mode: 'insensitive' };

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          category: { select: { id: true, name: true, slug: true } },
          images: { orderBy: { isPrimary: 'desc' }, take: 1 },
          _count: { select: { orderItems: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (params.page - 1) * params.limit,
        take: params.limit,
      }),
      prisma.product.count({ where }),
    ]);

    return { products, total, page: params.page, limit: params.limit, totalPages: Math.ceil(total / params.limit) };
  }

  async getProductById(id: string) {
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        images: { orderBy: [{ isPrimary: 'desc' }, { sortOrder: 'asc' }] },
      },
    });
    if (!product) throw Object.assign(new Error('Product not found'), { statusCode: 404 });
    return product;
  }

  async createCategory(data: { name: string; description?: string; icon?: string }) {
    const slug = data.name
      .toLowerCase()
      .trim()
      .replace(/[^\u0980-\u09FFa-z0-9\s\-]/g, '')
      .replace(/[\s_]+/g, '-')
      .replace(/^-|-$/g, '');
    return prisma.category.create({ data: { ...data, slug } });
  }

  async listAllCategories() {
    return prisma.category.findMany({
      include: { _count: { select: { products: true } } },
      orderBy: { createdAt: 'asc' },
    });
  }
}