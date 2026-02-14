"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CandidateDashboardController = void 0;
const error_1 = require("../../core/error");
const response_1 = require("../../core/response");
const CandidateDashboardService_1 = require("../../modules/candidate/services/CandidateDashboardService");
class CandidateDashboardController {
    constructor() {
        this.getDashboard = async (req, res, next) => {
            try {
                if (!req.user) {
                    throw new error_1.AppError('Unauthorized', 401);
                }
                if (req.user.role !== 'candidate') {
                    throw new error_1.AppError('Forbidden', 403);
                }
                const candidateId = req.user.userId;
                const dashboard = await this.service.getDashboard(candidateId);
                (0, response_1.sendSuccess)(res, dashboard);
            }
            catch (error) {
                next(error);
            }
        };
        this.service = new CandidateDashboardService_1.CandidateDashboardService();
    }
}
exports.CandidateDashboardController = CandidateDashboardController;
