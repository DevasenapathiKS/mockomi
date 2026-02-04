import { IPaymentDocument } from '../models/Payment';
import { PaymentStatus, PaginationQuery, PaginationInfo } from '../types';
interface CreateOrderData {
    userId: string;
    interviewId?: string;
    amount: number;
    notes?: object;
}
interface VerifyPaymentData {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
}
declare class PaymentService {
    createOrder(data: CreateOrderData): Promise<{
        order: any;
        payment: IPaymentDocument;
    }>;
    verifyPayment(data: VerifyPaymentData): Promise<IPaymentDocument>;
    handleWebhook(rawBody: Buffer | string, signature: string): Promise<void>;
    private handlePaymentCaptured;
    private handlePaymentFailed;
    private handleRefundCreated;
    initiateRefund(paymentId: string, adminId: string): Promise<any>;
    getPaymentById(paymentId: string, userId: string): Promise<IPaymentDocument>;
    getUserPayments(userId: string, pagination?: PaginationQuery): Promise<{
        payments: IPaymentDocument[];
        pagination: PaginationInfo;
    }>;
    getAllPayments(status?: PaymentStatus, pagination?: PaginationQuery): Promise<{
        payments: IPaymentDocument[];
        pagination: PaginationInfo;
    }>;
    getPaymentStats(): Promise<{
        totalRevenue: number;
        totalTransactions: number;
        successfulPayments: number;
        failedPayments: number;
        refundedPayments: number;
    }>;
}
declare const _default: PaymentService;
export default _default;
//# sourceMappingURL=payment.service%202.d.ts.map