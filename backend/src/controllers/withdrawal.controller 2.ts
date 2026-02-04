import { Response } from 'express';
import { withdrawalService } from '../services';
import { AuthRequest, WithdrawalMethod } from '../types';
import { asyncHandler } from '../middlewares/errorHandler';

/**
 * Create a withdrawal request
 */
export const createWithdrawal = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { amount, method, bankDetails, upiId } = req.body;

  let transferDetails: any;

  if (method === WithdrawalMethod.BANK_TRANSFER) {
    if (!bankDetails) {
      return res.status(400).json({
        success: false,
        message: 'Bank details are required for bank transfer',
      });
    }
    transferDetails = bankDetails;
  } else if (method === WithdrawalMethod.UPI) {
    if (!upiId) {
      return res.status(400).json({
        success: false,
        message: 'UPI ID is required for UPI transfer',
      });
    }
    transferDetails = { upiId };
  }

  const withdrawal = await withdrawalService.createWithdrawal(
    {
      userId: req.user!.id,
      amount,
      method,
    },
    transferDetails
  );

  res.status(201).json({
    success: true,
    message: 'Withdrawal request created successfully',
    data: withdrawal,
  });
});

/**
 * Get user's withdrawal history
 */
export const getMyWithdrawals = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { page, limit } = req.query;

  const { withdrawals, pagination } = await withdrawalService.getUserWithdrawals(
    req.user!.id,
    {
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    }
  );

  res.status(200).json({
    success: true,
    data: withdrawals,
    pagination,
  });
});

/**
 * Get withdrawal by ID
 */
export const getWithdrawalById = asyncHandler(async (req: AuthRequest, res: Response) => {
  const withdrawal = await withdrawalService.getWithdrawalById(
    req.params.id,
    req.user!.id
  );

  res.status(200).json({
    success: true,
    data: withdrawal,
  });
});

/**
 * Get withdrawal stats
 */
export const getWithdrawalStats = asyncHandler(async (req: AuthRequest, res: Response) => {
  const stats = await withdrawalService.getWithdrawalStats(req.user!.id);

  res.status(200).json({
    success: true,
    data: stats,
  });
});

/**
 * Cancel own pending withdrawal
 */
export const cancelWithdrawal = asyncHandler(async (req: AuthRequest, res: Response) => {
  const withdrawal = await withdrawalService.cancelWithdrawal(
    req.params.id,
    req.user!.id
  );

  res.status(200).json({
    success: true,
    message: 'Withdrawal request cancelled successfully.',
    data: withdrawal,
  });
});

/**
 * Handle Razorpay payout webhook
 */
export const handlePayoutWebhook = asyncHandler(async (req: AuthRequest, res: Response) => {
  const signature = req.headers['x-razorpay-signature'] as string;

  if (!signature) {
    return res.status(400).json({
      success: false,
      message: 'Missing webhook signature',
    });
  }

  // Get raw body for signature verification
  const rawBody = (req as any).rawBody || JSON.stringify(req.body);

  await withdrawalService.handlePayoutWebhook(rawBody, signature);

  res.status(200).json({ received: true });
});

/**
 * Admin: Get all withdrawals
 */
export const getAllWithdrawals = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { status, page, limit } = req.query;

  const { withdrawals, pagination } = await withdrawalService.getAllWithdrawals(
    status as any,
    {
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    }
  );

  res.status(200).json({
    success: true,
    data: withdrawals,
    pagination,
  });
});

/**
 * Admin: Approve a pending withdrawal (credits amount to bank account).
 */
export const approveWithdrawal = asyncHandler(async (req: AuthRequest, res: Response) => {
  const withdrawal = await withdrawalService.approveWithdrawal(
    req.params.id,
    req.user!.id
  );

  res.status(200).json({
    success: true,
    message: 'Withdrawal approved. Amount will be credited to the bank account.',
    data: withdrawal,
  });
});

/**
 * Admin: Reject a pending withdrawal request.
 */
export const rejectWithdrawal = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { reason } = req.body || {};
  const withdrawal = await withdrawalService.rejectWithdrawal(
    req.params.id,
    req.user!.id,
    reason
  );

  res.status(200).json({
    success: true,
    message: 'Withdrawal request rejected.',
    data: withdrawal,
  });
});

