import { OrderStatus, PaymentStatus } from '@prisma/client';
import { Request, Response } from 'express';
import { ApiResponse } from '../../utils/apiResponse';
import { asyncHandler } from '../../utils/asyncHandler';
import { authenticate } from '../../middleware/auth.middleware';
import { requireAdmin } from '../../middleware/admin.middleware';
import { AdminService } from './admin.service';

const service = new AdminService();
const adminGuard = [authenticate, requireAdmin()];

function toNumber(v: unknown, fallback: number): number {
  const n = parseInt(v as string, 10);
  return Number.isNaN(n) ? fallback : n;
}

export const dashboard = [
  ...adminGuard,
  asyncHandler(async (_req: Request, res: Response) => {
    const stats = await service.dashboardStats();
    return ApiResponse.success(res, { stats });
  }),
];

export const listOrders = [
  ...adminGuard,
  asyncHandler(async (req: Request, res: Response) => {
    const result = await service.listOrders({
      page: toNumber(req.query.page, 1),
      limit: toNumber(req.query.limit, 15),
      status: req.query.status as OrderStatus | undefined,
      search: req.query.search as string | undefined,
    });
    return ApiResponse.success(res, result);
  }),
];

export const updateOrderStatus = [
  ...adminGuard,
  asyncHandler(async (req: Request, res: Response) => {
    const order = await service.updateOrderStatus(req.params.id, req.body.status as OrderStatus);
    return ApiResponse.success(res, { order }, 'Order status updated');
  }),
];

export const listPayments = [
  ...adminGuard,
  asyncHandler(async (req: Request, res: Response) => {
    const result = await service.listPayments({
      page: toNumber(req.query.page, 1),
      limit: toNumber(req.query.limit, 15),
      status: req.query.status as PaymentStatus | undefined,
    });
    return ApiResponse.success(res, result);
  }),
];

export const reviewPayment = [
  ...adminGuard,
  asyncHandler(async (req: Request, res: Response) => {
    const action = req.body.action as 'approve' | 'reject';
    const updated = await service.reviewPayment(req.params.id, action);
    return ApiResponse.success(res, { payment: updated[0], order: updated[1] }, 'Payment reviewed');
  }),
];

export const listUsers = [
  ...adminGuard,
  asyncHandler(async (req: Request, res: Response) => {
    const result = await service.listUsers({
      page: toNumber(req.query.page, 1),
      limit: toNumber(req.query.limit, 15),
      search: req.query.search as string | undefined,
    });
    return ApiResponse.success(res, result);
  }),
];

export const setUserActive = [
  ...adminGuard,
  asyncHandler(async (req: Request, res: Response) => {
    const user = await service.setUserActive(req.params.id, req.body.isActive as boolean);
    return ApiResponse.success(res, { user }, 'User status updated');
  }),
];

export const salesReport = [
  ...adminGuard,
  asyncHandler(async (req: Request, res: Response) => {
    const from = req.query.from ? new Date(req.query.from as string) : new Date(Date.now() - 30 * 86400000);
    const to = req.query.to ? new Date(req.query.to as string) : new Date();
    const report = await service.salesReport(from, to);
    return ApiResponse.success(res, { report });
  }),
];

export const products = [
  ...adminGuard,
  asyncHandler(async (req: Request, res: Response) => {
    const result = await service.listAdminProducts({
      page: toNumber(req.query.page, 1),
      limit: toNumber(req.query.limit, 15),
      q: req.query.q as string | undefined,
    });
    return ApiResponse.success(res, result);
  }),
];

export const getProduct = [
  ...adminGuard,
  asyncHandler(async (req: Request, res: Response) => {
    const product = await service.getProductById(req.params.id);
    return ApiResponse.success(res, { product });
  }),
];

export const createCategory = [
  ...adminGuard,
  asyncHandler(async (req: Request, res: Response) => {
    const category = await service.createCategory(req.body);
    return ApiResponse.created(res, { category }, 'Category created');
  }),
];

export const categories = [
  ...adminGuard,
  asyncHandler(async (_req: Request, res: Response) => {
    const categories = await service.listAllCategories();
    return ApiResponse.success(res, { categories });
  }),
];