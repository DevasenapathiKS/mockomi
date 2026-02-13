import type { NextFunction, Request, Response } from 'express';

import { AuthService } from '../services/AuthService';
import { sendSuccess } from '../../../core/response';
import { AppError } from '../../../core/error';

export class AuthController {
  private readonly authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  public register = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { email, password } = req.body as { email: string; password: string };
      const user = await this.authService.register({ email, password });
      sendSuccess(res, user);
    } catch (error: unknown) {
      next(error);
    }
  };

  public login = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { email, password } = req.body as { email: string; password: string };
      const result = await this.authService.login({ email, password });
      sendSuccess(res, result);
    } catch (error: unknown) {
      next(error);
    }
  };
}

