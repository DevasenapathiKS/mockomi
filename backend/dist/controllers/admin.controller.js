"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSystemHealth = exports.getTopInterviewers = exports.getRevenueAnalytics = exports.getInterviewAnalytics = exports.initiateRefund = exports.getPaymentStats = exports.getAllPayments = exports.approveInterviewer = exports.getPendingInterviewers = exports.updateUserStatus = exports.getAllUsers = exports.getDashboard = void 0;
const services_1 = require("../services");
const errorHandler_1 = require("../middlewares/errorHandler");
exports.getDashboard = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const stats = await services_1.adminService.getDashboardStats();
    res.status(200).json({
        success: true,
        data: stats,
    });
});
exports.getAllUsers = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { page, limit, role, status } = req.query;
    const result = await services_1.adminService.getAllUsers(role, status, Number(page) || 1, Number(limit) || 10);
    res.status(200).json({
        success: true,
        data: result.users,
        pagination: {
            total: result.total,
            totalPages: result.totalPages,
            page: Number(page) || 1,
            limit: Number(limit) || 10,
        },
    });
});
exports.updateUserStatus = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const user = await services_1.adminService.updateUserStatus(req.params.id, req.body.status, req.user.id);
    res.status(200).json({
        success: true,
        message: 'User status updated',
        data: user,
    });
});
exports.getPendingInterviewers = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { page, limit } = req.query;
    const result = await services_1.adminService.getPendingInterviewers(Number(page) || 1, Number(limit) || 10);
    res.status(200).json({
        success: true,
        data: result.interviewers,
        total: result.total,
        totalPages: result.totalPages,
    });
});
exports.approveInterviewer = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const profile = await services_1.adminService.approveInterviewer(req.params.id, req.user.id, req.body.isApproved, req.body.rejectionReason);
    res.status(200).json({
        success: true,
        message: req.body.isApproved ? 'Interviewer approved' : 'Interviewer rejected',
        data: profile,
    });
});
exports.getAllPayments = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { page, limit, status } = req.query;
    const result = await services_1.paymentService.getAllPayments(status, { page: Number(page) || 1, limit: Number(limit) || 10 });
    res.status(200).json({
        success: true,
        data: result.payments,
        pagination: result.pagination,
    });
});
exports.getPaymentStats = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const stats = await services_1.paymentService.getPaymentStats();
    res.status(200).json({
        success: true,
        data: stats,
    });
});
exports.initiateRefund = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const refund = await services_1.paymentService.initiateRefund(req.params.id, req.user.id);
    res.status(200).json({
        success: true,
        message: 'Refund initiated',
        data: refund,
    });
});
exports.getInterviewAnalytics = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { startDate, endDate } = req.query;
    const analytics = await services_1.adminService.getInterviewAnalytics(startDate ? new Date(startDate) : undefined, endDate ? new Date(endDate) : undefined);
    res.status(200).json({
        success: true,
        data: analytics,
    });
});
exports.getRevenueAnalytics = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { startDate, endDate } = req.query;
    const analytics = await services_1.adminService.getRevenueAnalytics(startDate ? new Date(startDate) : undefined, endDate ? new Date(endDate) : undefined);
    res.status(200).json({
        success: true,
        data: analytics,
    });
});
exports.getTopInterviewers = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { limit } = req.query;
    const interviewers = await services_1.adminService.getTopInterviewers(Number(limit) || 10);
    res.status(200).json({
        success: true,
        data: interviewers,
    });
});
exports.getSystemHealth = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const health = await services_1.adminService.getSystemHealth();
    res.status(200).json({
        success: true,
        data: health,
    });
});
//# sourceMappingURL=admin.controller.js.map