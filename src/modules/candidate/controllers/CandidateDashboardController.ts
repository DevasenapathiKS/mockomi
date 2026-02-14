import type { NextFunction, Request, Response } from 'express';

import { AppError } from '../../../core/error';
import { sendSuccess } from '../../../core/response';
import { CandidateDashboardService } from '../services/CandidateDashboardService';

export class CandidateDashboardController {
  private readonly service: CandidateDashboardService;

  constructor() {
    this.service = new CandidateDashboardService();
  }

  public getDashboard = async (
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

      const dashboard = await this.service.getDashboard(req.user.userId);
      sendSuccess(res, dashboard);
    } catch (error: unknown) {
      next(error);
    }
  };
}

