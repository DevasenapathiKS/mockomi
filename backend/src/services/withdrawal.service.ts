import Razorpay from 'razorpay';
import crypto from 'crypto';
import mongoose from 'mongoose';
import { Withdrawal, InterviewerProfile, User, Payment, Interview } from '../models';
import { IWithdrawalDocument } from '../models/Withdrawal';
import { WithdrawalStatus, WithdrawalMethod, PaginationQuery, PaginationInfo, PaymentStatus } from '../types';
import { AppError } from '../utils/errors';
import config from '../config';
import logger from '../utils/logger';
import notificationService from './notification.service';

const razorpay = new Razorpay({
  key_id: config.razorpay.keyId,
  key_secret: config.razorpay.keySecret,
});

// Minimum withdrawal amount in paise (₹1 for testing, can be changed later)
const MIN_WITHDRAWAL_AMOUNT = 100; // ₹1 in paise
const MAX_WITHDRAWAL_AMOUNT = 10000000; // ₹1,00,000 in paise

interface CreateWithdrawalData {
  userId: string;
  amount: number; // in paise
  method: WithdrawalMethod;
}

interface BankTransferData {
  accountHolderName: string;
  accountNumber: string;
  ifscCode: string;
  bankName: string;
}

interface UpiTransferData {
  upiId: string;
}

class WithdrawalService {
  /**
   * Create a withdrawal request and process payout via Razorpay
   */
  async createWithdrawal(
    data: CreateWithdrawalData,
    transferDetails: BankTransferData | UpiTransferData
  ): Promise<IWithdrawalDocument> {
    const { userId, amount, method } = data;

    // Validate amount
    if (amount < MIN_WITHDRAWAL_AMOUNT) {
      throw new AppError(`Minimum withdrawal amount is ₹${MIN_WITHDRAWAL_AMOUNT / 100}`, 400);
    }

    if (amount > MAX_WITHDRAWAL_AMOUNT) {
      throw new AppError(`Maximum withdrawal amount is ₹${MAX_WITHDRAWAL_AMOUNT / 100}`, 400);
    }

    // Get user and interviewer profile
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    const profile = await InterviewerProfile.findOne({ userId });
    if (!profile) {
      throw new AppError('Interviewer profile not found', 404);
    }

    // Check available balance from actual earnings
    const stats = await this.getWithdrawalStats(userId);
    const availableBalancePaise = stats.availableBalance * 100; // Convert to paise
    if (amount > availableBalancePaise) {
      throw new AppError(
        `Insufficient balance. Available: ₹${stats.availableBalance.toFixed(2)}`,
        400
      );
    }

    // Check for pending withdrawals
    const pendingWithdrawal = await Withdrawal.findOne({
      userId,
      status: { $in: [WithdrawalStatus.PENDING, WithdrawalStatus.PROCESSING] },
    });

    if (pendingWithdrawal) {
      throw new AppError('You have a pending withdrawal request. Please wait for it to complete.', 400);
    }

    // Create withdrawal record
    const withdrawalData: any = {
      userId,
      amount,
      currency: 'INR',
      method,
      status: WithdrawalStatus.PENDING,
    };

    if (method === WithdrawalMethod.BANK_TRANSFER) {
      const bankData = transferDetails as BankTransferData;
      withdrawalData.bankDetails = {
        accountHolderName: bankData.accountHolderName,
        accountNumber: bankData.accountNumber,
        ifscCode: bankData.ifscCode.toUpperCase(),
        bankName: bankData.bankName,
      };
    } else if (method === WithdrawalMethod.UPI) {
      const upiData = transferDetails as UpiTransferData;
      withdrawalData.upiId = upiData.upiId;
    }

    const withdrawal = await Withdrawal.create(withdrawalData);

    try {
      // Process payout via Razorpay
      await this.processRazorpayPayout(withdrawal, user, transferDetails);
    } catch (error: any) {
      // Update withdrawal status to failed
      withdrawal.status = WithdrawalStatus.FAILED;
      withdrawal.failureReason = error.message || 'Payout processing failed';
      await withdrawal.save();

      logger.error(`Withdrawal failed for user ${userId}: ${error.message}`);
      throw new AppError(error.message || 'Failed to process withdrawal', 400);
    }

    return withdrawal;
  }

