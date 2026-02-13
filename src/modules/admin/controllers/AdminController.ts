import type { NextFunction, Request, Response } from 'express';

import { AdminService } from '../services/AdminService';
import { AppError } from '../../../core/error';
import { sendSuccess } from '../../../core/response';

export class AdminController {
  private readonly adminService: AdminService;

  constructor() {
    this.adminService = new AdminService();
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

      if (req.user.role !== 'admin') {
        throw new AppError('Forbidden', 403);
      }

      const dashboard = await this.adminService.getDashboard();
      sendSuccess(res, dashboard);
    } catch (error: unknown) {
      next(error);
    }
  };
}

