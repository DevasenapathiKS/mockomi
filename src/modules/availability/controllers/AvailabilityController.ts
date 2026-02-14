import type { NextFunction, Request, Response } from 'express';

import { AvailabilityService } from '../services/AvailabilityService';
import { AppError } from '../../../core/error';
import { sendSuccess } from '../../../core/response';

export class AvailabilityController {
  private readonly availabilityService: AvailabilityService;

  constructor() {
    this.availabilityService = new AvailabilityService();
  }

  public getMySlots = async (
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

      const items = await this.availabilityService.getInterviewerSlots(req.user.userId);
      sendSuccess(res, { items });
    } catch (error: unknown) {
      next(error);
    }
  };

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

      const body = (req.body ?? {}) as {
        roleProfileId?: unknown;
        startTime?: unknown;
        date?: unknown;
        time?: unknown;
        price?: unknown;
      };

      const roleProfileId =
        typeof body.roleProfileId === 'string' && body.roleProfileId.trim().length > 0
          ? body.roleProfileId
          : null;

      const startTimeStr =
        typeof body.startTime === 'string' && body.startTime.trim().length > 0
          ? body.startTime
          : typeof body.date === 'string' &&
              body.date.trim().length > 0 &&
              typeof body.time === 'string' &&
              body.time.trim().length > 0
            ? `${body.date}T${body.time}`
            : '';

      const startDate = new Date(startTimeStr);

      const price =
        typeof body.price === 'number'
          ? body.price
          : typeof body.price === 'string'
            ? Number(body.price)
            : undefined;

      const slot = await this.availabilityService.createSlot(
        req.user.userId,
        roleProfileId,
        startDate,
        price,
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

