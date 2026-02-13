import type { NextFunction, Request, Response } from 'express';
import mongoose, { Types } from 'mongoose';

import { AvailabilitySlot } from '../../availability/models/AvailabilitySlot';
import { InterviewSession } from '../../interview/models/InterviewSession';
import { ScoringModel } from '../../scoring/models/ScoringModel';
import { PaymentRecord } from '../models/PaymentRecord';
import { RazorpayService } from '../services/RazorpayService';
import { MediaService } from '../../media/services/MediaService';
import { AppError } from '../../../core/error';
import { sendSuccess } from '../../../core/response';
import { config } from '../../../config/env';

export class PaymentController {
  private readonly razorpayService: RazorpayService;
  private readonly mediaService: MediaService;

  constructor() {
    this.razorpayService = new RazorpayService();
    this.mediaService = new MediaService();
  }

  public createOrder = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      if (!req.user) {
        throw new AppError('Unauthorized', 401);
      }
      if (req.user.role !== 'candidate') {
        throw new AppError('Forbidden', 403);
      }

      const { slotId } = req.body as { slotId: string };
      if (!Types.ObjectId.isValid(slotId)) {
        throw new AppError('Invalid slotId', 400);
      }

      const slot = await AvailabilitySlot.findById(slotId).lean().exec();
      if (!slot) {
        throw new AppError('Slot not found', 404);
      }

      if (slot.status !== 'available') {
        throw new AppError('Slot is not available', 400);
      }

      if ((slot.startTime as Date).getTime() <= Date.now()) {
        throw new AppError('Slot is not available', 400);
      }

      if (String(slot.interviewerId) === req.user.userId) {
        throw new AppError('Cannot book your own slot', 400);
      }

      const amount = Number(slot.price);
      if (!Number.isFinite(amount) || amount <= 0) {
        throw new AppError('Invalid slot price', 500);
      }

      const platformShare = amount * 0.1;
      const interviewerShare = amount * 0.9;

      const paymentRecord = await PaymentRecord.create({
        candidateId: new Types.ObjectId(req.user.userId),
        interviewerId: slot.interviewerId as Types.ObjectId,
        slotId: slot._id as Types.ObjectId,
        amountTotal: amount,
        platformShare,
        interviewerShare,
        status: 'pending',
        paymentProvider: 'razorpay',
      });

      const order = await this.razorpayService.createOrder(amount);

      paymentRecord.providerOrderId = order.id;
      await paymentRecord.save();

