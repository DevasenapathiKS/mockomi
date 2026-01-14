import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthRequest, UserRole } from '../types';
import { User } from '../models';
import config from '../config';
import { AppError } from '../utils/errors';
import logger from '../utils/logger';

interface JwtPayload {
  id: string;
  email: string;
  role: UserRole;
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('No token provided', 401);
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      throw new AppError('No token provided', 401);
    }

    try {
      const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload;
      
      // Verify user still exists and is active
      const user = await User.findById(decoded.id).select('status role');
      
      if (!user) {
        throw new AppError('User no longer exists', 401);
      }

      if (user.status === 'suspended') {
        throw new AppError('Your account has been suspended', 403);
      }

      if (user.status === 'inactive') {
        throw new AppError('Your account is inactive', 403);
      }

      req.user = {
        id: decoded.id,
        email: decoded.email,
        role: decoded.role,
      };

      next();
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new AppError('Token has expired', 401);
      }
      if (error instanceof jwt.JsonWebTokenError) {
        throw new AppError('Invalid token', 401);
      }
      throw error;
    }
  } catch (error) {
    next(error);
  }
};

export const authorize = (...roles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new AppError('Not authenticated', 401));
    }

    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You do not have permission to perform this action', 403)
      );
    }

    next();
  };
};

export const optionalAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      return next();
    }

    try {
      const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload;
      
      req.user = {
        id: decoded.id,
        email: decoded.email,
        role: decoded.role,
      };
    } catch {
      // Invalid token, but continue as unauthenticated
      logger.debug('Optional auth: Invalid token provided');
    }

    next();
  } catch (error) {
    next(error);
  }
};

export const verifyRefreshToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      throw new AppError('Refresh token is required', 400);
    }

    try {
      const decoded = jwt.verify(
        refreshToken,
        config.jwt.refreshSecret
      ) as JwtPayload;

      const user = await User.findById(decoded.id).select('+refreshTokens');

      if (!user) {
        throw new AppError('User not found', 401);
      }

      if (!user.refreshTokens.includes(refreshToken)) {
        throw new AppError('Invalid refresh token', 401);
      }

      req.user = {
        id: decoded.id,
        email: decoded.email,
        role: decoded.role,
      };

      next();
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new AppError('Refresh token has expired', 401);
      }
      if (error instanceof jwt.JsonWebTokenError) {
        throw new AppError('Invalid refresh token', 401);
      }
      throw error;
    }
  } catch (error) {
    next(error);
  }
};

export const requireEmailVerification = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('Not authenticated', 401);
    }

    const user = await User.findById(req.user.id).select('isEmailVerified');

    if (!user) {
      throw new AppError('User not found', 404);
    }

    if (!user.isEmailVerified) {
      throw new AppError('Please verify your email address', 403);
    }

    next();
  } catch (error) {
    next(error);
  }
};

export const requireInterviewerApproval = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('Not authenticated', 401);
    }

    if (req.user.role !== UserRole.INTERVIEWER) {
      return next();
    }

    const { InterviewerProfile } = await import('../models');
    const profile = await InterviewerProfile.findOne({ userId: req.user.id });

    if (!profile) {
      throw new AppError('Interviewer profile not found', 404);
    }

    if (!profile.isApproved) {
      throw new AppError(
        'Your interviewer profile is pending approval',
        403
      );
    }

    next();
  } catch (error) {
    next(error);
  }
};
