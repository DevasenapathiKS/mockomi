import { Response } from 'express';
export declare const scheduleInterview: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
export declare const getInterviewById: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
export declare const getMyInterviews: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
export declare const startInterview: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
export declare const completeInterview: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
export declare const cancelInterview: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
export declare const submitFeedback: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
export declare const uploadRecording: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
export declare const getRecordingUrl: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
export declare const checkPaymentRequired: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
export declare const getAvailableInterviewers: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
export declare const getInterviewerEarnings: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
export declare const createPaymentOrder: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
export declare const verifyPayment: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
/**
 * Job seeker creates an interview request with selected skills only.
 */
export declare const createInterviewRequest: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
/**
 * Get interview requests for a job seeker (pending/expired).
 */
export declare const getMyInterviewRequests: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
/**
 * Interviewers get available interview requests matching their expertise.
 */
export declare const getAvailableInterviewRequests: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
/**
 * Interviewer claims an interview request and sets the schedule.
 */
export declare const claimInterviewRequest: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
//# sourceMappingURL=interview.controller.d.ts.map