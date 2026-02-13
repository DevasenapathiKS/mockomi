import type { NextFunction, Request, Response } from 'express';
import { Types } from 'mongoose';

import { InterviewerProfile } from '../models/InterviewerProfile';
import { InterviewerService } from '../services/InterviewerService';
import { AppError } from '../../../core/error';
import { sendSuccess } from '../../../core/response';

export class InterviewerController {
  private readonly interviewerService: InterviewerService;

  constructor() {
    this.interviewerService = new InterviewerService();
  }

  public getPublicList = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const pageRaw = req.query.page;
      const limitRaw = req.query.limit;
      const sortRaw = req.query.sort;
      const techRaw = req.query.tech;

      const pageStr =
        typeof pageRaw === 'string'
          ? pageRaw
          : Array.isArray(pageRaw) && typeof pageRaw[0] === 'string'
            ? pageRaw[0]
            : undefined;

      const limitStr =
        typeof limitRaw === 'string'
          ? limitRaw
          : Array.isArray(limitRaw) && typeof limitRaw[0] === 'string'
            ? limitRaw[0]
            : undefined;

      const sort =
        typeof sortRaw === 'string'
          ? sortRaw
          : Array.isArray(sortRaw) && typeof sortRaw[0] === 'string'
            ? sortRaw[0]
            : undefined;

      const tech =
        typeof techRaw === 'string'
          ? techRaw
          : Array.isArray(techRaw) && typeof techRaw[0] === 'string'
            ? techRaw[0]
            : undefined;

      const page = pageStr ? Number(pageStr) : 1;
      const limit = limitStr ? Number(limitStr) : 10;

      const result = await this.interviewerService.getPublicInterviewers({
        page,
        limit,
        sort,
        tech,
      });

      sendSuccess(res, result);
    } catch (error: unknown) {
      next(error);
    }
  };

  public apply = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      if (!req.user) {
        throw new AppError('Unauthorized', 401);
      }

      if (req.user.role !== 'interviewer') {
        throw new AppError('Forbidden', 403);
      }

      const existing = await InterviewerProfile.findOne({
        userId: new Types.ObjectId(req.user.userId),
      }).exec();

      if (existing) {
        throw new AppError('Interviewer profile already exists', 400);
      }

      const { bio, yearsOfExperience, primaryTechStack, linkedinUrl } = req.body as {
        bio: string;
        yearsOfExperience: number;
        primaryTechStack: string[];
        linkedinUrl: string;
      };

      const profile = await InterviewerProfile.create({
        userId: new Types.ObjectId(req.user.userId),
        bio,
        yearsOfExperience,
        primaryTechStack,
        linkedinUrl,
        isVerified: false,
      });

      sendSuccess(res, profile);
    } catch (error: unknown) {
      next(error);
    }
  };

  public verify = async (
    req: Request<{ userId: string }>,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      if (!req.user) {
        throw new AppError('Unauthorized', 401);
      }

      if (req.user.role !== 'admin') {
        throw new AppError('Forbidden', 403);
      }

      const userId = req.params.userId;
      if (!Types.ObjectId.isValid(userId)) {
        throw new AppError('Interviewer profile not found', 404);
      }

      const profile = await InterviewerProfile.findOne({
        userId: new Types.ObjectId(userId),
      }).exec();

      if (!profile) {
        throw new AppError('Interviewer profile not found', 404);
      }

      profile.isVerified = true;
      await profile.save();

      sendSuccess(res, profile);
    } catch (error: unknown) {
      next(error);
    }
  };
}

