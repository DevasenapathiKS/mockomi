"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentService = void 0;
const PaymentRecord_1 = require("../models/PaymentRecord");
const error_1 = require("../../../core/error");
class PaymentService {
    async createPayment(candidateId, interviewerId, slotId, sessionId, amount, session) {
        const platformShare = amount * 0.1;
        const interviewerShare = amount * 0.9;
        const [record] = await PaymentRecord_1.PaymentRecord.create([
            {
                candidateId,
                interviewerId,
                slotId,
                sessionId,
                amountTotal: amount,
                platformShare,
                interviewerShare,
                status: 'pending',
                paymentProvider: 'mock',
            },
        ], session ? { session } : undefined);
        return record;
    }
    async confirmPayment(paymentId, session) {
        const record = await PaymentRecord_1.PaymentRecord.findById(paymentId)
            .session(session ?? null)
            .exec();
        if (!record) {
            throw new error_1.AppError('Payment record not found', 404);
        }
        record.status = 'paid';
        await record.save({ session: session ?? null });
        return record;
    }
}
exports.PaymentService = PaymentService;
