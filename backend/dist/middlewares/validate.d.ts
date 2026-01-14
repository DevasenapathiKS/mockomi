import { Request, Response, NextFunction } from 'express';
import { AnyZodObject } from 'zod';
export declare const validate: (schema: AnyZodObject) => (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const validateBody: (schema: AnyZodObject) => (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const validateQuery: (schema: AnyZodObject) => (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const validateParams: (schema: AnyZodObject) => (req: Request, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=validate.d.ts.map