import type { ClientSession, Types } from 'mongoose';
import { PaymentRecord } from '../models/PaymentRecord';
import { AppError } from '../../../core/error';

export class PaymentService {
  public async createPayment(
    candidateId: Types.ObjectId,
    interviewerId: Types.ObjectId,
    slotId: Types.ObjectId,
    sessionId: Types.ObjectId,
    amount: number,
  ): Promise<typeof PaymentRecord.prototype>;
  public async createPayment(
    candidateId: Types.ObjectId,
    interviewerId: Types.ObjectId,
    slotId: Types.ObjectId,
    sessionId: Types.ObjectId,
    amount: number,
    session: ClientSession,
  ): Promise<typeof PaymentRecord.prototype>;
  public async createPayment(
    candidateId: Types.ObjectId,
    interviewerId: Types.ObjectId,
    slotId: Types.ObjectId,
    sessionId: Types.ObjectId,
    amount: number,
    session?: ClientSession,
  ): Promise<typeof PaymentRecord.prototype> {
    const platformShare = amount * 0.1;
    const interviewerShare = amount * 0.9;

    const [record] = await PaymentRecord.create(
      [
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
      ],
      session ? { session } : undefined,
    );

    return record;
  }

  public async confirmPayment(
    paymentId: string,
  ): Promise<typeof PaymentRecord.prototype>;
  public async confirmPayment(
    paymentId: string,
    session: ClientSession,
  ): Promise<typeof PaymentRecord.prototype>;
  public async confirmPayment(
    paymentId: string,
    session?: ClientSession,
  ): Promise<typeof PaymentRecord.prototype> {
    const record = await PaymentRecord.findById(paymentId)
      .session(session ?? null)
      .exec();

    if (!record) {
      throw new AppError('Payment record not found', 404);
    }

    record.status = 'paid';
    await record.save({ session: session ?? null });

    return record;
  }
}

