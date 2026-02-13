"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BookingController = void 0;
const BookingService_1 = require("../services/BookingService");
const error_1 = require("../../../core/error");
const response_1 = require("../../../core/response");
class BookingController {
    constructor() {
        this.book = async (req, res, next) => {
            try {
                if (!req.user) {
                    throw new error_1.AppError('Unauthorized', 401);
                }
                if (req.user.role !== 'candidate') {
                    throw new error_1.AppError('Forbidden', 403);
                }
                const { slotId } = req.body;
                const session = await this.bookingService.bookSlot(req.user.userId, slotId);
                (0, response_1.sendSuccess)(res, session);
            }
            catch (error) {
                next(error);
            }
        };
        this.bookingService = new BookingService_1.BookingService();
    }
}
exports.BookingController = BookingController;