      sendSuccess(res, {
        keyId: config.razorpayKeyId,
        order,
      });
    } catch (error: unknown) {
      next(error);
    }
  };

  public verify = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      if (!req.user) {
        throw new AppError('Unauthorized', 401);
      }
      if (req.user.role !== 'candidate') {
        throw new AppError('Forbidden', 403);
      }

      const {
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        slotId,
      } = req.body as {
        razorpay_order_id: string;
        razorpay_payment_id: string;
        razorpay_signature: string;
        slotId: string;
      };

      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        throw new AppError('Invalid payment payload', 400);
      }

      if (!Types.ObjectId.isValid(slotId)) {
        throw new AppError('Invalid slotId', 400);
      }

      const isValid = this.razorpayService.verifySignature(
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
      );

      if (!isValid) {
        throw new AppError('Invalid signature', 400);
      }

      const mongoSession = await mongoose.startSession();
      try {
        let summary: unknown;
        let createdSessionId: string | null = null;
        let scheduledAt: Date | null = null;

        await mongoSession.withTransaction(async () => {
          const paymentRecord = await PaymentRecord.findOne({
            paymentProvider: 'razorpay',
            providerOrderId: razorpay_order_id,
          })
            .session(mongoSession)
            .exec();

          if (!paymentRecord) {
            throw new AppError('Payment record not found', 404);
          }

          if (paymentRecord.status !== 'pending') {
            throw new AppError('Payment already processed', 400);
          }

          if (paymentRecord.candidateId.toString() !== req.user!.userId) {
            throw new AppError('Forbidden', 403);
          }

          if (paymentRecord.slotId.toString() !== slotId) {
            throw new AppError('Invalid slot', 400);
          }

          const slot = await AvailabilitySlot.findOneAndUpdate(
            { _id: new Types.ObjectId(slotId), status: 'available' },
            { $set: { status: 'reserved' } },
            { new: true, session: mongoSession },
          ).exec();

          if (!slot) {
            throw new AppError('Slot is not available', 400);
          }

          if (slot.interviewerId.toString() === req.user!.userId) {
            throw new AppError('Cannot book your own slot', 400);
          }

          const activeScoringModel = await ScoringModel.findOne({ isActive: true })
            .sort({ version: -1 })
            .session(mongoSession)
            .exec();

          if (!activeScoringModel) {
            throw new AppError('Active scoring model not found', 400);
          }

          const [createdSession] = await InterviewSession.create(
            [
              {
                candidateId: req.user!.userId,
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

          const updatedPayment = await PaymentRecord.findOneAndUpdate(
            { _id: paymentRecord._id, status: 'pending' },
            {
              $set: {
                status: 'paid',
                providerReferenceId: razorpay_payment_id,
                sessionId: createdSession._id,
              },
            },
            { new: true, session: mongoSession },
          ).exec();

          if (!updatedPayment) {
            throw new AppError('Payment already processed', 400);
          }

          createdSessionId = createdSession._id.toString();
          scheduledAt = (createdSession.scheduledAt ?? slot.startTime) as Date;

          summary = {
            id: createdSession._id.toString(),
            candidateId: createdSession.candidateId,
            interviewerId: createdSession.interviewerId?.toString() ?? '',
            roleProfileId: createdSession.roleProfileId.toString(),
            slotId: createdSession.slotId?.toString() ?? '',
            scheduledAt: createdSession.scheduledAt ?? slot.startTime,
            status: 'scheduled' as const,
          };
        });

        if (createdSessionId && scheduledAt) {
          void this.mediaService
            .markMeetingAttempt(createdSessionId, scheduledAt)
            .catch(() => undefined);
        }

        sendSuccess(res, summary);
      } finally {
        await mongoSession.endSession();
      }
    } catch (error: unknown) {
      next(error);
    }
  };

  public webhook = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      if (!Buffer.isBuffer(req.body)) {
        throw new AppError('Invalid webhook body', 400);
      }

      const signatureHeader = req.headers['x-razorpay-signature'];
      const signature =
        typeof signatureHeader === 'string'
          ? signatureHeader
          : Array.isArray(signatureHeader) && typeof signatureHeader[0] === 'string'
            ? signatureHeader[0]
            : undefined;

      if (!signature) {
        throw new AppError('Missing signature', 400);
      }

      const rawBody = req.body as Buffer;
      const isValid = this.razorpayService.verifyWebhookSignature(rawBody, signature);
      if (!isValid) {
        throw new AppError('Invalid signature', 400);
      }

      let payload: unknown;
      try {
        payload = JSON.parse(rawBody.toString('utf8'));
      } catch {
        throw new AppError('Invalid webhook payload', 400);
      }

      const event = (payload as { event?: unknown }).event;
      if (event !== 'payment.captured') {
        // Acknowledge other events without processing.
        res.status(200).send('ok');
        return;
      }

      const orderId =
        (payload as any)?.payload?.payment?.entity?.order_id ??
        (payload as any)?.payload?.order?.entity?.id;
      const paymentId =
        (payload as any)?.payload?.payment?.entity?.id ??
        (payload as any)?.payload?.payment?.entity?.payment_id;

      if (typeof orderId !== 'string' || typeof paymentId !== 'string') {
        res.status(200).send('ok');
        return;
      }

      const existing = await PaymentRecord.findOne({
        paymentProvider: 'razorpay',
        providerOrderId: orderId,
      })
        .select('_id status')
        .lean()
        .exec();

      if (!existing) {
        res.status(200).send('ok');
        return;
      }

      if (existing.status === 'paid') {
        res.status(200).send('ok');
        return;
      }

      const mongoSession = await mongoose.startSession();
      try {
        let createdSessionId: string | null = null;
        let scheduledAt: Date | null = null;

        await mongoSession.withTransaction(async () => {
          const paymentRecord = await PaymentRecord.findOne({
            paymentProvider: 'razorpay',
            providerOrderId: orderId,
          })
            .session(mongoSession)
            .exec();

          if (!paymentRecord) {
            return;
          }

          if (paymentRecord.status === 'paid') {
            return;
          }

          if (paymentRecord.status !== 'pending') {
            return;
          }

          const slot = await AvailabilitySlot.findOneAndUpdate(
            { _id: paymentRecord.slotId, status: 'available' },
            { $set: { status: 'reserved' } },
            { new: true, session: mongoSession },
          ).exec();

          if (!slot) {
            throw new AppError('Slot is not available', 400);
          }

          const activeScoringModel = await ScoringModel.findOne({ isActive: true })
            .sort({ version: -1 })
            .session(mongoSession)
            .exec();

          if (!activeScoringModel) {
            throw new AppError('Active scoring model not found', 400);
          }

          const [createdSession] = await InterviewSession.create(
            [
              {
                candidateId: paymentRecord.candidateId.toString(),
                interviewerId: paymentRecord.interviewerId,
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

          const updated = await PaymentRecord.findOneAndUpdate(
            { _id: paymentRecord._id, status: 'pending' },
            {
              $set: {
                status: 'paid',
                providerReferenceId: paymentId,
                sessionId: createdSession._id,
              },
            },
            { new: true, session: mongoSession },
          ).exec();

          if (!updated) {
            throw new AppError('Payment already processed', 400);
          }

          createdSessionId = createdSession._id.toString();
          scheduledAt = (createdSession.scheduledAt ?? slot.startTime) as Date;
        });

        if (createdSessionId && scheduledAt) {
          void this.mediaService
            .markMeetingAttempt(createdSessionId, scheduledAt)
            .catch(() => undefined);
        }

        res.status(200).send('ok');
      } finally {
        await mongoSession.endSession();
      }
    } catch (error: unknown) {
      next(error);
    }
  };
}

