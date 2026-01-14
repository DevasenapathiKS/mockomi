import { Response } from 'express';
import { paymentService } from '../services';
import { AuthRequest, PaymentStatus } from '../types';
import { asyncHandler } from '../middlewares/errorHandler';

export const createOrder = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw new Error('Unauthenticated');
  }

  const { order, payment } = await paymentService.createOrder({
    userId: req.user!.id,
    interviewId: req.body.interviewId,
    amount: req.body.amount,
    notes: req.body.notes,
  });

  res.status(201).json({
    success: true,
    data: {
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      paymentId: payment._id,
    },
  });
});

export const verifyPayment = asyncHandler(async (req: AuthRequest, res: Response) => {
  const payment = await paymentService.verifyPayment(req.body);

  res.status(200).json({
    success: true,
    message: 'Payment verified successfully',
    data: payment,
  });
});

export const handleWebhook = asyncHandler(async (req: AuthRequest, res: Response) => {
  const signature = req.headers['x-razorpay-signature'] as string;
  const rawBody = req.body as any; // express.raw middleware sets Buffer
  await paymentService.handleWebhook(rawBody, signature);

  res.status(200).json({ status: 'ok' });
});

export const getMyPayments = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { page, limit, sort, order } = req.query as any;

  const result = await paymentService.getUserPayments(
    req.user!.id,
    { page: Number(page) || 1, limit: Number(limit) || 10, sort, order }
  );

  res.status(200).json({
    success: true,
    data: result.payments,
    pagination: result.pagination,
  });
});

export const getPaymentById = asyncHandler(async (req: AuthRequest, res: Response) => {
  const payment = await paymentService.getPaymentById(req.params.id, req.user!.id);

  res.status(200).json({
    success: true,
    data: payment,
  });
});
