import type { RequestHandler } from 'express';

import { AuthService, type AuthTokenPayload } from '../modules/auth/services/AuthService';
import { AppError } from './error';

type RequestUser = Pick<AuthTokenPayload, 'userId' | 'role'>;

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: RequestUser;
    }
  }
}

const authService = new AuthService();

export const authenticate: RequestHandler = (req, _res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header) {
      next(new AppError('Unauthorized', 401));
      return;
    }

    const [scheme, token] = header.split(' ');
    if (scheme !== 'Bearer' || !token) {
      next(new AppError('Unauthorized', 401));
      return;
    }

    const decoded = authService.verifyToken(token);
    req.user = { userId: decoded.userId, role: decoded.role };

    next();
  } catch (_error: unknown) {
    next(new AppError('Unauthorized', 401));
  }
};

