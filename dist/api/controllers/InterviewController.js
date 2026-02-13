"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InterviewController = void 0;
const InterviewService_1 = require("../../modules/interview/services/InterviewService");
const InterviewSession_1 = require("../../modules/interview/models/InterviewSession");
const response_1 = require("../../core/response");
const error_1 = require("../../core/error");
class InterviewController {
    constructor() {
        this.getList = async (req, res, next) => {
            try {
                if (!req.user) {
                    throw new error_1.AppError('Unauthorized', 401);
                }
                const candidateId = req.user.userId;
                const pageRaw = req.query.page;
                const limitRaw = req.query.limit;
                const pageStr = (() => {
                    if (typeof pageRaw === 'string')
                        return pageRaw;
                    if (Array.isArray(pageRaw) && typeof pageRaw[0] === 'string')
                        return pageRaw[0];
                    return '1';
                })();
                const limitStr = (() => {
                    if (typeof limitRaw === 'string')
                        return limitRaw;
                    if (Array.isArray(limitRaw) && typeof limitRaw[0] === 'string')
                        return limitRaw[0];
                    return '10';
                })();
                const page = Number(pageStr);
                const limit = Number(limitStr);
                if (!Number.isInteger(page) || page < 1) {
                    throw new error_1.AppError('Invalid page', 400);
                }
                if (!Number.isInteger(limit) || limit < 1 || limit > 50) {
                    throw new error_1.AppError('Invalid limit', 400);
                }
                const result = await this.interviewService.getCandidateSessionsList(candidateId, page, limit);
                (0, response_1.sendSuccess)(res, result);
            }
            catch (error) {
                next(error);
            }
        };
        this.getHistory = async (req, res, next) => {
            try {
                if (!req.user) {
                    throw new error_1.AppError('Unauthorized', 401);
                }
                const candidateId = req.user.userId;
                const pageRaw = req.query.page;
                const limitRaw = req.query.limit;
                const pageStr = (() => {
                    if (typeof pageRaw === 'string')
                        return pageRaw;
                    if (Array.isArray(pageRaw) && typeof pageRaw[0] === 'string') {
                        return pageRaw[0];
                    }
                    return '1';
                })();
                const limitStr = (() => {
                    if (typeof limitRaw === 'string')
                        return limitRaw;
                    if (Array.isArray(limitRaw) && typeof limitRaw[0] === 'string') {
                        return limitRaw[0];
                    }
                    return '10';
                })();
                const page = Number(pageStr);
                const limit = Number(limitStr);
                if (!Number.isInteger(page) || page < 1) {
                    throw new error_1.AppError('Invalid page', 400);
                }
                if (!Number.isInteger(limit) || limit < 1 || limit > 50) {
                    throw new error_1.AppError('Invalid limit', 400);
                }
                const result = await this.interviewService.getInterviewHistory(candidateId, page, limit);
                (0, response_1.sendSuccess)(res, result);
            }
            catch (error) {
                next(error);
            }
        };
        this.startInterview = async (req, res, next) => {
            try {
                if (!req.user) {
                    throw new error_1.AppError("Unauthorized", 401);
                }
                const candidateId = req.user.userId;
                const { roleProfileId, level } = req.body;
                const session = await this.interviewService.startInterview({
                    candidateId,
                    roleProfileId,
                    level,
                });
                (0, response_1.sendSuccess)(res, session);
            }
            catch (error) {
                next(error);
            }
        };
        this.completeInterview = async (req, res, next) => {
            try {
                const sessionId = req.params.id;
                const { sectionScores } = req.body;
                const result = await this.interviewService.completeInterview({
                    sessionId,
                    sectionScores,
                });
                (0, response_1.sendSuccess)(res, result);
            }
            catch (error) {
                next(error);
            }
        };
        this.getInterview = async (req, res, next) => {
            try {
                const sessionId = req.params.id;
                const session = await InterviewSession_1.InterviewSession.findById(sessionId).exec();
                if (!session) {
                    throw new error_1.AppError('Session not found', 404);
                }
                (0, response_1.sendSuccess)(res, session);
            }
            catch (error) {
                next(error);
            }
        };
        this.interviewService = new InterviewService_1.InterviewService();
    }
}
exports.InterviewController = InterviewController;