  /**
   * Process payout via Razorpay
   * NOTE: RazorpayX Payouts API requires a separate business account.
   * For testing, we simulate the payout by marking it as completed.
   * In production, integrate with RazorpayX APIs properly.
   */
  private async processRazorpayPayout(
    withdrawal: IWithdrawalDocument,
    user: any,
    transferDetails: BankTransferData | UpiTransferData
  ): Promise<void> {
    try {
      // Check if we're in test/development mode or RazorpayX is not configured
      const isTestMode = config.env !== 'production' || !config.razorpay.keyId.startsWith('rzp_live');

      if (isTestMode) {
        // TESTING MODE: Simulate successful payout
        logger.info(`[TEST MODE] Simulating payout for withdrawal: ${withdrawal._id}`);
        
        withdrawal.razorpayPayoutId = `test_payout_${Date.now()}`;
        withdrawal.status = WithdrawalStatus.COMPLETED;
        withdrawal.processedAt = new Date();
        await withdrawal.save();

        // Send success notification
        await notificationService.createNotification({
          userId: withdrawal.userId.toString(),
          type: 'withdrawal_success',
          title: 'Withdrawal Successful',
          message: `Your withdrawal of ₹${(withdrawal.amount / 100).toFixed(2)} has been processed. [TEST MODE]`,
          data: { withdrawalId: withdrawal._id },
        });

        logger.info(`[TEST MODE] Payout simulated for withdrawal: ${withdrawal._id}`);
        return;
      }

      // PRODUCTION MODE: Use RazorpayX APIs
      // Step 1: Create or get contact
      const contact = await this.createRazorpayContact(user);
      withdrawal.razorpayContactId = contact.id;

      // Step 2: Create fund account
      const fundAccount = await this.createRazorpayFundAccount(
        contact.id,
        withdrawal.method,
        transferDetails
      );
      withdrawal.razorpayFundAccountId = fundAccount.id;

      // Step 3: Create payout
      const payout = await this.createRazorpayPayoutRequest(
        fundAccount.id,
        withdrawal.amount,
        `Withdrawal ${withdrawal._id}`
      );

      withdrawal.razorpayPayoutId = payout.id;
      withdrawal.status = WithdrawalStatus.PROCESSING;
      await withdrawal.save();

      logger.info(`Payout initiated: ${payout.id} for withdrawal: ${withdrawal._id}`);

      // Send notification
      await notificationService.createNotification({
        userId: withdrawal.userId.toString(),
        type: 'withdrawal_processing',
        title: 'Withdrawal Processing',
        message: `Your withdrawal of ₹${(withdrawal.amount / 100).toFixed(2)} is being processed.`,
        data: { withdrawalId: withdrawal._id },
      });
    } catch (error: any) {
      logger.error(`Razorpay payout error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Create a Razorpay contact for the user
   */
  private async createRazorpayContact(user: any): Promise<any> {
    try {
      const contact = await (razorpay as any).contacts.create({
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
    } catch (error: any) {
      // If contact already exists, try to fetch it
      if (error.error?.description?.includes('already exists')) {
        const contacts = await (razorpay as any).contacts.all({
          reference_id: user._id.toString(),
        });
        if (contacts.items && contacts.items.length > 0) {
          return contacts.items[0];
        }
      }
      throw new AppError(
        error.error?.description || error.message || 'Failed to create Razorpay contact',
        400
      );
    }
  }

  /**
   * Create a Razorpay fund account
   */
  private async createRazorpayFundAccount(
    contactId: string,
    method: WithdrawalMethod,
    transferDetails: BankTransferData | UpiTransferData
  ): Promise<any> {
    try {
      let fundAccountData: any = {
        contact_id: contactId,
      };

      if (method === WithdrawalMethod.BANK_TRANSFER) {
        const bankData = transferDetails as BankTransferData;
        fundAccountData.account_type = 'bank_account';
        fundAccountData.bank_account = {
          name: bankData.accountHolderName,
          ifsc: bankData.ifscCode.toUpperCase(),
          account_number: bankData.accountNumber,
        };
      } else if (method === WithdrawalMethod.UPI) {
        const upiData = transferDetails as UpiTransferData;
        fundAccountData.account_type = 'vpa';
        fundAccountData.vpa = {
          address: upiData.upiId,
        };
      }

      const fundAccount = await (razorpay as any).fundAccount.create(fundAccountData);
      return fundAccount;
    } catch (error: any) {
      throw new AppError(
        error.error?.description || error.message || 'Failed to create fund account',
        400
      );
    }
  }

  /**
   * Create a Razorpay payout request
   */
  private async createRazorpayPayoutRequest(
    fundAccountId: string,
    amount: number,
    narration: string
  ): Promise<any> {
    try {
      const payout = await (razorpay as any).payouts.create({
        account_number: config.razorpay.keyId, // Your RazorpayX account number
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
    } catch (error: any) {
      throw new AppError(
        error.error?.description || error.message || 'Failed to create payout',
        400
      );
    }
  }

  /**
   * Handle Razorpay payout webhook
   */
  async handlePayoutWebhook(rawBody: Buffer | string, signature: string): Promise<void> {
    const bodyString = Buffer.isBuffer(rawBody) ? rawBody.toString('utf8') : String(rawBody);

    // Verify webhook signature
    const expectedSignature = crypto
      .createHmac('sha256', config.razorpay.webhookSecret)
      .update(bodyString)
      .digest('hex');

    if (expectedSignature !== signature) {
      throw new AppError('Invalid webhook signature', 400);
    }

    const payload = JSON.parse(bodyString);
    const event = payload.event;
    const payoutEntity = payload.payload.payout?.entity;

    if (!payoutEntity) return;

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
        logger.debug(`Unhandled payout webhook event: ${event}`);
    }
  }

  private async handlePayoutProcessed(payoutEntity: any): Promise<void> {
    const withdrawal = await Withdrawal.findOne({
      razorpayPayoutId: payoutEntity.id,
    });

    if (withdrawal && withdrawal.status !== WithdrawalStatus.COMPLETED) {
      withdrawal.status = WithdrawalStatus.COMPLETED;
      withdrawal.processedAt = new Date();
      await withdrawal.save();

      await notificationService.createNotification({
        userId: withdrawal.userId.toString(),
        type: 'withdrawal_success',
        title: 'Withdrawal Successful',
        message: `Your withdrawal of ₹${(withdrawal.amount / 100).toFixed(2)} has been credited to your account.`,
        data: { withdrawalId: withdrawal._id },
      });

      logger.info(`Payout processed: ${payoutEntity.id}`);
    }
  }

  private async handlePayoutFailed(payoutEntity: any): Promise<void> {
    const withdrawal = await Withdrawal.findOne({
      razorpayPayoutId: payoutEntity.id,
    });

    if (withdrawal && withdrawal.status !== WithdrawalStatus.FAILED) {
      withdrawal.status = WithdrawalStatus.FAILED;
      withdrawal.failureReason = payoutEntity.failure_reason || 'Payout failed';
      await withdrawal.save();

      await notificationService.createNotification({
        userId: withdrawal.userId.toString(),
        type: 'withdrawal_failed',
        title: 'Withdrawal Failed',
        message: `Your withdrawal of ₹${(withdrawal.amount / 100).toFixed(2)} failed. Amount is available in your balance.`,
        data: { withdrawalId: withdrawal._id, reason: withdrawal.failureReason },
      });

      logger.info(`Payout failed: ${payoutEntity.id}`);
    }
  }

  private async handlePayoutReversed(payoutEntity: any): Promise<void> {
    const withdrawal = await Withdrawal.findOne({
      razorpayPayoutId: payoutEntity.id,
    });

    if (withdrawal && withdrawal.status !== WithdrawalStatus.REVERSED) {
      withdrawal.status = WithdrawalStatus.REVERSED;
      withdrawal.failureReason = 'Payout was reversed';
      await withdrawal.save();

      await notificationService.createNotification({
        userId: withdrawal.userId.toString(),
        type: 'withdrawal_reversed',
        title: 'Withdrawal Reversed',
        message: `Your withdrawal of ₹${(withdrawal.amount / 100).toFixed(2)} was reversed. Amount is available in your balance.`,
        data: { withdrawalId: withdrawal._id },
      });

      logger.info(`Payout reversed: ${payoutEntity.id}`);
    }
  }

  /**
   * Get user's withdrawal history
   */
  async getUserWithdrawals(
    userId: string,
    pagination: PaginationQuery = {}
  ): Promise<{ withdrawals: IWithdrawalDocument[]; pagination: PaginationInfo }> {
    const { page = 1, limit = 10, sort = 'createdAt', order = 'desc' } = pagination;

    const total = await Withdrawal.countDocuments({ userId });
    const totalPages = Math.ceil(total / limit);

    const withdrawals = await Withdrawal.find({ userId })
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
  async getWithdrawalById(withdrawalId: string, userId: string): Promise<IWithdrawalDocument> {
    const withdrawal = await Withdrawal.findById(withdrawalId);
    if (!withdrawal) {
      throw new AppError('Withdrawal not found', 404);
    }

    if (withdrawal.userId.toString() !== userId) {
      throw new AppError('Access denied', 403);
    }

    return withdrawal;
  }

  /**
   * Get withdrawal stats for a user
   */
  async getWithdrawalStats(userId: string): Promise<{
    totalWithdrawn: number;
    pendingAmount: number;
    availableBalance: number;
    totalEarnings: number;
  }> {
    const userObjectId = new mongoose.Types.ObjectId(userId);

    // Calculate total earnings from completed payments for this interviewer's interviews
    const earningsResult = await Payment.aggregate([
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
          status: PaymentStatus.COMPLETED,
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
    const withdrawalStats = await Withdrawal.aggregate([
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
      if (stat._id === WithdrawalStatus.COMPLETED) {
        totalWithdrawn = stat.total / 100;
      } else if (
        stat._id === WithdrawalStatus.PENDING ||
        stat._id === WithdrawalStatus.PROCESSING
      ) {
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
  async getAllWithdrawals(
    status?: WithdrawalStatus,
    pagination: PaginationQuery = {}
  ): Promise<{ withdrawals: IWithdrawalDocument[]; pagination: PaginationInfo }> {
    const { page = 1, limit = 10, sort = 'createdAt', order = 'desc' } = pagination;

    const query: any = {};
    if (status) {
      query.status = status;
    }

    const total = await Withdrawal.countDocuments(query);
    const totalPages = Math.ceil(total / limit);

    const withdrawals = await Withdrawal.find(query)
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

export default new WithdrawalService();

