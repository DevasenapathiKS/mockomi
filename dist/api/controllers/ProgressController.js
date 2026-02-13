"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProgressController = void 0;
const mongoose_1 = require("mongoose");
const CandidateProgress_1 = require("../../modules/progress/models/CandidateProgress");
const response_1 = require("../../core/response");
const error_1 = require("../../core/error");
class ProgressController {
    constructor() {
        this.getProgress = async (req, res, next) => {
            try {
                if (!req.user) {
                    throw new error_1.AppError("Unauthorized", 401);
                }
                const candidateId = req.user.userId;
                const { roleProfileId } = req.params;
                if (!mongoose_1.Types.ObjectId.isValid(roleProfileId)) {
                    throw new error_1.AppError("Progress not found", 404);
                }
                const progress = await CandidateProgress_1.CandidateProgress.findOne({
                    candidateId,
                    roleProfileId: new mongoose_1.Types.ObjectId(roleProfileId),
                }).exec();
                if (!progress) {
                    throw new error_1.AppError("Progress not found", 404);
                }
                const delta = progress.improvementDelta;
                const totalSessions = progress.totalSessions;
                let trend;
                let message;
                if (totalSessions === 1) {
                    trend = "baseline";
                    message =
                        "This is your first benchmark score. Continue practicing to improve.";
                }
                else if (delta > 0) {
                    trend = "improving";
                    message = `You improved by ${delta} points since your last interview.`;
                }
                else if (delta < 0) {
                    trend = "declining";
                    message = `Your score decreased by ${Math.abs(delta)} points. Review your weakest section carefully.`;
                }
                else {
                    trend = "stable";
                    message =
                        "Your performance remained consistent. Push further to improve.";
                }
                (0, response_1.sendSuccess)(res, {
                    ...progress.toObject(),
                    growthSignal: {
                        trend,
                        delta,
                        message,
                    },
                });
            }
            catch (error) {
                next(error);
            }
        };
    }
}
exports.ProgressController = ProgressController;
