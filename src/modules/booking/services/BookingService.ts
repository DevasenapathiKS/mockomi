import mongoose, { Types } from 'mongoose';

import { AvailabilitySlot } from '../../availability/models/AvailabilitySlot';
import { InterviewSession } from '../../interview/models/InterviewSession';
import { ScoringModel } from '../../scoring/models/ScoringModel';
import { AppError } from '../../../core/error';
import { PaymentService } from '../../payment/services/PaymentService';
import { MediaService } from '../../media/services/MediaService';

export class BookingService {
  private readonly paymentService: PaymentService;
  private readonly mediaService: MediaService;

  constructor() {
    this.paymentService = new PaymentService();
    this.mediaService = new MediaService();
  }

  public async bookSlot(candidateId: string, slotId: string): Promise<{
    id: string;
    candidateId: string;
    interviewerId: string;
    roleProfileId: string;
    slotId: string;
    scheduledAt: Date;
    status: 'scheduled';
  }> {
    if (!Types.ObjectId.isValid(candidateId)) {
      throw new AppError('Unauthorized', 401);
    }
    if (!Types.ObjectId.isValid(slotId)) {
      throw new AppError('Invalid slotId', 400);
    }

    const mongoSession = await mongoose.startSession();
    try {
      const confirmedSummary = await mongoSession.withTransaction(async () => {
        const activeScoringModel = await ScoringModel.findOne({ isActive: true })
          .sort({ version: -1 })
          .session(mongoSession)
          .exec();

        if (!activeScoringModel) {
          throw new AppError('Active scoring model not found', 400);
        }

        const slot = await AvailabilitySlot.findById(slotId)
          .session(mongoSession)
          .exec();

        if (!slot) {
          throw new AppError('Slot not found', 404);
        }

        if (slot.status !== 'available') {
          throw new AppError('Slot is not available', 400);
        }

        if (slot.interviewerId.toString() === candidateId) {
          throw new AppError('Cannot book your own slot', 400);
        }

        const [createdSession] = await InterviewSession.create(
          [
            {
              candidateId,
              interviewerId: slot.interviewerId,
              roleProfileId: slot.roleProfileId,
              slotId: slot._id,
              scheduledAt: slot.startTime,
              scoringModelVersion: activeScoringModel.version,
              level: 'confidence',
              status: 'scheduled',
            },
          ],
          { session: mongoSession },
        );

        const candidateObjectId = new Types.ObjectId(candidateId);

        const payment = await this.paymentService.createPayment(
          candidateObjectId,
          slot.interviewerId,
          slot._id,
          createdSession._id,
          slot.price,
          mongoSession,
        );

        const confirmed = await this.paymentService.confirmPayment(
          payment._id.toString(),
          mongoSession,
        );

        if (confirmed.status !== 'paid') {
          throw new AppError('Payment failed', 400);
        }

        const reserved = await AvailabilitySlot.findOneAndUpdate(
          { _id: slot._id, status: 'available' },
          { $set: { status: 'reserved' } },
          { new: true, session: mongoSession },
        ).exec();

        if (!reserved) {
          throw new AppError('Slot is not available', 400);
        }

        return {
          id: createdSession._id.toString(),
          candidateId: createdSession.candidateId,
          interviewerId: createdSession.interviewerId?.toString() ?? '',
          roleProfileId: createdSession.roleProfileId.toString(),
          slotId: createdSession.slotId?.toString() ?? '',
          scheduledAt: createdSession.scheduledAt ?? slot.startTime,
          status: 'scheduled' as const,
        };
      });

      // Best-effort media meeting creation (must not fail booking).
      void this.mediaService
        .markMeetingAttempt(confirmedSummary.id, confirmedSummary.scheduledAt)
        .catch(() => undefined);

      return confirmedSummary;
    } finally {
      await mongoSession.endSession();
    }
  }
}

