import type { NextFunction, Request, Response } from 'express';

import { AvailabilityService } from '../services/AvailabilityService';
import { AppError } from '../../../core/error';
import { sendSuccess } from '../../../core/response';

export class AvailabilityController {
  private readonly availabilityService: AvailabilityService;

  constructor() {
    this.availabilityService = new AvailabilityService();
  }

  public createSlot = async (
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

      const { roleProfileId, startTime } = req.body as {
        roleProfileId: string;
        startTime: string;
      };

      const startDate = new Date(startTime);

      const slot = await this.availabilityService.createSlot(
        req.user.userId,
        roleProfileId,
        startDate,
      );

      sendSuccess(res, slot);
    } catch (error: unknown) {
      next(error);
    }
  };

  public getPublicSlots = async (
    req: Request<{ id: string }>,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const interviewerId = req.params.id;

      const pageRaw = req.query.page;
      const limitRaw = req.query.limit;

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

      const page = pageStr ? Number(pageStr) : 1;
      const limit = limitStr ? Number(limitStr) : 10;

      const result = await this.availabilityService.getAvailableSlots(
        interviewerId,
        page,
        limit,
      );

      sendSuccess(res, result);
    } catch (error: unknown) {
      next(error);
    }
  };
}

