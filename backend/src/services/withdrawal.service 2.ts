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

// Validate Razorpay credentials for withdrawal payouts
if (!config.razorpay.keyId || !config.razorpay.keySecret) {
  logger.error('Razorpay credentials are not configured. Withdrawal payout functionality will be unavailable.');
}

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
      const createdAt = new Date(pendingWithdrawal.createdAt).toLocaleString('en-IN');
      const withdrawalAmount = (pendingWithdrawal.amount / 100).toFixed(2);
      throw new AppError(
        `You have a ${pendingWithdrawal.status} withdrawal request of ₹${withdrawalAmount} created on ${createdAt}. Please wait for it to complete or contact admin if it's been more than 24 hours.`,
        400
      );
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

    // Withdrawal stays PENDING until admin approves. No automatic payout.
    await notificationService.createNotification({
      userId,
      type: 'withdrawal_requested',
      title: 'Withdrawal Request Submitted',
      message: `Your withdrawal of ₹${(withdrawal.amount / 100).toFixed(2)} has been submitted. It will be processed after admin approval.`,
      data: { withdrawalId: withdrawal._id },
    });

    logger.info(`Withdrawal request created: ${withdrawal._id} for user ${userId} (pending admin approval)`);
    return withdrawal;
  }

  /**
   * Admin: Approve a pending withdrawal and credit amount to bank account (via Razorpay or manual).
   */
  async approveWithdrawal(withdrawalId: string, adminId: string): Promise<IWithdrawalDocument> {
    const withdrawal = await Withdrawal.findById(withdrawalId);
    if (!withdrawal) {
      throw new AppError('Withdrawal not found', 404);
    }
    if (withdrawal.status !== WithdrawalStatus.PENDING) {
      throw new AppError(
        `Withdrawal cannot be approved. Current status: ${withdrawal.status}`,
        400
      );
    }

    const user = await User.findById(withdrawal.userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    const transferDetails: BankTransferData | UpiTransferData =
      withdrawal.method === WithdrawalMethod.BANK_TRANSFER && withdrawal.bankDetails
        ? {
            accountHolderName: withdrawal.bankDetails.accountHolderName,
            accountNumber: withdrawal.bankDetails.accountNumber,
            ifscCode: withdrawal.bankDetails.ifscCode,
            bankName: withdrawal.bankDetails.bankName,
          }
        : withdrawal.upiId
          ? { upiId: withdrawal.upiId }
          : (() => {
              throw new AppError('Missing bank or UPI details for this withdrawal', 400);
            })();

    try {
      await this.processRazorpayPayout(withdrawal, user, transferDetails);
    } catch (error: any) {
      withdrawal.status = WithdrawalStatus.FAILED;
      withdrawal.failureReason = error.message || 'Payout processing failed';
      await withdrawal.save();
      logger.error(`Withdrawal approval failed: ${withdrawalId} - ${error.message}`);
      throw new AppError(error.message || 'Failed to process payout', 400);
    }

    logger.info(`Withdrawal ${withdrawalId} approved by admin ${adminId}`);
    return withdrawal;
  }

  /**
   * Admin: Reject a pending withdrawal request.
   */
  async rejectWithdrawal(
    withdrawalId: string,
    adminId: string,
    reason?: string
  ): Promise<IWithdrawalDocument> {
    const withdrawal = await Withdrawal.findById(withdrawalId);
    if (!withdrawal) {
      throw new AppError('Withdrawal not found', 404);
    }
    if (withdrawal.status !== WithdrawalStatus.PENDING) {
      throw new AppError(
        `Withdrawal cannot be rejected. Current status: ${withdrawal.status}`,
        400
      );
    }

    withdrawal.status = WithdrawalStatus.REJECTED;
    withdrawal.failureReason = reason || 'Rejected by admin';
    await withdrawal.save();

    await notificationService.createNotification({
      userId: withdrawal.userId.toString(),
      type: 'withdrawal_rejected',
      title: 'Withdrawal Request Rejected',
      message: `Your withdrawal of ₹${(withdrawal.amount / 100).toFixed(2)} was rejected.${reason ? ` Reason: ${reason}` : ''}`,
      data: { withdrawalId: withdrawal._id, reason: withdrawal.failureReason },
    });

    logger.info(`Withdrawal ${withdrawalId} rejected by admin ${adminId}`);
    return withdrawal;
  }

  /**
   * User: Cancel own pending withdrawal request
   */
  async cancelWithdrawal(
    withdrawalId: string,
    userId: string
  ): Promise<IWithdrawalDocument> {
    const withdrawal = await Withdrawal.findById(withdrawalId);
    if (!withdrawal) {
      throw new AppError('Withdrawal not found', 404);
    }

    // Verify ownership
    if (withdrawal.userId.toString() !== userId) {
      throw new AppError('Unauthorized to cancel this withdrawal', 403);
    }

    // Only allow cancellation of PENDING withdrawals
    if (withdrawal.status !== WithdrawalStatus.PENDING) {
      throw new AppError(
        `Withdrawal cannot be cancelled. Current status: ${withdrawal.status}`,
        400
      );
    }

    withdrawal.status = WithdrawalStatus.REJECTED;
    withdrawal.failureReason = 'Cancelled by user';
    await withdrawal.save();

    await notificationService.createNotification({
      userId: withdrawal.userId.toString(),
      type: 'withdrawal_cancelled',
      title: 'Withdrawal Request Cancelled',
      message: `Your withdrawal of ₹${(withdrawal.amount / 100).toFixed(2)} has been cancelled.`,
      data: { withdrawalId: withdrawal._id },
    });

    logger.info(`Withdrawal ${withdrawalId} cancelled by user ${userId}`);
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
      // Check if RazorpayX is properly configured
      // For live payouts, you need RazorpayX account with proper credentials
      const hasLiveKey = config.razorpay.keyId.startsWith('rzp_live');
      const isRazorpayXEnabled = process.env.RAZORPAYX_ACCOUNT_NUMBER ? true : false;
      
      // Use test mode if:
      // 1. Using test keys (rzp_test_), OR
      // 2. RazorpayX account is not configured
      const isTestMode = !hasLiveKey || !isRazorpayXEnabled;

      if (isTestMode) {
        // TESTING MODE: Simulate successful payout
        logger.info(`[TEST MODE] Simulating payout for withdrawal: ${withdrawal._id}`);
        logger.info(`Reason: ${!hasLiveKey ? 'Using test Razorpay keys' : 'RazorpayX account not configured'}`);
        
        withdrawal.razorpayPayoutId = `test_payout_${Date.now()}`;
        withdrawal.status = WithdrawalStatus.COMPLETED;
        withdrawal.processedAt = new Date();
        await withdrawal.save();

        // Send success notification
        await notificationService.createNotification({
          userId: withdrawal.userId.toString(),
          type: 'withdrawal_success',
          title: 'Withdrawal Successful',
          message: `Your withdrawal of ₹${(withdrawal.amount / 100).toFixed(2)} has been processed. [TEST MODE - No actual transfer made]`,
          data: { withdrawalId: withdrawal._id },
        });

        logger.info(`[TEST MODE] Payout simulated for withdrawal: ${withdrawal._id}`);
        return;
      }

      // PRODUCTION MODE: Use RazorpayX APIs
      logger.info(`[LIVE MODE] Initiating RazorpayX payout for withdrawal: ${withdrawal._id}`);
      
      // Step 1: Create or get contact
      const contact = await this.createRazorpayContact(user);
      withdrawal.razorpayContactId = contact.id;
      await withdrawal.save();
      logger.info(`Contact created/fetched: ${contact.id}`);

      // Step 2: Create fund account
      const fundAccount = await this.createRazorpayFundAccount(
        contact.id,
        withdrawal.method,
        transferDetails
      );
      withdrawal.razorpayFundAccountId = fundAccount.id;
      await withdrawal.save();
      logger.info(`Fund account created: ${fundAccount.id}`);

      // Step 3: Create payout
      const payout = await this.createRazorpayPayoutRequest(
        fundAccount.id,
        withdrawal.amount,
        `Mockomi withdrawal ${withdrawal._id}`
      );

      withdrawal.razorpayPayoutId = payout.id;
      withdrawal.status = WithdrawalStatus.PROCESSING;
      await withdrawal.save();

      logger.info(`Payout initiated: ${payout.id} for withdrawal: ${withdrawal._id}, Status: ${payout.status}`);

      // Send notification
      await notificationService.createNotification({
        userId: withdrawal.userId.toString(),
        type: 'withdrawal_processing',
        title: 'Withdrawal Processing',
        message: `Your withdrawal of ₹${(withdrawal.amount / 100).toFixed(2)} is being processed via RazorpayX. Amount will be credited to your account shortly.`,
        data: { withdrawalId: withdrawal._id, payoutId: payout.id },
      });
    } catch (error: any) {
      logger.error(`Razorpay payout error for withdrawal ${withdrawal._id}:`, {
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
  private async createRazorpayContact(user: any): Promise<any> {
    try {
      logger.info(`Creating Razorpay contact for user: ${user._id}`);
      
      const contact = await (razorpay as any).contacts.create({
        name: `${user.firstName} ${user.lastName}`.trim(),
        email: user.email,
        contact: user.phone || '',
        type: 'employee',
        reference_id: user._id.toString(),
        notes: {
          userId: user._id.toString(),
        },
      });
      
      logger.info(`Contact created successfully: ${contact.id}`);
      return contact;
    } catch (error: any) {
      // If contact already exists, try to fetch it
      if (error.error?.description?.includes('already exists') || 
          error.error?.description?.includes('duplicate')) {
        logger.info(`Contact already exists for user ${user._id}, fetching existing contact`);
        
        try {
          const contacts = await (razorpay as any).contacts.all({
            reference_id: user._id.toString(),
          });
          
          if (contacts.items && contacts.items.length > 0) {
            logger.info(`Found existing contact: ${contacts.items[0].id}`);
            return contacts.items[0];
          }
        } catch (fetchError: any) {
          logger.error('Failed to fetch existing contact:', fetchError.message);
        }
      }
      
      logger.error('Failed to create Razorpay contact:', {
        error: error.message,
        description: error.error?.description,
      });
      
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
        
        logger.info(`Creating bank fund account for contact ${contactId}: ${bankData.bankName} - ${bankData.ifscCode}`);
      } else if (method === WithdrawalMethod.UPI) {
        const upiData = transferDetails as UpiTransferData;
        fundAccountData.account_type = 'vpa';
        fundAccountData.vpa = {
          address: upiData.upiId,
        };
        
        logger.info(`Creating UPI fund account for contact ${contactId}: ${upiData.upiId}`);
      }

      const fundAccount = await (razorpay as any).fundAccount.create(fundAccountData);
      logger.info(`Fund account created successfully: ${fundAccount.id}`);
      
      return fundAccount;
    } catch (error: any) {
      logger.error('Failed to create fund account:', {
        error: error.message,
        description: error.error?.description,
        code: error.error?.code,
        field: error.error?.field,
      });
      
      // Provide user-friendly error messages
      const errorMsg = error.error?.description || error.message;
      
      if (errorMsg?.includes('ifsc')) {
        throw new AppError('Invalid IFSC code. Please check your bank details.', 400);
      } else if (errorMsg?.includes('account_number')) {
        throw new AppError('Invalid account number. Please check your bank details.', 400);
      } else if (errorMsg?.includes('vpa') || errorMsg?.includes('upi')) {
        throw new AppError('Invalid UPI ID. Please check your UPI details.', 400);
      }
      
      throw new AppError(
        errorMsg || 'Failed to create fund account',
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
      // Get RazorpayX account number from environment
      const accountNumber = process.env.RAZORPAYX_ACCOUNT_NUMBER;
      
      if (!accountNumber) {
        throw new AppError(
          'RazorpayX account number not configured. Please set RAZORPAYX_ACCOUNT_NUMBER in environment variables.',
          500
        );
      }

      logger.info(`Creating payout: Amount=${amount/100}, FundAccount=${fundAccountId}`);

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

      const payout = await (razorpay as any).payouts.create(payoutData);
      
      logger.info(`Payout created successfully: ${payout.id}, Status: ${payout.status}`);
      return payout;
    } catch (error: any) {
      logger.error('Failed to create Razorpay payout:', {
        error: error.message,
        description: error.error?.description,
        code: error.error?.code,
        field: error.error?.field,
        source: error.error?.source,
      });

      // Provide user-friendly error messages
      const errorMsg = error.error?.description || error.message || 'Failed to create payout';
      
      if (errorMsg.includes('account_number')) {
        throw new AppError('Invalid RazorpayX account configuration. Please contact support.', 500);
      } else if (errorMsg.includes('insufficient')) {
        throw new AppError('Insufficient balance in payout account. Please try again later.', 503);
      } else if (errorMsg.includes('fund_account')) {
        throw new AppError('Invalid bank account details. Please update your bank information.', 400);
      }
      
      throw new AppError(errorMsg, 400);
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

