"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const razorpay_1 = __importDefault(require("razorpay"));
const crypto_1 = __importDefault(require("crypto"));
const models_1 = require("../models");
const types_1 = require("../types");
const errors_1 = require("../utils/errors");
const config_1 = __importDefault(require("../config"));
const logger_1 = __importDefault(require("../utils/logger"));
const notification_service_1 = __importDefault(require("./notification.service"));
const coupon_service_1 = __importDefault(require("./coupon.service"));
const razorpay = new razorpay_1.default({
    key_id: config_1.default.razorpay.keyId,
    key_secret: config_1.default.razorpay.keySecret,
});
class PaymentService {
    async createOrder(data) {
        const { userId, interviewId, amount, notes } = data;
        // Calculate discounted amount if coupon is provided
        // Always use base price for interview requests and calculate discount server-side
        const basePricePaise = config_1.default.interview.pricePaise; // Base price in paise (₹100 = 10000 paise)
        let finalAmount = basePricePaise; // Default to base price
        // Type guard for notes object
        const notesObj = notes;
        // Check if this is an interview request
        const isInterviewRequest = notesObj && notesObj.reason === 'mock_interview_request';
        if (isInterviewRequest && notesObj && notesObj.couponCode) {
            const couponCode = notesObj.couponCode;
            // Validate coupon server-side (security: never trust frontend)
            const validation = await coupon_service_1.default.validateCoupon(couponCode, userId);
            if (!validation.valid) {
                throw new errors_1.AppError(validation.message || 'Invalid or expired coupon', 400);
            }
            // Get coupon details
            const coupon = validation.coupon;
            if (coupon) {
                // Calculate discount based on coupon type (always from base price)
                if (coupon.discountType === 'percentage') {
                    // Percentage discount: reduce by percentage
                    finalAmount = Math.round(basePricePaise * (1 - coupon.discountValue / 100));
                }
                else {
                    // Flat discount: subtract flat amount (coupon.discountValue is in rupees)
                    finalAmount = Math.round(basePricePaise - (coupon.discountValue * 100));
                }
                // Ensure minimum amount is ₹1 (10000 paise) for Razorpay
                finalAmount = Math.max(10000, finalAmount);
                logger_1.default.info(`Coupon ${couponCode} applied for user ${userId}. Original: ₹${basePricePaise / 100}, Discounted: ₹${finalAmount / 100}`);
            }
        }
        else if (!isInterviewRequest) {
            // For non-interview payments, use the provided amount
            finalAmount = amount;
        }
        // Create Razorpay order
        const receipt = `receipt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        let razorpayOrder;
        try {
            razorpayOrder = await razorpay.orders.create({
                amount: finalAmount, // Use calculated discounted amount
                currency: 'INR',
                receipt,
                notes: {
                    userId,
                    interviewId: interviewId || '',
                    ...notes,
                },
            });
        }
        catch (err) {
            const message = err?.error?.description ||
                err?.message ||
                'Failed to create payment order with Razorpay';
            logger_1.default.error(`Razorpay order creation failed: ${message}`);
            throw new errors_1.AppError(message, 400);
        }
        // Create payment record with the final calculated amount
        const payment = await models_1.Payment.create({
            userId,
            interviewId,
            orderId: receipt,
            amount: finalAmount, // Store the calculated amount (which includes discount if any)
            currency: 'INR',
            status: types_1.PaymentStatus.PENDING,
            razorpayOrderId: razorpayOrder.id,
            receipt,
            notes,
        });
        logger_1.default.info(`Payment order created: ${razorpayOrder.id} for user: ${userId}`);
        return {
            order: razorpayOrder,
            payment,
        };
    }
    async verifyPayment(data) {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = data;
        // Verify signature
        const body = razorpay_order_id + '|' + razorpay_payment_id;
        const expectedSignature = crypto_1.default
            .createHmac('sha256', config_1.default.razorpay.keySecret)
            .update(body.toString())
            .digest('hex');
        if (expectedSignature !== razorpay_signature) {
            throw new errors_1.AppError('Invalid payment signature', 400);
        }
        // Check idempotency - prevent duplicate processing
        const idempotencyKey = `${razorpay_order_id}-${razorpay_payment_id}`;
        const existingPayment = await models_1.Payment.findOne({
            $or: [
                { razorpayPaymentId: razorpay_payment_id },
                { idempotencyKey }
            ]
        });
        if (existingPayment && existingPayment.status === types_1.PaymentStatus.COMPLETED) {
            logger_1.default.warn(`Duplicate payment webhook ignored: ${razorpay_payment_id}`);
            return existingPayment; // Return existing, don't process again
        }
        // Find and update payment
        const payment = await models_1.Payment.findOne({ razorpayOrderId: razorpay_order_id });
        if (!payment) {
            throw new errors_1.AppError('Payment not found', 404);
        }
        payment.razorpayPaymentId = razorpay_payment_id;
        payment.razorpaySignature = razorpay_signature;
        payment.idempotencyKey = idempotencyKey;
        payment.status = types_1.PaymentStatus.COMPLETED;
        await payment.save();
        // If payment is for an interview, update interview status
        if (payment.interviewId) {
            await models_1.Interview.findByIdAndUpdate(payment.interviewId, {
                isPaid: true,
                payment: payment._id,
            });
        }
        // Send notification
        await notification_service_1.default.createNotification({
            userId: payment.userId.toString(),
            type: 'payment_success',
            title: 'Payment Successful',
            message: `Your payment of ₹${(payment.amount / 100).toFixed(2)} was successful.`,
            data: { paymentId: payment._id },
        });
        logger_1.default.info(`Payment verified: ${razorpay_payment_id}`);
        return payment;
    }
    async handleWebhook(rawBody, signature) {
        const bodyString = Buffer.isBuffer(rawBody) ? rawBody.toString('utf8') : String(rawBody);
        // Verify webhook signature using raw body
        const expectedSignature = crypto_1.default
            .createHmac('sha256', config_1.default.razorpay.webhookSecret)
            .update(bodyString)
            .digest('hex');
        if (expectedSignature !== signature) {
            throw new errors_1.AppError('Invalid webhook signature', 400);
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
                logger_1.default.debug(`Unhandled webhook event: ${event}`);
        }
    }
    async handlePaymentCaptured(paymentEntity) {
        // Check idempotency
        const idempotencyKey = `${paymentEntity.order_id}-${paymentEntity.id}`;
        const existingPayment = await models_1.Payment.findOne({
            $or: [
                { razorpayPaymentId: paymentEntity.id },
                { idempotencyKey }
            ]
        });
        if (existingPayment && existingPayment.status === types_1.PaymentStatus.COMPLETED) {
            logger_1.default.warn(`Duplicate payment webhook ignored: ${paymentEntity.id}`);
            return; // Already processed
        }
        const payment = await models_1.Payment.findOne({
            razorpayOrderId: paymentEntity.order_id,
        });
        if (payment && payment.status !== types_1.PaymentStatus.COMPLETED) {
            payment.razorpayPaymentId = paymentEntity.id;
            payment.idempotencyKey = idempotencyKey;
            payment.status = types_1.PaymentStatus.COMPLETED;
            await payment.save();
            if (payment.interviewId) {
                await models_1.Interview.findByIdAndUpdate(payment.interviewId, {
                    isPaid: true,
                    payment: payment._id,
                });
            }
            logger_1.default.info(`Payment captured via webhook: ${paymentEntity.id}`);
        }
    }
    async handlePaymentFailed(paymentEntity) {
        const payment = await models_1.Payment.findOne({
            razorpayOrderId: paymentEntity.order_id,
        });
        if (payment) {
            payment.razorpayPaymentId = paymentEntity.id;
            payment.status = types_1.PaymentStatus.FAILED;
            await payment.save();
            await notification_service_1.default.createNotification({
                userId: payment.userId.toString(),
                type: 'payment_failed',
                title: 'Payment Failed',
                message: 'Your payment could not be processed. Please try again.',
                data: { paymentId: payment._id },
            });
            logger_1.default.info(`Payment failed via webhook: ${paymentEntity.id}`);
        }
    }
    async handleRefundCreated(refundEntity) {
        const payment = await models_1.Payment.findOne({
            razorpayPaymentId: refundEntity.payment_id,
        });
        if (payment) {
            payment.status = types_1.PaymentStatus.REFUNDED;
            await payment.save();
            await notification_service_1.default.createNotification({
                userId: payment.userId.toString(),
                type: 'payment_success',
                title: 'Refund Processed',
                message: `Your refund of ₹${(refundEntity.amount / 100).toFixed(2)} has been processed.`,
                data: { paymentId: payment._id },
            });
            logger_1.default.info(`Refund processed via webhook: ${refundEntity.id}`);
        }
    }
    async initiateRefund(paymentId, adminId) {
        const payment = await models_1.Payment.findById(paymentId);
        if (!payment) {
            throw new errors_1.AppError('Payment not found', 404);
        }
        if (payment.status !== types_1.PaymentStatus.COMPLETED) {
            throw new errors_1.AppError('Payment cannot be refunded', 400);
        }
        if (!payment.razorpayPaymentId) {
            throw new errors_1.AppError('No Razorpay payment ID found', 400);
        }
        const refund = await razorpay.payments.refund(payment.razorpayPaymentId, {
            amount: payment.amount,
            notes: {
                reason: 'Admin initiated refund',
                adminId,
            },
        });
        payment.status = types_1.PaymentStatus.REFUNDED;
        await payment.save();
        logger_1.default.info(`Refund initiated: ${refund.id} by admin: ${adminId}`);
        return refund;
    }
    async getPaymentById(paymentId, userId) {
        const payment = await models_1.Payment.findById(paymentId);
        if (!payment) {
            throw new errors_1.AppError('Payment not found', 404);
        }
        if (payment.userId.toString() !== userId) {
            throw new errors_1.AppError('Access denied', 403);
        }
        return payment;
    }
    async getUserPayments(userId, pagination = {}) {
        const { page = 1, limit = 10, sort = 'createdAt', order = 'desc' } = pagination;
        const total = await models_1.Payment.countDocuments({ userId });
        const totalPages = Math.ceil(total / limit);
        const payments = await models_1.Payment.find({ userId })
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
    async getAllPayments(status, pagination = {}) {
        const { page = 1, limit = 10, sort = 'createdAt', order = 'desc' } = pagination;
        const query = {};
        if (status) {
            query.status = status;
        }
        const total = await models_1.Payment.countDocuments(query);
        const totalPages = Math.ceil(total / limit);
        const payments = await models_1.Payment.find(query)
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
    async getPaymentStats() {
        const stats = await models_1.Payment.aggregate([
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
            if (stat._id === types_1.PaymentStatus.COMPLETED) {
                result.successfulPayments = stat.count;
                result.totalRevenue = stat.total / 100; // Convert from paise to rupees
            }
            else if (stat._id === types_1.PaymentStatus.FAILED) {
                result.failedPayments = stat.count;
            }
            else if (stat._id === types_1.PaymentStatus.REFUNDED) {
                result.refundedPayments = stat.count;
            }
        });
        return result;
    }
}
exports.default = new PaymentService();
//# sourceMappingURL=payment.service.js.map