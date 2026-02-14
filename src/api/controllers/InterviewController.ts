import type { NextFunction, Request, Response } from 'express';

import { InterviewService } from '../../modules/interview/services/InterviewService';
import { InterviewSession } from '../../modules/interview/models/InterviewSession';
import type { DifficultyLevel } from '../../modules/scoring/services/ScoringService';

import { sendSuccess } from '../../core/response';
import { AppError } from '../../core/error';

export class InterviewController {
  private readonly interviewService: InterviewService;

  constructor() {
    this.interviewService = new InterviewService();
  }

  public getList = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      if (!req.user) {
        throw new AppError('Unauthorized', 401);
      }

      const pageRaw = req.query.page;
      const limitRaw = req.query.limit;

      const pageStr = (() => {
        if (typeof pageRaw === 'string') return pageRaw;
        if (Array.isArray(pageRaw) && typeof pageRaw[0] === 'string') return pageRaw[0];
        return '1';
      })();

      const limitStr = (() => {
        if (typeof limitRaw === 'string') return limitRaw;
        if (Array.isArray(limitRaw) && typeof limitRaw[0] === 'string') return limitRaw[0];
        return '10';
      })();

      const page = Number(pageStr);
      const limit = Number(limitStr);

      if (!Number.isInteger(page) || page < 1) {
        throw new AppError('Invalid page', 400);
      }
      if (!Number.isInteger(limit) || limit < 1 || limit > 50) {
        throw new AppError('Invalid limit', 400);
      }

      const result =
        req.user.role === 'candidate'
          ? await this.interviewService.getCandidateSessionsList(req.user.userId, page, limit)
          : req.user.role === 'interviewer'
            ? await this.interviewService.getInterviewerSessionsList(req.user.userId, page, limit)
            : (() => {
                throw new AppError('Forbidden', 403);
              })();

      sendSuccess(res, result);
    } catch (error: unknown) {
      next(error);
    }
  };

  public getHistory = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      if (!req.user) {
        throw new AppError('Unauthorized', 401);
      }

      const candidateId = req.user.userId;

      const pageRaw = req.query.page;
      const limitRaw = req.query.limit;

      const pageStr = (() => {
        if (typeof pageRaw === 'string') return pageRaw;
        if (Array.isArray(pageRaw) && typeof pageRaw[0] === 'string') {
          return pageRaw[0];
        }
        return '1';
      })();

      const limitStr = (() => {
        if (typeof limitRaw === 'string') return limitRaw;
        if (Array.isArray(limitRaw) && typeof limitRaw[0] === 'string') {
          return limitRaw[0];
        }
        return '10';
      })();

      const page = Number(pageStr);
      const limit = Number(limitStr);

      if (!Number.isInteger(page) || page < 1) {
        throw new AppError('Invalid page', 400);
      }

      if (!Number.isInteger(limit) || limit < 1 || limit > 50) {
        throw new AppError('Invalid limit', 400);
      }

      const result = await this.interviewService.getInterviewHistory(
        candidateId,
        page,
        limit,
      );

      sendSuccess(res, result);
    } catch (error: unknown) {
      next(error);
    }
  };

  public startInterview = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {

      if (!req.user) {
        throw new AppError("Unauthorized", 401);
      }

      const candidateId = req.user.userId;
      const { roleProfileId, level } = req.body;

      const session = await this.interviewService.startInterview({
        candidateId,
        roleProfileId,
        level,
      });

      sendSuccess(res, session);
    } catch (error: unknown) {
      next(error);
    }
  };

  public completeInterview = async (
    req: Request<{ id: string }>,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const sessionId = req.params.id;
      const { sectionScores } = req.body as {
        sectionScores: Array<{ sectionId: string; rawScore: number }>;
      };

      const result = await this.interviewService.completeInterview({
        sessionId,
        sectionScores,
      });

      sendSuccess(res, result);
    } catch (error: unknown) {
      next(error);
    }
  };

  public getInterview = async (
    req: Request<{ id: string }>,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const sessionId = req.params.id;
      const session = await InterviewSession.findById(sessionId).exec();

      if (!session) {
        throw new AppError('Session not found', 404);
      }

      sendSuccess(res, session);
    } catch (error: unknown) {
      next(error);
    }
  };
}

