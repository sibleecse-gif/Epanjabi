import { Request, Response } from 'express';
import { ApiResponse } from '../../utils/apiResponse';
import { asyncHandler } from '../../utils/asyncHandler';
import { PaymentService } from './payment.service';
import { prisma } from '../../config/database';
import { env } from '../../config/env';

const service = new PaymentService();

export const initiatePayment = asyncHandler(async (req: Request, res: Response) => {
  const order = await prisma.order.findUnique({
    where: { id: req.body.orderId },
    include: { user: true },
  });
  if (!order) return ApiResponse.error(res, 'Order not found', 404);
  if (order.userId !== req.user!.id) return ApiResponse.error(res, 'Forbidden', 403);
  const gatewayUrl = await service.initiate(
    order,
    order.user ? { name: order.user.name, email: order.user.email, phone: order.user.phone } : undefined
  );
  return ApiResponse.success(res, { gatewayUrl });
});

export const sandboxNotify = asyncHandler(async (req: Request, res: Response) => {
  const { orderId, status } = req.params;
  const event = `sandbox:${status}`;
  if (status === 'success') {
    await service.handleApproved(orderId, `SANDBOX-${Date.now()}`, { event });
  } else if (status === 'fail' || status === 'cancel') {
    await service.handleFailed(orderId, { event });
  } else {
    return ApiResponse.error(res, 'Unknown status', 400);
  }
  return ApiResponse.success(res, null, 'Payment state updated');
});

export const paymentSuccess = asyncHandler(async (req: Request, res: Response) => {
  const orderId = (req.body.order_id ?? req.body.tran_id ?? '').toString().replace('AGD-', '');
  if (!orderId) return ApiResponse.error(res, 'Missing order reference', 400);
  const ref = req.body.val_id ?? req.body.tran_id;
  // Sandbox mode: trust the callback. Live mode: verify with gateway explore API before this.
  await service.handleApproved(orderId, ref?.toString(), req.body);
  return res.redirect(`${env.CLIENT_URL}/orders?payment=success`);
});

export const paymentFail = asyncHandler(async (req: Request, res: Response) => {
  const orderId = (req.body.order_id ?? req.body.tran_id ?? '').toString().replace('AGD-', '');
  if (!orderId) return ApiResponse.error(res, 'Missing order reference', 400);
  await service.handleFailed(orderId, req.body);
  return res.redirect(`${env.CLIENT_URL}/orders?payment=failed`);
});

export const paymentCancel = asyncHandler(async (req: Request, res: Response) => {
  const orderId = (req.body.order_id ?? req.body.tran_id ?? '').toString().replace('AGD-', '');
  if (!orderId) return ApiResponse.error(res, 'Missing order reference', 400);
  await service.handleFailed(orderId, req.body);
  return res.redirect(`${env.CLIENT_URL}/orders?payment=cancelled`);
});

export const paymentIpn = asyncHandler(async (req: Request, res: Response) => {
  const status = (req.body.status ?? '').toString();
  const orderId = (req.body.tran_id?.toString() ?? '').replace('AGD-', '');
  if (!orderId) return ApiResponse.error(res, 'Missing tran_id', 400);

  if (status === 'VALID' || status === 'VALIDATED') {
    const ref = req.body.val_id ?? req.body.tran_id;
    await service.handleApproved(orderId, ref?.toString(), req.body);
  } else {
    await service.handleFailed(orderId, req.body);
  }
  return ApiResponse.success(res, null, 'IPN processed');
});

export const createBkashPayment = asyncHandler(async (req: Request, res: Response) => {
  const order = await prisma.order.findUnique({ where: { id: req.body.orderId } });
  if (!order) return ApiResponse.error(res, 'Order not found', 404);
  if (order.userId !== req.user!.id) return ApiResponse.error(res, 'Forbidden', 403);
  const result = await service.createBkashSession(req.body.orderId);
  return ApiResponse.success(res, { ...result });
});

export const executeBkashPayment = asyncHandler(async (req: Request, res: Response) => {
  const order = await prisma.order.findUnique({ where: { id: req.body.orderId } });
  if (!order) return ApiResponse.error(res, 'Order not found', 404);
  if (order.userId !== req.user!.id) return ApiResponse.error(res, 'Forbidden', 403);
  const result = await service.executeBkashSession(req.body.paymentID, req.body.orderId);
  return ApiResponse.success(res, { ...result });
});