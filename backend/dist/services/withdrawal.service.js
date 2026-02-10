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
// Validate Razorpay credentials for withdrawal payouts
if (!config_1.default.razorpay.keyId || !config_1.default.razorpay.keySecret) {
    logger_1.default.error('Razorpay credentials are not configured. Withdrawal payout functionality will be unavailable.');
}
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
            const createdAt = new Date(pendingWithdrawal.createdAt).toLocaleString('en-IN');
            const withdrawalAmount = (pendingWithdrawal.amount / 100).toFixed(2);
            throw new errors_1.AppError(`You have a ${pendingWithdrawal.status} withdrawal request of ₹${withdrawalAmount} created on ${createdAt}. Please wait for it to complete or contact admin if it's been more than 24 hours.`, 400);
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
        // Withdrawal stays PENDING until admin approves. No automatic payout.
        await notification_service_1.default.createNotification({
            userId,
            type: 'withdrawal_requested',
            title: 'Withdrawal Request Submitted',
            message: `Your withdrawal of ₹${(withdrawal.amount / 100).toFixed(2)} has been submitted. It will be processed after admin approval.`,
            data: { withdrawalId: withdrawal._id },
        });
        logger_1.default.info(`Withdrawal request created: ${withdrawal._id} for user ${userId} (pending admin approval)`);
        return withdrawal;
    }
    /**
     * Admin: Approve a pending withdrawal and credit amount to bank account (via Razorpay or manual).
     */
    async approveWithdrawal(withdrawalId, adminId) {
        const withdrawal = await models_1.Withdrawal.findById(withdrawalId);
        if (!withdrawal) {
            throw new errors_1.AppError('Withdrawal not found', 404);
        }
        if (withdrawal.status !== types_1.WithdrawalStatus.PENDING) {
            throw new errors_1.AppError(`Withdrawal cannot be approved. Current status: ${withdrawal.status}`, 400);
        }
        const user = await models_1.User.findById(withdrawal.userId);
        if (!user) {
            throw new errors_1.AppError('User not found', 404);
        }
        const transferDetails = withdrawal.method === types_1.WithdrawalMethod.BANK_TRANSFER && withdrawal.bankDetails
            ? {
                accountHolderName: withdrawal.bankDetails.accountHolderName,
                accountNumber: withdrawal.bankDetails.accountNumber,
                ifscCode: withdrawal.bankDetails.ifscCode,
                bankName: withdrawal.bankDetails.bankName,
            }
            : withdrawal.upiId
                ? { upiId: withdrawal.upiId }
                : (() => {
                    throw new errors_1.AppError('Missing bank or UPI details for this withdrawal', 400);
                })();
        try {
            await this.processRazorpayPayout(withdrawal, user, transferDetails);
        }
        catch (error) {
            withdrawal.status = types_1.WithdrawalStatus.FAILED;
            withdrawal.failureReason = error.message || 'Payout processing failed';
            await withdrawal.save();
            logger_1.default.error(`Withdrawal approval failed: ${withdrawalId} - ${error.message}`);
            throw new errors_1.AppError(error.message || 'Failed to process payout', 400);
        }
        logger_1.default.info(`Withdrawal ${withdrawalId} approved by admin ${adminId}`);
        return withdrawal;
    }
    /**
     * Admin: Reject a pending withdrawal request.
     */
    async rejectWithdrawal(withdrawalId, adminId, reason) {
        const withdrawal = await models_1.Withdrawal.findById(withdrawalId);
        if (!withdrawal) {
            throw new errors_1.AppError('Withdrawal not found', 404);
        }
        if (withdrawal.status !== types_1.WithdrawalStatus.PENDING) {
            throw new errors_1.AppError(`Withdrawal cannot be rejected. Current status: ${withdrawal.status}`, 400);
        }
        withdrawal.status = types_1.WithdrawalStatus.REJECTED;
        withdrawal.failureReason = reason || 'Rejected by admin';
        await withdrawal.save();
        await notification_service_1.default.createNotification({
            userId: withdrawal.userId.toString(),
            type: 'withdrawal_rejected',
            title: 'Withdrawal Request Rejected',
            message: `Your withdrawal of ₹${(withdrawal.amount / 100).toFixed(2)} was rejected.${reason ? ` Reason: ${reason}` : ''}`,
            data: { withdrawalId: withdrawal._id, reason: withdrawal.failureReason },
        });
        logger_1.default.info(`Withdrawal ${withdrawalId} rejected by admin ${adminId}`);
        return withdrawal;
    }
    /**
     * User: Cancel own pending withdrawal request
     */
    async cancelWithdrawal(withdrawalId, userId) {
        const withdrawal = await models_1.Withdrawal.findById(withdrawalId);
        if (!withdrawal) {
            throw new errors_1.AppError('Withdrawal not found', 404);
        }
        // Verify ownership
        if (withdrawal.userId.toString() !== userId) {
            throw new errors_1.AppError('Unauthorized to cancel this withdrawal', 403);
        }
        // Only allow cancellation of PENDING withdrawals
        if (withdrawal.status !== types_1.WithdrawalStatus.PENDING) {
            throw new errors_1.AppError(`Withdrawal cannot be cancelled. Current status: ${withdrawal.status}`, 400);
        }
        withdrawal.status = types_1.WithdrawalStatus.REJECTED;
        withdrawal.failureReason = 'Cancelled by user';
        await withdrawal.save();
        await notification_service_1.default.createNotification({
            userId: withdrawal.userId.toString(),
            type: 'withdrawal_cancelled',
            title: 'Withdrawal Request Cancelled',
            message: `Your withdrawal of ₹${(withdrawal.amount / 100).toFixed(2)} has been cancelled.`,
            data: { withdrawalId: withdrawal._id },
        });
        logger_1.default.info(`Withdrawal ${withdrawalId} cancelled by user ${userId}`);
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
            // Check if RazorpayX is properly configured
            // For live payouts, you need RazorpayX account with proper credentials
            const hasLiveKey = config_1.default.razorpay.keyId.startsWith('rzp_live');
            const isRazorpayXEnabled = process.env.RAZORPAYX_ACCOUNT_NUMBER ? true : false;
            // Use test mode if:
            // 1. Using test keys (rzp_test_), OR
            // 2. RazorpayX account is not configured
            const isTestMode = !hasLiveKey || !isRazorpayXEnabled;
            if (isTestMode) {
                // TESTING MODE: Simulate successful payout
                logger_1.default.info(`[TEST MODE] Simulating payout for withdrawal: ${withdrawal._id}`);
                logger_1.default.info(`Reason: ${!hasLiveKey ? 'Using test Razorpay keys' : 'RazorpayX account not configured'}`);
                withdrawal.razorpayPayoutId = `test_payout_${Date.now()}`;
                withdrawal.status = types_1.WithdrawalStatus.COMPLETED;
                withdrawal.processedAt = new Date();
                await withdrawal.save();
                // Send success notification
                await notification_service_1.default.createNotification({
                    userId: withdrawal.userId.toString(),
                    type: 'withdrawal_success',
                    title: 'Withdrawal Successful',
                    message: `Your withdrawal of ₹${(withdrawal.amount / 100).toFixed(2)} has been processed. [TEST MODE - No actual transfer made]`,
                    data: { withdrawalId: withdrawal._id },
                });
                logger_1.default.info(`[TEST MODE] Payout simulated for withdrawal: ${withdrawal._id}`);
                return;
            }
            // PRODUCTION MODE: Use RazorpayX APIs
            logger_1.default.info(`[LIVE MODE] Initiating RazorpayX payout for withdrawal: ${withdrawal._id}`);
            // Step 1: Create or get contact
            const contact = await this.createRazorpayContact(user);
            withdrawal.razorpayContactId = contact.id;
            await withdrawal.save();
            logger_1.default.info(`Contact created/fetched: ${contact.id}`);
            // Step 2: Create fund account
            const fundAccount = await this.createRazorpayFundAccount(contact.id, withdrawal.method, transferDetails);
            withdrawal.razorpayFundAccountId = fundAccount.id;
            await withdrawal.save();
            logger_1.default.info(`Fund account created: ${fundAccount.id}`);
            // Step 3: Create payout
            const payout = await this.createRazorpayPayoutRequest(fundAccount.id, withdrawal.amount, `Mockomi withdrawal ${withdrawal._id}`);
            withdrawal.razorpayPayoutId = payout.id;
            withdrawal.status = types_1.WithdrawalStatus.PROCESSING;
            await withdrawal.save();
            logger_1.default.info(`Payout initiated: ${payout.id} for withdrawal: ${withdrawal._id}, Status: ${payout.status}`);
            // Send notification
            await notification_service_1.default.createNotification({
                userId: withdrawal.userId.toString(),
                type: 'withdrawal_processing',
                title: 'Withdrawal Processing',
                message: `Your withdrawal of ₹${(withdrawal.amount / 100).toFixed(2)} is being processed via RazorpayX. Amount will be credited to your account shortly.`,
                data: { withdrawalId: withdrawal._id, payoutId: payout.id },
            });
        }
        catch (error) {
            logger_1.default.error(`Razorpay payout error for withdrawal ${withdrawal._id}:`, {
                error: error.message,
                description: error.error?.description,
                code: error.error?.code,
                field: error.error?.field,
            });
            throw error;
        }
    }
    /**
     * Create a Razorpay contact for the user
     */
    async createRazorpayContact(user) {
        try {
            logger_1.default.info(`Creating Razorpay contact for user: ${user._id}`);
            const contact = await razorpay.contacts.create({
                name: `${user.firstName} ${user.lastName}`.trim(),
                email: user.email,
                contact: user.phone || '',
                type: 'employee',
                reference_id: user._id.toString(),
                notes: {
                    userId: user._id.toString(),
                },
            });
            logger_1.default.info(`Contact created successfully: ${contact.id}`);
            return contact;
        }
        catch (error) {
            // If contact already exists, try to fetch it
            if (error.error?.description?.includes('already exists') ||
                error.error?.description?.includes('duplicate')) {
                logger_1.default.info(`Contact already exists for user ${user._id}, fetching existing contact`);
                try {
                    const contacts = await razorpay.contacts.all({
                        reference_id: user._id.toString(),
                    });
                    if (contacts.items && contacts.items.length > 0) {
                        logger_1.default.info(`Found existing contact: ${contacts.items[0].id}`);
                        return contacts.items[0];
                    }
                }
                catch (fetchError) {
                    logger_1.default.error('Failed to fetch existing contact:', fetchError.message);
                }
            }
            logger_1.default.error('Failed to create Razorpay contact:', {
                error: error.message,
                description: error.error?.description,
            });
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
                logger_1.default.info(`Creating bank fund account for contact ${contactId}: ${bankData.bankName} - ${bankData.ifscCode}`);
            }
            else if (method === types_1.WithdrawalMethod.UPI) {
                const upiData = transferDetails;
                fundAccountData.account_type = 'vpa';
                fundAccountData.vpa = {
                    address: upiData.upiId,
                };
                logger_1.default.info(`Creating UPI fund account for contact ${contactId}: ${upiData.upiId}`);
            }
            const fundAccount = await razorpay.fundAccount.create(fundAccountData);
            logger_1.default.info(`Fund account created successfully: ${fundAccount.id}`);
            return fundAccount;
        }
        catch (error) {
            logger_1.default.error('Failed to create fund account:', {
                error: error.message,
                description: error.error?.description,
                code: error.error?.code,
                field: error.error?.field,
            });
            // Provide user-friendly error messages
            const errorMsg = error.error?.description || error.message;
            if (errorMsg?.includes('ifsc')) {
                throw new errors_1.AppError('Invalid IFSC code. Please check your bank details.', 400);
            }
            else if (errorMsg?.includes('account_number')) {
                throw new errors_1.AppError('Invalid account number. Please check your bank details.', 400);
            }
            else if (errorMsg?.includes('vpa') || errorMsg?.includes('upi')) {
                throw new errors_1.AppError('Invalid UPI ID. Please check your UPI details.', 400);
            }
            throw new errors_1.AppError(errorMsg || 'Failed to create fund account', 400);
        }
    }
    /**
     * Create a Razorpay payout request
     */
    async createRazorpayPayoutRequest(fundAccountId, amount, narration) {
        try {
            // Get RazorpayX account number from environment
            const accountNumber = process.env.RAZORPAYX_ACCOUNT_NUMBER;
            if (!accountNumber) {
                throw new errors_1.AppError('RazorpayX account number not configured. Please set RAZORPAYX_ACCOUNT_NUMBER in environment variables.', 500);
            }
            logger_1.default.info(`Creating payout: Amount=${amount / 100}, FundAccount=${fundAccountId}`);
            const payoutData = {
                account_number: accountNumber, // Your RazorpayX account number (not the key_id)
                fund_account_id: fundAccountId,
                amount: amount, // in paise
                currency: 'INR',
                mode: 'IMPS', // IMPS for instant transfer, NEFT/RTGS for others
                purpose: 'payout',
                queue_if_low_balance: false,
                reference_id: `mockomi_${Date.now()}`,
                narration: narration.substring(0, 30), // Max 30 chars
            };
            const payout = await razorpay.payouts.create(payoutData);
            logger_1.default.info(`Payout created successfully: ${payout.id}, Status: ${payout.status}`);
            return payout;
        }
        catch (error) {
            logger_1.default.error('Failed to create Razorpay payout:', {
                error: error.message,
                description: error.error?.description,
                code: error.error?.code,
                field: error.error?.field,
                source: error.error?.source,
            });
            // Provide user-friendly error messages
            const errorMsg = error.error?.description || error.message || 'Failed to create payout';
            if (errorMsg.includes('account_number')) {
                throw new errors_1.AppError('Invalid RazorpayX account configuration. Please contact support.', 500);
            }
            else if (errorMsg.includes('insufficient')) {
                throw new errors_1.AppError('Insufficient balance in payout account. Please try again later.', 503);
            }
            else if (errorMsg.includes('fund_account')) {
                throw new errors_1.AppError('Invalid bank account details. Please update your bank information.', 400);
            }
            throw new errors_1.AppError(errorMsg, 400);
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
                    'interview.status': types_1.InterviewStatus.COMPLETED,
                    'interview.feedback': { $exists: true },
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