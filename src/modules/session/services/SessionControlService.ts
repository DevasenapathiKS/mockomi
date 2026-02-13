import mongoose, { Types } from 'mongoose';

import { InterviewSession } from '../../interview/models/InterviewSession';
import { RoleProfile } from '../../scoring/models/RoleProfile';
import { ScoringModel } from '../../scoring/models/ScoringModel';
import { SectionScore } from '../../interview/models/SectionScore';
import { AvailabilitySlot } from '../../availability/models/AvailabilitySlot';
import { InterviewerProfile } from '../../interviewer/models/InterviewerProfile';
import { PaymentRecord } from '../../payment/models/PaymentRecord';
import { ScoringService, type SectionScoreInput } from '../../scoring/services/ScoringService';
import { AppError } from '../../../core/error';
import jwt from 'jsonwebtoken';
import { config } from '../../../config/env';

function roundTo2(value: number): number {
  return Math.round(value * 100) / 100;
}

export class SessionControlService {
  private readonly scoringService: ScoringService;

  constructor() {
    this.scoringService = new ScoringService();
  }

  public async startSession(interviewerId: string, sessionId: string): Promise<{ status: 'ok' }> {
    if (!Types.ObjectId.isValid(interviewerId)) {
      throw new AppError('Unauthorized', 401);
    }
    if (!Types.ObjectId.isValid(sessionId)) {
      throw new AppError('Invalid sessionId', 400);
    }

    const session = await InterviewSession.findById(sessionId).exec();
    if (!session) {
      throw new AppError('Session not found', 404);
    }

    if (!session.interviewerId) {
      throw new AppError('Session has no interviewer assigned', 400);
    }

    if (session.interviewerId.toString() !== interviewerId) {
      throw new AppError('Forbidden', 403);
    }

    if (session.status !== 'scheduled') {
      throw new AppError('Session status invalid', 400);
    }

    if (!session.scheduledAt) {
      throw new AppError('Session has no scheduledAt', 400);
    }

    const now = Date.now();
    const scheduled = session.scheduledAt.getTime();
    const earliest = scheduled - 5 * 60 * 1000;
    const latest = scheduled + 30 * 60 * 1000;

    if (now < earliest || now > latest) {
      throw new AppError('Session start time window invalid', 400);
    }

    const updated = await InterviewSession.findOneAndUpdate(
      { _id: session._id, status: 'scheduled' },
      { $set: { status: 'in_progress' } },
      { new: true },
    ).exec();

    if (!updated) {
      throw new AppError('Session status invalid', 400);
    }

    return { status: 'ok' };
  }

