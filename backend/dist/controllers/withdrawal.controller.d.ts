import { Response } from 'express';
/**
 * Create a withdrawal request
 */
export declare const createWithdrawal: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
/**
 * Get user's withdrawal history
 */
export declare const getMyWithdrawals: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
/**
 * Get withdrawal by ID
 */
export declare const getWithdrawalById: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
/**
 * Get withdrawal stats
 */
export declare const getWithdrawalStats: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
/**
 * Handle Razorpay payout webhook
 */
export declare const handlePayoutWebhook: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
/**
 * Admin: Get all withdrawals
 */
export declare const getAllWithdrawals: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
//# sourceMappingURL=withdrawal.controller.d.ts.map