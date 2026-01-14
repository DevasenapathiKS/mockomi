import { Response, NextFunction } from 'express';
export declare const register: (req: import("express").Request, res: Response, next: NextFunction) => void;
export declare const login: (req: import("express").Request, res: Response, next: NextFunction) => void;
export declare const refreshToken: (req: import("express").Request, res: Response, next: NextFunction) => void;
export declare const logout: (req: import("express").Request, res: Response, next: NextFunction) => void;
export declare const logoutAll: (req: import("express").Request, res: Response, next: NextFunction) => void;
export declare const changePassword: (req: import("express").Request, res: Response, next: NextFunction) => void;
export declare const getMe: (req: import("express").Request, res: Response, next: NextFunction) => void;
export declare const forgotPassword: (req: import("express").Request, res: Response, next: NextFunction) => void;
export declare const resetPassword: (req: import("express").Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=auth.controller.d.ts.map