  public async submitScores(
    interviewerId: string,
    sessionId: string,
    sectionScores: SectionScoreInput[],
  ) {
    if (!Types.ObjectId.isValid(interviewerId)) {
      throw new AppError('Unauthorized', 401);
    }
    if (!Types.ObjectId.isValid(sessionId)) {
      throw new AppError('Invalid sessionId', 400);
    }

    const mongoSession = await mongoose.startSession();
    try {
      let result: unknown;

      await mongoSession.withTransaction(async () => {
        const interviewSession = await InterviewSession.findById(sessionId)
          .session(mongoSession)
          .exec();

        if (!interviewSession) {
          throw new AppError('Session not found', 404);
        }

        if (!interviewSession.interviewerId) {
          throw new AppError('Session has no interviewer assigned', 400);
        }

        if (interviewSession.interviewerId.toString() !== interviewerId) {
          throw new AppError('Forbidden', 403);
        }

        if (interviewSession.status !== 'in_progress') {
          throw new AppError('Session already completed or invalid', 400);
        }

        const roleProfile = await RoleProfile.findById(interviewSession.roleProfileId)
          .session(mongoSession)
          .exec();

        if (!roleProfile) {
          throw new AppError('Role profile not found', 404);
        }

        const scoringModel = await ScoringModel.findOne({
          version: interviewSession.scoringModelVersion,
        })
          .session(mongoSession)
          .exec();

        if (!scoringModel) {
          throw new AppError('Scoring model not found', 404);
        }

        // Save SectionScore docs for each role section (missing rawScore => 0)
        const scoreBySectionId = new Map<string, number>(
          sectionScores.map((s) => [s.sectionId, s.rawScore]),
        );

        const sectionScoreDocs = roleProfile.sections.map((section) => {
          const sectionId = String(section.sectionId);
          const rawScore = scoreBySectionId.get(sectionId) ?? 0;
          const percentScore = rawScore * 10;
          const weightedScore = roundTo2(percentScore * (section.weight / 100));

          return {
            sessionId: interviewSession._id,
            sectionId: section.sectionId,
            rawScore,
            weightedScore,
          };
        });

        await SectionScore.insertMany(sectionScoreDocs, { session: mongoSession, ordered: true });

        const final = this.scoringService.computeFinalResult(
          sectionScores,
          {
            sections: roleProfile.sections.map((s) => ({
              sectionId: String(s.sectionId),
              weight: s.weight,
            })),
            readinessThreshold: roleProfile.readinessThreshold,
          },
          interviewSession.level,
          { difficultyMultipliers: scoringModel.difficultyMultipliers },
        );

        // Prevent double completion with conditional update
        const updatedSession = await InterviewSession.findOneAndUpdate(
          { _id: interviewSession._id, status: 'in_progress' },
          {
            $set: {
              overallScore: roundTo2(final.overallScore),
              readinessScore: roundTo2(final.readinessScore),
              readinessStatus: final.readinessStatus,
              readinessGap: roundTo2(final.readinessGap),
              status: 'completed',
            },
          },
          { new: true, session: mongoSession },
        ).exec();

        if (!updatedSession) {
          throw new AppError('Session already completed or invalid', 400);
        }

        if (!updatedSession.slotId) {
          throw new AppError('Session has no slotId', 400);
        }

        // Slot -> completed
        await AvailabilitySlot.findOneAndUpdate(
          { _id: updatedSession.slotId, status: { $ne: 'cancelled' } },
          { $set: { status: 'completed' } },
          { session: mongoSession },
        ).exec();

        // Earnings + total interviews (from PaymentRecord)
        const payment = await PaymentRecord.findOne({ sessionId: updatedSession._id })
          .session(mongoSession)
          .exec();

        if (!payment) {
          throw new AppError('Payment record not found', 404);
        }

        if (payment.status !== 'paid') {
          throw new AppError('Payment not completed', 400);
        }

        const profile = await InterviewerProfile.findOne({
          userId: new Types.ObjectId(interviewerId),
        })
          .session(mongoSession)
          .exec();

        if (!profile) {
          throw new AppError('Interviewer profile not found', 404);
        }

        await InterviewerProfile.updateOne(
          { _id: profile._id },
          {
            $inc: {
              totalInterviews: 1,
              earningsTotal: payment.interviewerShare,
            },
          },
          { session: mongoSession },
        ).exec();

        result = {
          overallScore: updatedSession.overallScore,
          readinessScore: updatedSession.readinessScore,
          readinessStatus: updatedSession.readinessStatus ?? 'not_ready',
          readinessGap: updatedSession.readinessGap,
        };
      });

      return result as {
        overallScore: number;
        readinessScore: number;
        readinessStatus: 'ready' | 'not_ready';
        readinessGap: number;
      };
    } finally {
      await mongoSession.endSession();
    }
  }

