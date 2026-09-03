import { Request, Response } from 'express';
import { ApiResponse } from '../../utils/apiResponse';
import { asyncHandler } from '../../utils/asyncHandler';
import { authenticate } from '../../middleware/auth.middleware';
import { OrderService } from './order.service';

const service = new OrderService();

export const createOrder = [
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const { order, gatewayUrl, isOnline } = await service.createOrder(req.user!.id, req.body);

    const payload: Record<string, unknown> = {
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        grandTotal: order.grandTotal,
        status: order.status,
        paymentStatus: order.paymentStatus,
        paymentType: order.paymentType,
        createdAt: order.createdAt,
        items: order.items,
      },
      isOnline,
      // COD auto-approved
      // Online: redirect to gatewayUrl (sandbox checkout when demo mode)
    };

    if (gatewayUrl) payload.gatewayUrl = gatewayUrl;
    return ApiResponse.created(res, payload, 'Order created');
  }),
];

export const listOrders = [
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const orders = await service.listUserOrders(req.user!.id);
    return ApiResponse.success(res, { orders });
  }),
];

export const getOrderDetail = [
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const order = await service.getOrderDetail(req.user!.id, req.params.id);
    return ApiResponse.success(res, { order });
  }),
];

export const cancelOrder = [
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const order = await service.cancelOrder(req.user!.id, req.params.id);
    return ApiResponse.success(res, { order }, 'Order cancelled');
  }),
];