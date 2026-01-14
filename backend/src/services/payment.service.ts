import Razorpay from 'razorpay';
import crypto from 'crypto';
import { Payment, Interview, JobSeekerProfile } from '../models';
import { IPaymentDocument } from '../models/Payment';
import { PaymentStatus, InterviewStatus, PaginationQuery, PaginationInfo } from '../types';
import { AppError } from '../utils/errors';
import config from '../config';
import logger from '../utils/logger';
import notificationService from './notification.service';

const razorpay = new Razorpay({
  key_id: config.razorpay.keyId,
  key_secret: config.razorpay.keySecret,
});

interface CreateOrderData {
  userId: string;
  interviewId?: string;
  amount: number;
  notes?: object;
}

interface VerifyPaymentData {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

class PaymentService {
  async createOrder(data: CreateOrderData): Promise<{
    order: any;
    payment: IPaymentDocument;
  }> {
    const { userId, interviewId, amount, notes } = data;

    // Create Razorpay order
    const receipt = `receipt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    let razorpayOrder: any;
    try {
      razorpayOrder = await razorpay.orders.create({
        amount: amount, // amount in paise
        currency: 'INR',
        receipt,
        notes: {
          userId,
          interviewId: interviewId || '',
          ...notes,
        },
      });
    } catch (err: any) {
      const message =
        err?.error?.description ||
        err?.message ||
        'Failed to create payment order with Razorpay';
      logger.error(`Razorpay order creation failed: ${message}`);
      throw new AppError(message, 400);
    }

    // Create payment record
    const payment = await Payment.create({
      userId,
      interviewId,
      orderId: receipt,
      amount,
      currency: 'INR',
      status: PaymentStatus.PENDING,
      razorpayOrderId: razorpayOrder.id,
      receipt,
      notes,
    });

    logger.info(`Payment order created: ${razorpayOrder.id} for user: ${userId}`);

    return {
      order: razorpayOrder,
      payment,
    };
  }

  async verifyPayment(data: VerifyPaymentData): Promise<IPaymentDocument> {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = data;

    // Verify signature
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', config.razorpay.keySecret)
      .update(body.toString())
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      throw new AppError('Invalid payment signature', 400);
    }

    // Find and update payment
    const payment = await Payment.findOne({ razorpayOrderId: razorpay_order_id });
    if (!payment) {
      throw new AppError('Payment not found', 404);
    }

    payment.razorpayPaymentId = razorpay_payment_id;
    payment.razorpaySignature = razorpay_signature;
    payment.status = PaymentStatus.COMPLETED;
    await payment.save();

    // If payment is for an interview, update interview status
    if (payment.interviewId) {
      await Interview.findByIdAndUpdate(payment.interviewId, {
        isPaid: true,
        payment: payment._id,
      });
    }

    // Send notification
    await notificationService.createNotification({
      userId: payment.userId.toString(),
      type: 'payment_success',
      title: 'Payment Successful',
      message: `Your payment of ₹${(payment.amount / 100).toFixed(2)} was successful.`,
      data: { paymentId: payment._id },
    });

    logger.info(`Payment verified: ${razorpay_payment_id}`);

    return payment;
  }

  async handleWebhook(rawBody: Buffer | string, signature: string): Promise<void> {
    const bodyString = Buffer.isBuffer(rawBody) ? rawBody.toString('utf8') : String(rawBody);

    // Verify webhook signature using raw body
    const expectedSignature = crypto
      .createHmac('sha256', config.razorpay.webhookSecret)
      .update(bodyString)
      .digest('hex');

    if (expectedSignature !== signature) {
      throw new AppError('Invalid webhook signature', 400);
    }

    const payload = JSON.parse(bodyString);
    const event = payload.event;
    const paymentEntity = payload.payload.payment?.entity;

    switch (event) {
      case 'payment.captured':
        await this.handlePaymentCaptured(paymentEntity);
        break;

      case 'payment.failed':
        await this.handlePaymentFailed(paymentEntity);
        break;

      case 'refund.created':
        await this.handleRefundCreated(payload.payload.refund?.entity);
        break;

      default:
        logger.debug(`Unhandled webhook event: ${event}`);
    }
  }

  private async handlePaymentCaptured(paymentEntity: any): Promise<void> {
    const payment = await Payment.findOne({
      razorpayOrderId: paymentEntity.order_id,
    });

    if (payment && payment.status !== PaymentStatus.COMPLETED) {
      payment.razorpayPaymentId = paymentEntity.id;
      payment.status = PaymentStatus.COMPLETED;
      await payment.save();

      if (payment.interviewId) {
        await Interview.findByIdAndUpdate(payment.interviewId, {
          isPaid: true,
          payment: payment._id,
        });
      }

      logger.info(`Payment captured via webhook: ${paymentEntity.id}`);
    }
  }

  private async handlePaymentFailed(paymentEntity: any): Promise<void> {
    const payment = await Payment.findOne({
      razorpayOrderId: paymentEntity.order_id,
    });

    if (payment) {
      payment.razorpayPaymentId = paymentEntity.id;
      payment.status = PaymentStatus.FAILED;
      await payment.save();

      await notificationService.createNotification({
        userId: payment.userId.toString(),
        type: 'payment_failed',
        title: 'Payment Failed',
        message: 'Your payment could not be processed. Please try again.',
        data: { paymentId: payment._id },
      });

      logger.info(`Payment failed via webhook: ${paymentEntity.id}`);
    }
  }

  private async handleRefundCreated(refundEntity: any): Promise<void> {
    const payment = await Payment.findOne({
      razorpayPaymentId: refundEntity.payment_id,
    });

    if (payment) {
      payment.status = PaymentStatus.REFUNDED;
      await payment.save();

      await notificationService.createNotification({
        userId: payment.userId.toString(),
        type: 'payment_success',
        title: 'Refund Processed',
        message: `Your refund of ₹${(refundEntity.amount / 100).toFixed(2)} has been processed.`,
        data: { paymentId: payment._id },
      });

      logger.info(`Refund processed via webhook: ${refundEntity.id}`);
    }
  }

  async initiateRefund(paymentId: string, adminId: string): Promise<any> {
    const payment = await Payment.findById(paymentId);
    if (!payment) {
      throw new AppError('Payment not found', 404);
    }

    if (payment.status !== PaymentStatus.COMPLETED) {
      throw new AppError('Payment cannot be refunded', 400);
    }

    if (!payment.razorpayPaymentId) {
      throw new AppError('No Razorpay payment ID found', 400);
    }

    const refund = await razorpay.payments.refund(payment.razorpayPaymentId, {
      amount: payment.amount,
      notes: {
        reason: 'Admin initiated refund',
        adminId,
      },
    });

    payment.status = PaymentStatus.REFUNDED;
    await payment.save();

    logger.info(`Refund initiated: ${refund.id} by admin: ${adminId}`);

    return refund;
  }

  async getPaymentById(paymentId: string, userId: string): Promise<IPaymentDocument> {
    const payment = await Payment.findById(paymentId);
    if (!payment) {
      throw new AppError('Payment not found', 404);
    }

    if (payment.userId.toString() !== userId) {
      throw new AppError('Access denied', 403);
    }

    return payment;
  }

  async getUserPayments(
    userId: string,
    pagination: PaginationQuery = {}
  ): Promise<{ payments: IPaymentDocument[]; pagination: PaginationInfo }> {
    const { page = 1, limit = 10, sort = 'createdAt', order = 'desc' } = pagination;

    const total = await Payment.countDocuments({ userId });
    const totalPages = Math.ceil(total / limit);

    const payments = await Payment.find({ userId })
      .populate('interviewId', 'scheduledAt topic')
      .sort({ [sort]: order === 'asc' ? 1 : -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    return {
      payments,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }

  async getAllPayments(
    status?: PaymentStatus,
    pagination: PaginationQuery = {}
  ): Promise<{ payments: IPaymentDocument[]; pagination: PaginationInfo }> {
    const { page = 1, limit = 10, sort = 'createdAt', order = 'desc' } = pagination;

    const query: any = {};
    if (status) {
      query.status = status;
    }

    const total = await Payment.countDocuments(query);
    const totalPages = Math.ceil(total / limit);

    const payments = await Payment.find(query)
      .populate('userId', 'firstName lastName email')
      .populate('interviewId', 'scheduledAt topic')
      .sort({ [sort]: order === 'asc' ? 1 : -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    return {
      payments,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }

  async getPaymentStats(): Promise<{
    totalRevenue: number;
    totalTransactions: number;
    successfulPayments: number;
    failedPayments: number;
    refundedPayments: number;
  }> {
    const stats = await Payment.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          total: { $sum: '$amount' },
        },
      },
    ]);

    const result = {
      totalRevenue: 0,
      totalTransactions: 0,
      successfulPayments: 0,
      failedPayments: 0,
      refundedPayments: 0,
    };

    stats.forEach((stat) => {
      result.totalTransactions += stat.count;
      if (stat._id === PaymentStatus.COMPLETED) {
        result.successfulPayments = stat.count;
        result.totalRevenue = stat.total / 100; // Convert from paise to rupees
      } else if (stat._id === PaymentStatus.FAILED) {
        result.failedPayments = stat.count;
      } else if (stat._id === PaymentStatus.REFUNDED) {
        result.refundedPayments = stat.count;
      }
    });

    return result;
  }
}

export default new PaymentService();
