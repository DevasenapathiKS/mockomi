import { Response, NextFunction } from 'express';
import { AuthRequest, UserRole } from '../types';
export declare const authenticate: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const authorize: (...roles: UserRole[]) => (req: AuthRequest, res: Response, next: NextFunction) => void;
export declare const optionalAuth: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const verifyRefreshToken: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const requireEmailVerification: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const requireInterviewerApproval: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=auth.d.ts.map