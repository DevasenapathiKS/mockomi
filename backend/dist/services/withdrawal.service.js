"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const razorpay_1 = __importDefault(require("razorpay"));
const crypto_1 = __importDefault(require("crypto"));
const mongoose_1 = __importDefault(require("mongoose"));
const models_1 = require("../models");
const types_1 = require("../types");
const errors_1 = require("../utils/errors");
const config_1 = __importDefault(require("../config"));
const logger_1 = __importDefault(require("../utils/logger"));
const notification_service_1 = __importDefault(require("./notification.service"));
const razorpay = new razorpay_1.default({
    key_id: config_1.default.razorpay.keyId,
    key_secret: config_1.default.razorpay.keySecret,
});
// Minimum withdrawal amount in paise (₹1 for testing, can be changed later)
const MIN_WITHDRAWAL_AMOUNT = 100; // ₹1 in paise
const MAX_WITHDRAWAL_AMOUNT = 10000000; // ₹1,00,000 in paise
class WithdrawalService {
    /**
     * Create a withdrawal request and process payout via Razorpay
     */
    async createWithdrawal(data, transferDetails) {
        const { userId, amount, method } = data;
        // Validate amount
        if (amount < MIN_WITHDRAWAL_AMOUNT) {
            throw new errors_1.AppError(`Minimum withdrawal amount is ₹${MIN_WITHDRAWAL_AMOUNT / 100}`, 400);
        }
        if (amount > MAX_WITHDRAWAL_AMOUNT) {
            throw new errors_1.AppError(`Maximum withdrawal amount is ₹${MAX_WITHDRAWAL_AMOUNT / 100}`, 400);
        }
        // Get user and interviewer profile
        const user = await models_1.User.findById(userId);
        if (!user) {
            throw new errors_1.AppError('User not found', 404);
        }
        const profile = await models_1.InterviewerProfile.findOne({ userId });
        if (!profile) {
            throw new errors_1.AppError('Interviewer profile not found', 404);
        }
        // Check available balance from actual earnings
        const stats = await this.getWithdrawalStats(userId);
        const availableBalancePaise = stats.availableBalance * 100; // Convert to paise
        if (amount > availableBalancePaise) {
            throw new errors_1.AppError(`Insufficient balance. Available: ₹${stats.availableBalance.toFixed(2)}`, 400);
        }
        // Check for pending withdrawals
        const pendingWithdrawal = await models_1.Withdrawal.findOne({
            userId,
            status: { $in: [types_1.WithdrawalStatus.PENDING, types_1.WithdrawalStatus.PROCESSING] },
        });
        if (pendingWithdrawal) {
            throw new errors_1.AppError('You have a pending withdrawal request. Please wait for it to complete.', 400);
        }
        // Create withdrawal record
        const withdrawalData = {
            userId,
            amount,
            currency: 'INR',
            method,
            status: types_1.WithdrawalStatus.PENDING,
        };
        if (method === types_1.WithdrawalMethod.BANK_TRANSFER) {
            const bankData = transferDetails;
            withdrawalData.bankDetails = {
                accountHolderName: bankData.accountHolderName,
                accountNumber: bankData.accountNumber,
                ifscCode: bankData.ifscCode.toUpperCase(),
                bankName: bankData.bankName,
            };
        }
        else if (method === types_1.WithdrawalMethod.UPI) {
            const upiData = transferDetails;
            withdrawalData.upiId = upiData.upiId;
        }
        const withdrawal = await models_1.Withdrawal.create(withdrawalData);
        try {
            // Process payout via Razorpay
            await this.processRazorpayPayout(withdrawal, user, transferDetails);
        }
        catch (error) {
            // Update withdrawal status to failed
            withdrawal.status = types_1.WithdrawalStatus.FAILED;
            withdrawal.failureReason = error.message || 'Payout processing failed';
            await withdrawal.save();
            logger_1.default.error(`Withdrawal failed for user ${userId}: ${error.message}`);
            throw new errors_1.AppError(error.message || 'Failed to process withdrawal', 400);
        }
        return withdrawal;
    }
    /**
     * Process payout via Razorpay
     * NOTE: RazorpayX Payouts API requires a separate business account.
     * For testing, we simulate the payout by marking it as completed.
     * In production, integrate with RazorpayX APIs properly.
     */
    async processRazorpayPayout(withdrawal, user, transferDetails) {
        try {
            // Check if we're in test/development mode or RazorpayX is not configured
            const isTestMode = config_1.default.env !== 'production' || !config_1.default.razorpay.keyId.startsWith('rzp_live');
            if (isTestMode) {
                // TESTING MODE: Simulate successful payout
                logger_1.default.info(`[TEST MODE] Simulating payout for withdrawal: ${withdrawal._id}`);
                withdrawal.razorpayPayoutId = `test_payout_${Date.now()}`;
                withdrawal.status = types_1.WithdrawalStatus.COMPLETED;
                withdrawal.processedAt = new Date();
                await withdrawal.save();
                // Send success notification
                await notification_service_1.default.createNotification({
                    userId: withdrawal.userId.toString(),
                    type: 'withdrawal_success',
                    title: 'Withdrawal Successful',
                    message: `Your withdrawal of ₹${(withdrawal.amount / 100).toFixed(2)} has been processed. [TEST MODE]`,
                    data: { withdrawalId: withdrawal._id },
                });
                logger_1.default.info(`[TEST MODE] Payout simulated for withdrawal: ${withdrawal._id}`);
                return;
            }
            // PRODUCTION MODE: Use RazorpayX APIs
            // Step 1: Create or get contact
            const contact = await this.createRazorpayContact(user);
            withdrawal.razorpayContactId = contact.id;
            // Step 2: Create fund account
            const fundAccount = await this.createRazorpayFundAccount(contact.id, withdrawal.method, transferDetails);
            withdrawal.razorpayFundAccountId = fundAccount.id;
            // Step 3: Create payout
            const payout = await this.createRazorpayPayoutRequest(fundAccount.id, withdrawal.amount, `Withdrawal ${withdrawal._id}`);
            withdrawal.razorpayPayoutId = payout.id;
            withdrawal.status = types_1.WithdrawalStatus.PROCESSING;
            await withdrawal.save();
            logger_1.default.info(`Payout initiated: ${payout.id} for withdrawal: ${withdrawal._id}`);
            // Send notification
            await notification_service_1.default.createNotification({
                userId: withdrawal.userId.toString(),
                type: 'withdrawal_processing',
                title: 'Withdrawal Processing',
                message: `Your withdrawal of ₹${(withdrawal.amount / 100).toFixed(2)} is being processed.`,
                data: { withdrawalId: withdrawal._id },
            });
        }
        catch (error) {
            logger_1.default.error(`Razorpay payout error: ${error.message}`);
            throw error;
        }
    }
    /**
     * Create a Razorpay contact for the user
     */
    async createRazorpayContact(user) {
        try {
            const contact = await razorpay.contacts.create({
                name: `${user.firstName} ${user.lastName}`,
                email: user.email,
                contact: user.phone || '',
                type: 'employee',
                reference_id: user._id.toString(),
                notes: {
                    userId: user._id.toString(),
                },
            });
            return contact;
        }
        catch (error) {
            // If contact already exists, try to fetch it
            if (error.error?.description?.includes('already exists')) {
                const contacts = await razorpay.contacts.all({
                    reference_id: user._id.toString(),
                });
                if (contacts.items && contacts.items.length > 0) {
                    return contacts.items[0];
                }
            }
            throw new errors_1.AppError(error.error?.description || error.message || 'Failed to create Razorpay contact', 400);
        }
    }
    /**
     * Create a Razorpay fund account
     */
    async createRazorpayFundAccount(contactId, method, transferDetails) {
        try {
            let fundAccountData = {
                contact_id: contactId,
            };
            if (method === types_1.WithdrawalMethod.BANK_TRANSFER) {
                const bankData = transferDetails;
                fundAccountData.account_type = 'bank_account';
                fundAccountData.bank_account = {
                    name: bankData.accountHolderName,
                    ifsc: bankData.ifscCode.toUpperCase(),
                    account_number: bankData.accountNumber,
                };
            }
            else if (method === types_1.WithdrawalMethod.UPI) {
                const upiData = transferDetails;
                fundAccountData.account_type = 'vpa';
                fundAccountData.vpa = {
                    address: upiData.upiId,
                };
            }
            const fundAccount = await razorpay.fundAccount.create(fundAccountData);
            return fundAccount;
        }
        catch (error) {
            throw new errors_1.AppError(error.error?.description || error.message || 'Failed to create fund account', 400);
        }
    }
    /**
     * Create a Razorpay payout request
     */
    async createRazorpayPayoutRequest(fundAccountId, amount, narration) {
        try {
            const payout = await razorpay.payouts.create({
                account_number: config_1.default.razorpay.keyId, // Your RazorpayX account number
                fund_account_id: fundAccountId,
                amount: amount, // in paise
                currency: 'INR',
                mode: 'IMPS', // IMPS for instant transfer, NEFT/RTGS for others
                purpose: 'payout',
                queue_if_low_balance: false,
                reference_id: `payout_${Date.now()}`,
                narration: narration.substring(0, 30), // Max 30 chars
            });
            return payout;
        }
        catch (error) {
            throw new errors_1.AppError(error.error?.description || error.message || 'Failed to create payout', 400);
        }
    }
    /**
     * Handle Razorpay payout webhook
     */
    async handlePayoutWebhook(rawBody, signature) {
        const bodyString = Buffer.isBuffer(rawBody) ? rawBody.toString('utf8') : String(rawBody);
        // Verify webhook signature
        const expectedSignature = crypto_1.default
            .createHmac('sha256', config_1.default.razorpay.webhookSecret)
            .update(bodyString)
            .digest('hex');
        if (expectedSignature !== signature) {
            throw new errors_1.AppError('Invalid webhook signature', 400);
        }
        const payload = JSON.parse(bodyString);
        const event = payload.event;
        const payoutEntity = payload.payload.payout?.entity;
        if (!payoutEntity)
            return;
        switch (event) {
            case 'payout.processed':
                await this.handlePayoutProcessed(payoutEntity);
                break;
            case 'payout.failed':
            case 'payout.rejected':
                await this.handlePayoutFailed(payoutEntity);
                break;
            case 'payout.reversed':
                await this.handlePayoutReversed(payoutEntity);
                break;
            default:
                logger_1.default.debug(`Unhandled payout webhook event: ${event}`);
        }
    }
    async handlePayoutProcessed(payoutEntity) {
        const withdrawal = await models_1.Withdrawal.findOne({
            razorpayPayoutId: payoutEntity.id,
        });
        if (withdrawal && withdrawal.status !== types_1.WithdrawalStatus.COMPLETED) {
            withdrawal.status = types_1.WithdrawalStatus.COMPLETED;
            withdrawal.processedAt = new Date();
            await withdrawal.save();
            await notification_service_1.default.createNotification({
                userId: withdrawal.userId.toString(),
                type: 'withdrawal_success',
                title: 'Withdrawal Successful',
                message: `Your withdrawal of ₹${(withdrawal.amount / 100).toFixed(2)} has been credited to your account.`,
                data: { withdrawalId: withdrawal._id },
            });
            logger_1.default.info(`Payout processed: ${payoutEntity.id}`);
        }
    }
    async handlePayoutFailed(payoutEntity) {
        const withdrawal = await models_1.Withdrawal.findOne({
            razorpayPayoutId: payoutEntity.id,
        });
        if (withdrawal && withdrawal.status !== types_1.WithdrawalStatus.FAILED) {
            withdrawal.status = types_1.WithdrawalStatus.FAILED;
            withdrawal.failureReason = payoutEntity.failure_reason || 'Payout failed';
            await withdrawal.save();
            await notification_service_1.default.createNotification({
                userId: withdrawal.userId.toString(),
                type: 'withdrawal_failed',
                title: 'Withdrawal Failed',
                message: `Your withdrawal of ₹${(withdrawal.amount / 100).toFixed(2)} failed. Amount is available in your balance.`,
                data: { withdrawalId: withdrawal._id, reason: withdrawal.failureReason },
            });
            logger_1.default.info(`Payout failed: ${payoutEntity.id}`);
        }
    }
    async handlePayoutReversed(payoutEntity) {
        const withdrawal = await models_1.Withdrawal.findOne({
            razorpayPayoutId: payoutEntity.id,
        });
        if (withdrawal && withdrawal.status !== types_1.WithdrawalStatus.REVERSED) {
            withdrawal.status = types_1.WithdrawalStatus.REVERSED;
            withdrawal.failureReason = 'Payout was reversed';
            await withdrawal.save();
            await notification_service_1.default.createNotification({
                userId: withdrawal.userId.toString(),
                type: 'withdrawal_reversed',
                title: 'Withdrawal Reversed',
                message: `Your withdrawal of ₹${(withdrawal.amount / 100).toFixed(2)} was reversed. Amount is available in your balance.`,
                data: { withdrawalId: withdrawal._id },
            });
            logger_1.default.info(`Payout reversed: ${payoutEntity.id}`);
        }
    }
    /**
     * Get user's withdrawal history
     */
    async getUserWithdrawals(userId, pagination = {}) {
        const { page = 1, limit = 10, sort = 'createdAt', order = 'desc' } = pagination;
        const total = await models_1.Withdrawal.countDocuments({ userId });
        const totalPages = Math.ceil(total / limit);
        const withdrawals = await models_1.Withdrawal.find({ userId })
            .sort({ [sort]: order === 'asc' ? 1 : -1 })
            .skip((page - 1) * limit)
            .limit(limit);
        return {
            withdrawals,
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
    /**
     * Get withdrawal by ID
     */
    async getWithdrawalById(withdrawalId, userId) {
        const withdrawal = await models_1.Withdrawal.findById(withdrawalId);
        if (!withdrawal) {
            throw new errors_1.AppError('Withdrawal not found', 404);
        }
        if (withdrawal.userId.toString() !== userId) {
            throw new errors_1.AppError('Access denied', 403);
        }
        return withdrawal;
    }
    /**
     * Get withdrawal stats for a user
     */
    async getWithdrawalStats(userId) {
        const userObjectId = new mongoose_1.default.Types.ObjectId(userId);
        // Calculate total earnings from completed payments for this interviewer's interviews
        const earningsResult = await models_1.Payment.aggregate([
            {
                $lookup: {
                    from: 'interviews',
                    localField: 'interviewId',
                    foreignField: '_id',
                    as: 'interview',
                },
            },
            { $unwind: '$interview' },
            {
                $match: {
                    'interview.interviewerId': userObjectId,
                    status: types_1.PaymentStatus.COMPLETED,
                },
            },
            {
                $group: {
                    _id: null,
                    totalEarnings: { $sum: '$amount' },
                },
            },
        ]);
        const totalEarnings = earningsResult.length > 0 ? earningsResult[0].totalEarnings / 100 : 0;
        // Calculate withdrawal stats
        const withdrawalStats = await models_1.Withdrawal.aggregate([
            { $match: { userId: userObjectId } },
            {
                $group: {
                    _id: '$status',
                    total: { $sum: '$amount' },
                },
            },
        ]);
        let totalWithdrawn = 0;
        let pendingWithdrawal = 0;
        withdrawalStats.forEach((stat) => {
            if (stat._id === types_1.WithdrawalStatus.COMPLETED) {
                totalWithdrawn = stat.total / 100;
            }
            else if (stat._id === types_1.WithdrawalStatus.PENDING ||
                stat._id === types_1.WithdrawalStatus.PROCESSING) {
                pendingWithdrawal = stat.total / 100;
            }
        });
        // Available balance = Total Earnings - Total Withdrawn - Pending Withdrawals
        const availableBalance = totalEarnings - totalWithdrawn - pendingWithdrawal;
        return {
            totalWithdrawn,
            pendingAmount: pendingWithdrawal,
            availableBalance: Math.max(0, availableBalance), // Ensure non-negative
            totalEarnings,
        };
    }
    /**
     * Admin: Get all withdrawals
     */
    async getAllWithdrawals(status, pagination = {}) {
        const { page = 1, limit = 10, sort = 'createdAt', order = 'desc' } = pagination;
        const query = {};
        if (status) {
            query.status = status;
        }
        const total = await models_1.Withdrawal.countDocuments(query);
        const totalPages = Math.ceil(total / limit);
        const withdrawals = await models_1.Withdrawal.find(query)
            .populate('userId', 'firstName lastName email')
            .sort({ [sort]: order === 'asc' ? 1 : -1 })
            .skip((page - 1) * limit)
            .limit(limit);
        return {
            withdrawals,
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
}
exports.default = new WithdrawalService();
//# sourceMappingURL=withdrawal.service.js.map