"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InterviewerController = void 0;
const mongoose_1 = require("mongoose");
const InterviewerProfile_1 = require("../models/InterviewerProfile");
const InterviewerService_1 = require("../services/InterviewerService");
const error_1 = require("../../../core/error");
const response_1 = require("../../../core/response");
class InterviewerController {
    constructor() {
        this.getPublicList = async (req, res, next) => {
            try {
                const pageRaw = req.query.page;
                const limitRaw = req.query.limit;
                const sortRaw = req.query.sort;
                const techRaw = req.query.tech;
                const pageStr = typeof pageRaw === 'string'
                    ? pageRaw
                    : Array.isArray(pageRaw) && typeof pageRaw[0] === 'string'
                        ? pageRaw[0]
                        : undefined;
                const limitStr = typeof limitRaw === 'string'
                    ? limitRaw
                    : Array.isArray(limitRaw) && typeof limitRaw[0] === 'string'
                        ? limitRaw[0]
                        : undefined;
                const sort = typeof sortRaw === 'string'
                    ? sortRaw
                    : Array.isArray(sortRaw) && typeof sortRaw[0] === 'string'
                        ? sortRaw[0]
                        : undefined;
                const tech = typeof techRaw === 'string'
                    ? techRaw
                    : Array.isArray(techRaw) && typeof techRaw[0] === 'string'
                        ? techRaw[0]
                        : undefined;
                const page = pageStr ? Number(pageStr) : 1;
                const limit = limitStr ? Number(limitStr) : 10;
                const result = await this.interviewerService.getPublicInterviewers({
                    page,
                    limit,
                    sort,
                    tech,
                });
                (0, response_1.sendSuccess)(res, result);
            }
            catch (error) {
                next(error);
            }
        };
        this.apply = async (req, res, next) => {
            try {
                if (!req.user) {
                    throw new error_1.AppError('Unauthorized', 401);
                }
                if (req.user.role !== 'interviewer') {
                    throw new error_1.AppError('Forbidden', 403);
                }
                const existing = await InterviewerProfile_1.InterviewerProfile.findOne({
                    userId: new mongoose_1.Types.ObjectId(req.user.userId),
                }).exec();
                if (existing) {
                    throw new error_1.AppError('Interviewer profile already exists', 400);
                }
                const { bio, yearsOfExperience, primaryTechStack, linkedinUrl } = req.body;
                const profile = await InterviewerProfile_1.InterviewerProfile.create({
                    userId: new mongoose_1.Types.ObjectId(req.user.userId),
                    bio,
                    yearsOfExperience,
                    primaryTechStack,
                    linkedinUrl,
                    isVerified: false,
                });
                (0, response_1.sendSuccess)(res, profile);
            }
            catch (error) {
                next(error);
            }
        };
        this.verify = async (req, res, next) => {
            try {
                if (!req.user) {
                    throw new error_1.AppError('Unauthorized', 401);
                }
                if (req.user.role !== 'admin') {
                    throw new error_1.AppError('Forbidden', 403);
                }
                const userId = req.params.userId;
                if (!mongoose_1.Types.ObjectId.isValid(userId)) {
                    throw new error_1.AppError('Interviewer profile not found', 404);
                }
                const profile = await InterviewerProfile_1.InterviewerProfile.findOne({
                    userId: new mongoose_1.Types.ObjectId(userId),
                }).exec();
                if (!profile) {
                    throw new error_1.AppError('Interviewer profile not found', 404);
                }
                profile.isVerified = true;
                await profile.save();
                (0, response_1.sendSuccess)(res, profile);
            }
            catch (error) {
                next(error);
            }
        };
        this.interviewerService = new InterviewerService_1.InterviewerService();
    }
}
exports.InterviewerController = InterviewerController;
