import type { NextFunction, Request, Response } from 'express';
import { Types } from 'mongoose';

import { CandidateProgress } from '../../modules/progress/models/CandidateProgress';
import { sendSuccess } from '../../core/response';
import { AppError } from '../../core/error';

export class ProgressController {
  public getProgress = async (
    req: Request<{ candidateId: string; roleProfileId: string }>,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        throw new AppError("Unauthorized", 401);
      }
      
      const candidateId = req.user.userId;
      const { roleProfileId } = req.params;      

      if (!Types.ObjectId.isValid(roleProfileId)) {
        throw new AppError("Progress not found", 404);
      }

      const progress = await CandidateProgress.findOne({
        candidateId,
        roleProfileId: new Types.ObjectId(roleProfileId),
      }).exec();

      if (!progress) {
        throw new AppError("Progress not found", 404);
      }

      const delta = progress.improvementDelta;
      const totalSessions = progress.totalSessions;

      let trend: "baseline" | "improving" | "declining" | "stable";
      let message: string;

      if (totalSessions === 1) {
        trend = "baseline";
        message =
          "This is your first benchmark score. Continue practicing to improve.";
      } else if (delta > 0) {
        trend = "improving";
        message = `You improved by ${delta} points since your last interview.`;
      } else if (delta < 0) {
        trend = "declining";
        message = `Your score decreased by ${Math.abs(
          delta
        )} points. Review your weakest section carefully.`;
      } else {
        trend = "stable";
        message =
          "Your performance remained consistent. Push further to improve.";
      }

      sendSuccess(res, {
        ...progress.toObject(),
        growthSignal: {
          trend,
          delta,
          message,
        },
      });
    } catch (error: unknown) {
      next(error);
    }
  };
}