  public async rescheduleSession(
    candidateId: string,
    sessionId: string,
    newSlotId: string,
  ): Promise<{
    id: string;
    slotId: string;
    scheduledAt: Date;
    status: 'scheduled';
    rescheduleCount: number;
  }> {
    if (!Types.ObjectId.isValid(candidateId)) {
      throw new AppError('Unauthorized', 401);
    }
    if (!Types.ObjectId.isValid(sessionId)) {
      throw new AppError('Invalid sessionId', 400);
    }
    if (!Types.ObjectId.isValid(newSlotId)) {
      throw new AppError('Invalid slotId', 400);
    }

    const mongoSession = await mongoose.startSession();
    try {
      let summary: {
        id: string;
        slotId: string;
        scheduledAt: Date;
        status: 'scheduled';
        rescheduleCount: number;
      } | null = null;

      await mongoSession.withTransaction(async () => {
        const session = await InterviewSession.findById(sessionId)
          .session(mongoSession)
          .exec();

        if (!session) {
          throw new AppError('Session not found', 404);
        }

        if (session.candidateId !== candidateId) {
          throw new AppError('Forbidden', 403);
        }

        if (session.status !== 'scheduled') {
          throw new AppError('Session status invalid', 400);
        }

        const currentCount = session.rescheduleCount ?? 0;
        if (currentCount >= 1) {
          throw new AppError('Reschedule limit reached', 400);
        }

        if (!session.scheduledAt) {
          throw new AppError('Session has no scheduledAt', 400);
        }

        const now = Date.now();
        const cutoff = session.scheduledAt.getTime() - 2 * 60 * 60 * 1000;
        if (now > cutoff) {
          throw new AppError('Reschedule window expired', 400);
        }

        if (!session.slotId) {
          throw new AppError('Session has no slotId', 400);
        }

        const [oldSlot, newSlot] = await Promise.all([
          AvailabilitySlot.findById(session.slotId).session(mongoSession).exec(),
          AvailabilitySlot.findById(newSlotId).session(mongoSession).exec(),
        ]);

        if (!oldSlot) {
          throw new AppError('Old slot not found', 404);
        }

        if (!newSlot) {
          throw new AppError('New slot not found', 404);
        }

        if (newSlot.status !== 'available') {
          throw new AppError('Slot is not available', 400);
        }

        // Keep the session consistent: same interviewer + role profile.
        if (
          session.interviewerId &&
          newSlot.interviewerId.toString() !== session.interviewerId.toString()
        ) {
          throw new AppError('New slot interviewer mismatch', 400);
        }

        if (newSlot.roleProfileId.toString() !== session.roleProfileId.toString()) {
          throw new AppError('New slot role profile mismatch', 400);
        }

        // Release old slot and reserve new slot.
        await AvailabilitySlot.updateOne(
          { _id: oldSlot._id, status: 'reserved' },
          { $set: { status: 'available' } },
          { session: mongoSession },
        ).exec();

        const reservedNew = await AvailabilitySlot.findOneAndUpdate(
          { _id: newSlot._id, status: 'available' },
          { $set: { status: 'reserved' } },
          { new: true, session: mongoSession },
        ).exec();

        if (!reservedNew) {
          throw new AppError('Slot is not available', 400);
        }

        const updated = await InterviewSession.findOneAndUpdate(
          { _id: session._id, status: 'scheduled', rescheduleCount: { $lt: 1 } },
          {
            $set: {
              slotId: reservedNew._id,
              scheduledAt: reservedNew.startTime,
            },
            $inc: { rescheduleCount: 1 },
          },
          { new: true, session: mongoSession },
        ).exec();

        if (!updated) {
          throw new AppError('Reschedule failed', 400);
        }

        summary = {
          id: updated._id.toString(),
          slotId: updated.slotId?.toString() ?? reservedNew._id.toString(),
          scheduledAt: updated.scheduledAt ?? reservedNew.startTime,
          status: 'scheduled',
          rescheduleCount: updated.rescheduleCount,
        };
      });

      if (!summary) {
        throw new AppError('Reschedule failed', 500);
      }

      return summary;
    } finally {
      await mongoSession.endSession();
    }
  }

  public async createJoinToken(
    userId: string,
    role: 'candidate' | 'interviewer',
    sessionId: string,
  ): Promise<{ token: string; signalingUrl: string }> {
    if (!Types.ObjectId.isValid(sessionId)) {
      throw new AppError('Invalid sessionId', 400);
    }

    const session = await InterviewSession.findById(sessionId).lean().exec();
    if (!session) {
      throw new AppError('Session not found', 404);
    }

    if (session.status !== 'scheduled' && session.status !== 'in_progress') {
      throw new AppError('Session status invalid', 400);
    }

    if (!session.mediaMeetingCreated) {
      throw new AppError('Media meeting not ready', 400);
    }

    const isCandidate = session.candidateId === userId;
    const isInterviewer =
      !!session.interviewerId && String(session.interviewerId) === userId;

    if (!isCandidate && !isInterviewer) {
      throw new AppError('Forbidden', 403);
    }

    const scheduledAt = session.scheduledAt ? new Date(session.scheduledAt) : null;
    if (!scheduledAt || Number.isNaN(scheduledAt.getTime())) {
      throw new AppError('Session has no scheduledAt', 400);
    }

    const now = Date.now();
    const scheduled = scheduledAt.getTime();
    const earliest = scheduled - 5 * 60 * 1000;
    const latest =
      session.status === 'in_progress'
        ? scheduled + 60 * 60 * 1000
        : scheduled + 30 * 60 * 1000;

    if (now < earliest || now > latest) {
      throw new AppError('Join time window invalid', 400);
    }

    const token = jwt.sign(
      {
        meetingId: String(session._id),
        userId,
        role,
      },
      config.chamcallSharedSecret,
      { expiresIn: '5m' },
    );

    return {
      token,
      signalingUrl: config.mediaBaseUrl,
    };
  }
}

