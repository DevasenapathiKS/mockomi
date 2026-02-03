"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rejectWithdrawal = exports.approveWithdrawal = exports.getAllWithdrawals = exports.handlePayoutWebhook = exports.getWithdrawalStats = exports.getWithdrawalById = exports.getMyWithdrawals = exports.createWithdrawal = void 0;
const services_1 = require("../services");
const types_1 = require("../types");
const errorHandler_1 = require("../middlewares/errorHandler");
/**
 * Create a withdrawal request
 */
exports.createWithdrawal = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { amount, method, bankDetails, upiId } = req.body;
    let transferDetails;
    if (method === types_1.WithdrawalMethod.BANK_TRANSFER) {
        if (!bankDetails) {
            return res.status(400).json({
                success: false,
                message: 'Bank details are required for bank transfer',
            });
        }
        transferDetails = bankDetails;
    }
    else if (method === types_1.WithdrawalMethod.UPI) {
        if (!upiId) {
            return res.status(400).json({
                success: false,
                message: 'UPI ID is required for UPI transfer',
            });
        }
        transferDetails = { upiId };
    }
    const withdrawal = await services_1.withdrawalService.createWithdrawal({
        userId: req.user.id,
        amount,
        method,
    }, transferDetails);
    res.status(201).json({
        success: true,
        message: 'Withdrawal request created successfully',
        data: withdrawal,
    });
});
/**
 * Get user's withdrawal history
 */
exports.getMyWithdrawals = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { page, limit } = req.query;
    const { withdrawals, pagination } = await services_1.withdrawalService.getUserWithdrawals(req.user.id, {
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
    });
    res.status(200).json({
        success: true,
        data: withdrawals,
        pagination,
    });
});
/**
 * Get withdrawal by ID
 */
exports.getWithdrawalById = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const withdrawal = await services_1.withdrawalService.getWithdrawalById(req.params.id, req.user.id);
    res.status(200).json({
        success: true,
        data: withdrawal,
    });
});
/**
 * Get withdrawal stats
 */
exports.getWithdrawalStats = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const stats = await services_1.withdrawalService.getWithdrawalStats(req.user.id);
    res.status(200).json({
        success: true,
        data: stats,
    });
});
/**
 * Handle Razorpay payout webhook
 */
exports.handlePayoutWebhook = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const signature = req.headers['x-razorpay-signature'];
    if (!signature) {
        return res.status(400).json({
            success: false,
            message: 'Missing webhook signature',
        });
    }
    // Get raw body for signature verification
    const rawBody = req.rawBody || JSON.stringify(req.body);
    await services_1.withdrawalService.handlePayoutWebhook(rawBody, signature);
    res.status(200).json({ received: true });
});
/**
 * Admin: Get all withdrawals
 */
exports.getAllWithdrawals = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { status, page, limit } = req.query;
    const { withdrawals, pagination } = await services_1.withdrawalService.getAllWithdrawals(status, {
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
    });
    res.status(200).json({
        success: true,
        data: withdrawals,
        pagination,
    });
});
/**
 * Admin: Approve a pending withdrawal (credits amount to bank account).
 */
exports.approveWithdrawal = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const withdrawal = await services_1.withdrawalService.approveWithdrawal(req.params.id, req.user.id);
    res.status(200).json({
        success: true,
        message: 'Withdrawal approved. Amount will be credited to the bank account.',
        data: withdrawal,
    });
});
/**
 * Admin: Reject a pending withdrawal request.
 */
exports.rejectWithdrawal = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { reason } = req.body || {};
    const withdrawal = await services_1.withdrawalService.rejectWithdrawal(req.params.id, req.user.id, reason);
    res.status(200).json({
        success: true,
        message: 'Withdrawal request rejected.',
        data: withdrawal,
    });
});
//# sourceMappingURL=withdrawal.controller.js.map