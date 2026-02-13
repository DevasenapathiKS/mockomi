import type { NextFunction, Request, Response } from 'express';

import { SessionControlService } from '../services/SessionControlService';
import { RatingService } from '../../rating/services/RatingService';
import { AppError } from '../../../core/error';
import { sendSuccess } from '../../../core/response';

export class SessionController {
  private readonly sessionControlService: SessionControlService;
  private readonly ratingService: RatingService;

  constructor() {
    this.sessionControlService = new SessionControlService();
    this.ratingService = new RatingService();
  }

  public start = async (
    req: Request<{ id: string }>,
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

      const sessionId = req.params.id;
      const result = await this.sessionControlService.startSession(
        req.user.userId,
        sessionId,
      );

      sendSuccess(res, result);
    } catch (error: unknown) {
      next(error);
    }
  };

  public submitScore = async (
    req: Request<{ id: string }>,
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

      const sessionId = req.params.id;
      const { sectionScores } = req.body as {
        sectionScores: Array<{ sectionId: string; rawScore: number }>;
      };

      const result = await this.sessionControlService.submitScores(
        req.user.userId,
        sessionId,
        sectionScores,
      );

      sendSuccess(res, result);
    } catch (error: unknown) {
      next(error);
    }
  };

  public reschedule = async (
    req: Request<{ id: string }>,
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

      const sessionId = req.params.id;
      const { newSlotId } = req.body as { newSlotId: string };

      const result = await this.sessionControlService.rescheduleSession(
        req.user.userId,
        sessionId,
        newSlotId,
      );

      sendSuccess(res, result);
    } catch (error: unknown) {
      next(error);
    }
  };

  public rate = async (
    req: Request<{ id: string }>,
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

      const sessionId = req.params.id;
      const { rating, comment } = req.body as { rating: number; comment?: string };

      const result = await this.ratingService.submitRating(
        req.user.userId,
        sessionId,
        rating,
        comment,
      );

      sendSuccess(res, result);
    } catch (error: unknown) {
      next(error);
    }
  };

  public joinToken = async (
    req: Request<{ id: string }>,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      if (!req.user) {
        throw new AppError('Unauthorized', 401);
      }

      if (req.user.role !== 'candidate' && req.user.role !== 'interviewer') {
        throw new AppError('Forbidden', 403);
      }

      const result = await this.sessionControlService.createJoinToken(
        req.user.userId,
        req.user.role,
        req.params.id,
      );

      sendSuccess(res, result);
    } catch (error: unknown) {
      next(error);
    }
  };
}

