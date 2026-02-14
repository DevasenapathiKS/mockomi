"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AvailabilityController = void 0;
const AvailabilityService_1 = require("../services/AvailabilityService");
const error_1 = require("../../../core/error");
const response_1 = require("../../../core/response");
class AvailabilityController {
    constructor() {
        this.getMySlots = async (req, res, next) => {
            try {
                if (!req.user) {
                    throw new error_1.AppError('Unauthorized', 401);
                }
                if (req.user.role !== 'interviewer') {
                    throw new error_1.AppError('Forbidden', 403);
                }
                const items = await this.availabilityService.getInterviewerSlots(req.user.userId);
                (0, response_1.sendSuccess)(res, { items });
            }
            catch (error) {
                next(error);
            }
        };
        this.createSlot = async (req, res, next) => {
            try {
                if (!req.user) {
                    throw new error_1.AppError('Unauthorized', 401);
                }
                if (req.user.role !== 'interviewer') {
                    throw new error_1.AppError('Forbidden', 403);
                }
                const body = (req.body ?? {});
                const roleProfileId = typeof body.roleProfileId === 'string' && body.roleProfileId.trim().length > 0
                    ? body.roleProfileId
                    : null;
                const startTimeStr = typeof body.startTime === 'string' && body.startTime.trim().length > 0
                    ? body.startTime
                    : typeof body.date === 'string' &&
                        body.date.trim().length > 0 &&
                        typeof body.time === 'string' &&
                        body.time.trim().length > 0
                        ? `${body.date}T${body.time}`
                        : '';
                const startDate = new Date(startTimeStr);
                const price = typeof body.price === 'number'
                    ? body.price
                    : typeof body.price === 'string'
                        ? Number(body.price)
                        : undefined;
                const slot = await this.availabilityService.createSlot(req.user.userId, roleProfileId, startDate, price);
                (0, response_1.sendSuccess)(res, slot);
            }
            catch (error) {
                next(error);
            }
        };
        this.getPublicSlots = async (req, res, next) => {
            try {
                const interviewerId = req.params.id;
                const pageRaw = req.query.page;
                const limitRaw = req.query.limit;
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
                const page = pageStr ? Number(pageStr) : 1;
                const limit = limitStr ? Number(limitStr) : 10;
                const result = await this.availabilityService.getAvailableSlots(interviewerId, page, limit);
                (0, response_1.sendSuccess)(res, result);
            }
            catch (error) {
                next(error);
            }
        };
        this.availabilityService = new AvailabilityService_1.AvailabilityService();
    }
}
exports.AvailabilityController = AvailabilityController;
