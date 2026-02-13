"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionController = void 0;
const SessionControlService_1 = require("../services/SessionControlService");
const RatingService_1 = require("../../rating/services/RatingService");
const error_1 = require("../../../core/error");
const response_1 = require("../../../core/response");
class SessionController {
    constructor() {
        this.start = async (req, res, next) => {
            try {
                if (!req.user) {
                    throw new error_1.AppError('Unauthorized', 401);
                }
                if (req.user.role !== 'interviewer') {
                    throw new error_1.AppError('Forbidden', 403);
                }
                const sessionId = req.params.id;
                const result = await this.sessionControlService.startSession(req.user.userId, sessionId);
                (0, response_1.sendSuccess)(res, result);
            }
            catch (error) {
                next(error);
            }
        };
        this.submitScore = async (req, res, next) => {
            try {
                if (!req.user) {
                    throw new error_1.AppError('Unauthorized', 401);
                }
                if (req.user.role !== 'interviewer') {
                    throw new error_1.AppError('Forbidden', 403);
                }
                const sessionId = req.params.id;
                const { sectionScores } = req.body;
                const result = await this.sessionControlService.submitScores(req.user.userId, sessionId, sectionScores);
                (0, response_1.sendSuccess)(res, result);
            }
            catch (error) {
                next(error);
            }
        };
        this.reschedule = async (req, res, next) => {
            try {
                if (!req.user) {
                    throw new error_1.AppError('Unauthorized', 401);
                }
                if (req.user.role !== 'candidate') {
                    throw new error_1.AppError('Forbidden', 403);
                }
                const sessionId = req.params.id;
                const { newSlotId } = req.body;
                const result = await this.sessionControlService.rescheduleSession(req.user.userId, sessionId, newSlotId);
                (0, response_1.sendSuccess)(res, result);
            }
            catch (error) {
                next(error);
            }
        };
        this.rate = async (req, res, next) => {
            try {
                if (!req.user) {
                    throw new error_1.AppError('Unauthorized', 401);
                }
                if (req.user.role !== 'candidate') {
                    throw new error_1.AppError('Forbidden', 403);
                }
                const sessionId = req.params.id;
                const { rating, comment } = req.body;
                const result = await this.ratingService.submitRating(req.user.userId, sessionId, rating, comment);
                (0, response_1.sendSuccess)(res, result);
            }
            catch (error) {
                next(error);
            }
        };
        this.joinToken = async (req, res, next) => {
            try {
                if (!req.user) {
                    throw new error_1.AppError('Unauthorized', 401);
                }
                if (req.user.role !== 'candidate' && req.user.role !== 'interviewer') {
                    throw new error_1.AppError('Forbidden', 403);
                }
                const result = await this.sessionControlService.createJoinToken(req.user.userId, req.user.role, req.params.id);
                (0, response_1.sendSuccess)(res, result);
            }
            catch (error) {
                next(error);
            }
        };
        this.sessionControlService = new SessionControlService_1.SessionControlService();
        this.ratingService = new RatingService_1.RatingService();
    }
}
exports.SessionController = SessionController;
