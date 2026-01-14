"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPaymentById = exports.getMyPayments = exports.handleWebhook = exports.verifyPayment = exports.createOrder = void 0;
const services_1 = require("../services");
const errorHandler_1 = require("../middlewares/errorHandler");
exports.createOrder = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    if (!req.user) {
        throw new Error('Unauthenticated');
    }
    const { order, payment } = await services_1.paymentService.createOrder({
        userId: req.user.id,
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
exports.verifyPayment = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const payment = await services_1.paymentService.verifyPayment(req.body);
    res.status(200).json({
        success: true,
        message: 'Payment verified successfully',
        data: payment,
    });
});
exports.handleWebhook = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const signature = req.headers['x-razorpay-signature'];
    const rawBody = req.body; // express.raw middleware sets Buffer
    await services_1.paymentService.handleWebhook(rawBody, signature);
    res.status(200).json({ status: 'ok' });
});
exports.getMyPayments = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { page, limit, sort, order } = req.query;
    const result = await services_1.paymentService.getUserPayments(req.user.id, { page: Number(page) || 1, limit: Number(limit) || 10, sort, order });
    res.status(200).json({
        success: true,
        data: result.payments,
        pagination: result.pagination,
    });
});
exports.getPaymentById = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const payment = await services_1.paymentService.getPaymentById(req.params.id, req.user.id);
    res.status(200).json({
        success: true,
        data: payment,
    });
});
//# sourceMappingURL=payment.controller.js.map