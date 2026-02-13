import mongoose, { Types } from 'mongoose';

import { InterviewSession } from '../../interview/models/InterviewSession';
import { InterviewerProfile } from '../../interviewer/models/InterviewerProfile';
import { SessionRating } from '../models/SessionRating';
import { AppError } from '../../../core/error';

function roundTo2(value: number): number {
  return Math.round(value * 100) / 100;
}

export class RatingService {
  public async submitRating(
    candidateId: string,
    sessionId: string,
    rating: number,
    comment?: string,
  ): Promise<{ status: 'ok' }> {
    if (!Types.ObjectId.isValid(candidateId)) {
      throw new AppError('Unauthorized', 401);
    }
    if (!Types.ObjectId.isValid(sessionId)) {
      throw new AppError('Invalid sessionId', 400);
    }
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      throw new AppError('Invalid rating', 400);
    }

    const mongoSession = await mongoose.startSession();
    try {
      await mongoSession.withTransaction(async () => {
        const session = await InterviewSession.findById(sessionId)
          .session(mongoSession)
          .exec();

        if (!session) {
          throw new AppError('Session not found', 404);
        }

        if (session.status !== 'completed') {
          throw new AppError('Session not completed', 400);
        }

        if (session.candidateId !== candidateId) {
          throw new AppError('Forbidden', 403);
        }

        if (!session.interviewerId) {
          throw new AppError('Session has no interviewer assigned', 400);
        }

        const existing = await SessionRating.findOne({ sessionId: session._id })
          .session(mongoSession)
          .select('_id')
          .lean()
          .exec();

        if (existing) {
          throw new AppError('Rating already submitted', 400);
        }

        await SessionRating.create(
          [
            {
              sessionId: session._id,
              candidateId: new Types.ObjectId(candidateId),
              interviewerId: session.interviewerId,
              rating,
              comment,
            },
          ],
          { session: mongoSession },
        );

        const profile = await InterviewerProfile.findOne({
          userId: session.interviewerId,
        })
          .session(mongoSession)
          .exec();

        if (!profile) {
          throw new AppError('Interviewer profile not found', 404);
        }

        const totalRatings = profile.totalRatings ?? 0;
        const oldAvg = profile.ratingAverage ?? 0;
        const newAvg = roundTo2((oldAvg * totalRatings + rating) / (totalRatings + 1));

        await InterviewerProfile.updateOne(
          { _id: profile._id },
          {
            $set: { ratingAverage: newAvg },
            $inc: { totalRatings: 1 },
          },
          { session: mongoSession },
        ).exec();
      });

      return { status: 'ok' };
    } finally {
      await mongoSession.endSession();
    }
  }
}

