import mongoose, { Types } from 'mongoose';

import { AvailabilitySlot } from '../models/AvailabilitySlot';
import { InterviewerProfile } from '../../interviewer/models/InterviewerProfile';
import { RoleProfile } from '../../scoring/models/RoleProfile';
import { AppError } from '../../../core/error';

const THIRTY_MINUTES_MS = 30 * 60 * 1000;

export class AvailabilityService {
  public async getAvailableSlots(
    interviewerId: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<{
    items: Array<{ id: string; startTime: Date; endTime: Date; price: number }>;
    pagination: { page: number; limit: number; total: number; totalPages: number };
  }> {
    if (!Types.ObjectId.isValid(interviewerId)) {
      throw new AppError('Invalid interviewerId', 400);
    }

    const normalizedPage = Number.isInteger(page) && page >= 1 ? page : 1;
    const normalizedLimit = Number.isInteger(limit) && limit >= 1 ? limit : 10;
    const cappedLimit = Math.min(normalizedLimit, 50);

    const profile = await InterviewerProfile.findOne({
      userId: new Types.ObjectId(interviewerId),
      isVerified: true,
      isActive: true,
    })
      .select('_id')
      .lean()
      .exec();

    if (!profile) {
      throw new AppError('Interviewer not found', 404);
    }

    const skip = (normalizedPage - 1) * cappedLimit;
    const now = new Date();

    const filter = {
      interviewerId: new Types.ObjectId(interviewerId),
      status: 'available' as const,
      startTime: { $gt: now },
    };

    const [items, total] = await Promise.all([
      AvailabilitySlot.find(filter)
        .sort({ startTime: 1 })
        .skip(skip)
        .limit(cappedLimit)
        .select('_id startTime endTime price')
        .lean()
        .exec(),
      AvailabilitySlot.countDocuments(filter).exec(),
    ]);

    return {
      items: items.map((i) => ({
        id: String(i._id),
        startTime: i.startTime as Date,
        endTime: i.endTime as Date,
        price: i.price as number,
      })),
      pagination: {
        page: normalizedPage,
        limit: cappedLimit,
        total,
        totalPages: Math.ceil(total / cappedLimit),
      },
    };
  }

  public async createSlot(
    interviewerId: string,
    roleProfileId: string | null,
    startTime: Date,
    price?: number,
  ) {
    if (!Types.ObjectId.isValid(interviewerId)) {
      throw new AppError('Unauthorized', 401);
    }
    if (Number.isNaN(startTime.getTime())) {
      throw new AppError('Invalid startTime', 400);
    }
    if (startTime.getTime() <= Date.now()) {
      throw new AppError('startTime must be in the future', 400);
    }

    const effectiveRoleProfileId = await (async (): Promise<string> => {
      if (roleProfileId && Types.ObjectId.isValid(roleProfileId)) return roleProfileId;

      const active = await RoleProfile.findOne({ isActive: true })
        .sort({ updatedAt: -1, createdAt: -1 })
        .select('_id')
        .lean()
        .exec();

      if (!active) {
        throw new AppError('Active role profile not found', 400);
      }

      return String(active._id);
    })();

    const effectivePrice =
      typeof price === 'number' && Number.isFinite(price) && price >= 0 ? price : 100;

    const endTime = new Date(startTime.getTime() + THIRTY_MINUTES_MS);

    const mongoSession = await mongoose.startSession();
    try {
      let created: unknown;

      await mongoSession.withTransaction(async () => {
        const profile = await InterviewerProfile.findOne({
          userId: new Types.ObjectId(interviewerId),
        })
          .session(mongoSession)
          .exec();

        if (!profile) {
          throw new AppError('Interviewer profile not found', 404);
        }

        if (!profile.isVerified) {
          throw new AppError('Interviewer is not verified', 403);
        }

        const overlapping = await AvailabilitySlot.findOne({
          interviewerId: new Types.ObjectId(interviewerId),
          status: { $ne: 'cancelled' },
          startTime: { $lt: endTime },
          endTime: { $gt: startTime },
        })
          .session(mongoSession)
          .select('_id')
          .lean()
          .exec();

        if (overlapping) {
          throw new AppError('Overlapping slot exists', 400);
        }

        const [slot] = await AvailabilitySlot.create(
          [
            {
              interviewerId: new Types.ObjectId(interviewerId),
              roleProfileId: new Types.ObjectId(effectiveRoleProfileId),
              startTime,
              endTime,
              status: 'available',
              price: effectivePrice,
            },
          ],
          { session: mongoSession },
        );

        created = slot;
      });

      return created as typeof AvailabilitySlot.prototype;
    } finally {
      await mongoSession.endSession();
    }
  }

  public async getInterviewerSlots(
    interviewerId: string,
    limit: number = 50,
  ): Promise<
    Array<{
      id: string;
      startTime: Date;
      endTime: Date;
      status: string;
      price: number;
      createdAt: Date;
    }>
  > {
    if (!Types.ObjectId.isValid(interviewerId)) {
      throw new AppError('Unauthorized', 401);
    }

    const cappedLimit = Number.isInteger(limit) && limit >= 1 ? Math.min(limit, 100) : 50;

    const slots = await AvailabilitySlot.find({
      interviewerId: new Types.ObjectId(interviewerId),
    })
      .sort({ startTime: -1 })
      .limit(cappedLimit)
      .select('_id startTime endTime status price createdAt')
      .lean()
      .exec();

    return slots.map((s) => ({
      id: String(s._id),
      startTime: s.startTime as Date,
      endTime: s.endTime as Date,
      status: String(s.status),
      price: Number(s.price ?? 0),
      createdAt: (s.createdAt as Date) ?? new Date(0),
    }));
  }
}

