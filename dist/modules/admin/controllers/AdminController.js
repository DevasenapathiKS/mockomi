"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminController = void 0;
const AdminService_1 = require("../services/AdminService");
const error_1 = require("../../../core/error");
const response_1 = require("../../../core/response");
class AdminController {
    constructor() {
        this.getDashboard = async (req, res, next) => {
            try {
                if (!req.user) {
                    throw new error_1.AppError('Unauthorized', 401);
                }
                if (req.user.role !== 'admin') {
                    throw new error_1.AppError('Forbidden', 403);
                }
                const dashboard = await this.adminService.getDashboard();
                (0, response_1.sendSuccess)(res, dashboard);
            }
            catch (error) {
                next(error);
            }
        };
        this.adminService = new AdminService_1.AdminService();
    }
}
exports.AdminController = AdminController;
