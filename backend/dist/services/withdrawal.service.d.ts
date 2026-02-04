import { IWithdrawalDocument } from '../models/Withdrawal';
import { WithdrawalStatus, WithdrawalMethod, PaginationQuery, PaginationInfo } from '../types';
interface CreateWithdrawalData {
    userId: string;
    amount: number;
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
declare class WithdrawalService {
    /**
     * Create a withdrawal request and process payout via Razorpay
     */
    createWithdrawal(data: CreateWithdrawalData, transferDetails: BankTransferData | UpiTransferData): Promise<IWithdrawalDocument>;
    /**
     * Admin: Approve a pending withdrawal and credit amount to bank account (via Razorpay or manual).
     */
    approveWithdrawal(withdrawalId: string, adminId: string): Promise<IWithdrawalDocument>;
    /**
     * Admin: Reject a pending withdrawal request.
     */
    rejectWithdrawal(withdrawalId: string, adminId: string, reason?: string): Promise<IWithdrawalDocument>;
    /**
     * User: Cancel own pending withdrawal request
     */
    cancelWithdrawal(withdrawalId: string, userId: string): Promise<IWithdrawalDocument>;
    /**
     * Process payout via Razorpay
     * NOTE: RazorpayX Payouts API requires a separate business account.
     * For testing, we simulate the payout by marking it as completed.
     * In production, integrate with RazorpayX APIs properly.
     */
    private processRazorpayPayout;
    /**
     * Create a Razorpay contact for the user
     */
    private createRazorpayContact;
    /**
     * Create a Razorpay fund account
     */
    private createRazorpayFundAccount;
    /**
     * Create a Razorpay payout request
     */
    private createRazorpayPayoutRequest;
    /**
     * Handle Razorpay payout webhook
     */
    handlePayoutWebhook(rawBody: Buffer | string, signature: string): Promise<void>;
    private handlePayoutProcessed;
    private handlePayoutFailed;
    private handlePayoutReversed;
    /**
     * Get user's withdrawal history
     */
    getUserWithdrawals(userId: string, pagination?: PaginationQuery): Promise<{
        withdrawals: IWithdrawalDocument[];
        pagination: PaginationInfo;
    }>;
    /**
     * Get withdrawal by ID
     */
    getWithdrawalById(withdrawalId: string, userId: string): Promise<IWithdrawalDocument>;
    /**
     * Get withdrawal stats for a user
     */
    getWithdrawalStats(userId: string): Promise<{
        totalWithdrawn: number;
        pendingAmount: number;
        availableBalance: number;
        totalEarnings: number;
    }>;
    /**
     * Admin: Get all withdrawals
     */
    getAllWithdrawals(status?: WithdrawalStatus, pagination?: PaginationQuery): Promise<{
        withdrawals: IWithdrawalDocument[];
        pagination: PaginationInfo;
    }>;
}
declare const _default: WithdrawalService;
export default _default;
//# sourceMappingURL=withdrawal.service.d.ts.map