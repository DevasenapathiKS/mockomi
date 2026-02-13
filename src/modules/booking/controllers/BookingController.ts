import type { NextFunction, Request, Response } from 'express';

import { BookingService } from '../services/BookingService';
import { AppError } from '../../../core/error';
import { sendSuccess } from '../../../core/response';

export class BookingController {
  private readonly bookingService: BookingService;

  constructor() {
    this.bookingService = new BookingService();
  }

  public book = async (
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

      const { slotId } = req.body as { slotId: string };

      const session = await this.bookingService.bookSlot(req.user.userId, slotId);

      sendSuccess(res, session);
    } catch (error: unknown) {
      next(error);
    }
  };
}

