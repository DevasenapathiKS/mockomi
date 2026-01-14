"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const models_1 = require("../models");
const types_1 = require("../types");
const errors_1 = require("../utils/errors");
const redis_1 = __importDefault(require("../config/redis"));
const logger_1 = __importDefault(require("../utils/logger"));
const notification_service_1 = __importDefault(require("./notification.service"));
class AdminService {
    async getDashboardStats() {
        // Try cache first
        const cached = await redis_1.default.getJSON('admin:dashboard');
        if (cached) {
            return cached;
        }
        const [totalUsers, activeJobSeekers, activeEmployers, activeInterviewers, pendingInterviewers, totalInterviews, completedInterviews, totalJobs, activeJobs, revenueStats,] = await Promise.all([
            models_1.User.countDocuments(),
            models_1.User.countDocuments({ role: types_1.UserRole.JOB_SEEKER, status: types_1.UserStatus.ACTIVE }),
            models_1.User.countDocuments({ role: types_1.UserRole.EMPLOYER, status: types_1.UserStatus.ACTIVE }),
            models_1.InterviewerProfile.countDocuments({ isApproved: true }),
            models_1.InterviewerProfile.countDocuments({ isApproved: false }),
            models_1.Interview.countDocuments(),
            models_1.Interview.countDocuments({ status: types_1.InterviewStatus.COMPLETED }),
            models_1.Job.countDocuments(),
            models_1.Job.countDocuments({ status: types_1.JobStatus.ACTIVE }),
            this.getRevenueStats(),
        ]);
        const stats = {
            totalUsers,
            activeJobSeekers,
            activeEmployers,
            activeInterviewers,
            pendingInterviewers,
            totalInterviews,
            completedInterviews,
            totalJobs,
            activeJobs,
            ...revenueStats,
        };
        // Cache for 5 minutes
        await redis_1.default.setJSON('admin:dashboard', stats, 300);
        return stats;
    }
    async getRevenueStats() {
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);
        const [totalResult, monthlyResult] = await Promise.all([
            models_1.Payment.aggregate([
                { $match: { status: types_1.PaymentStatus.COMPLETED } },
                { $group: { _id: null, total: { $sum: '$amount' } } },
            ]),
            models_1.Payment.aggregate([
                {
                    $match: {
                        status: types_1.PaymentStatus.COMPLETED,
                        createdAt: { $gte: startOfMonth },
                    },
                },
                { $group: { _id: null, total: { $sum: '$amount' } } },
            ]),
        ]);
        return {
            totalRevenue: (totalResult[0]?.total || 0) / 100, // Convert from paise
            monthlyRevenue: (monthlyResult[0]?.total || 0) / 100,
        };
    }
    async getAllUsers(role, status, page = 1, limit = 10) {
        const query = {};
        if (role)
            query.role = role;
        if (status)
            query.status = status;
        const [users, total] = await Promise.all([
            models_1.User.find(query)
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(limit),
            models_1.User.countDocuments(query),
        ]);
        return {
            users,
            total,
            totalPages: Math.ceil(total / limit),
        };
    }
    async updateUserStatus(userId, status, adminId) {
        const user = await models_1.User.findById(userId);
        if (!user) {
            throw new errors_1.AppError('User not found', 404);
        }
        // Prevent modifying admin users
        if (user.role === types_1.UserRole.ADMIN) {
            throw new errors_1.AppError('Cannot modify admin users', 403);
        }
        user.status = status;
        await user.save();
        // Clear cache
        await redis_1.default.del(`user:${userId}`);
        // Send notification
        let message = '';
        if (status === types_1.UserStatus.ACTIVE) {
            message = 'Your account has been activated.';
        }
        else if (status === types_1.UserStatus.SUSPENDED) {
            message = 'Your account has been suspended. Please contact support.';
        }
        else if (status === types_1.UserStatus.INACTIVE) {
            message = 'Your account has been deactivated.';
        }
        if (message) {
            await notification_service_1.default.createNotification({
                userId,
                type: 'system',
                title: 'Account Status Update',
                message,
            });
        }
        logger_1.default.info(`User status updated: ${userId} to ${status} by admin: ${adminId}`);
        return user;
    }
    async getPendingInterviewers(page = 1, limit = 10) {
        const [interviewers, total] = await Promise.all([
            models_1.InterviewerProfile.find({ isApproved: false })
                .populate('userId', 'firstName lastName email avatar createdAt')
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(limit),
            models_1.InterviewerProfile.countDocuments({ isApproved: false }),
        ]);
        return {
            interviewers,
            total,
            totalPages: Math.ceil(total / limit),
        };
    }
    async approveInterviewer(interviewerId, adminId, isApproved, rejectionReason) {
        const profile = await models_1.InterviewerProfile.findById(interviewerId);
        if (!profile) {
            throw new errors_1.AppError('Interviewer profile not found', 404);
        }
        profile.isApproved = isApproved;
        profile.approvedAt = isApproved ? new Date() : undefined;
        profile.approvedBy = isApproved ? adminId : undefined;
        profile.rejectionReason = !isApproved ? rejectionReason : undefined;
        await profile.save();
        // Update user status
        const user = await models_1.User.findById(profile.userId);
        if (user) {
            user.status = isApproved ? types_1.UserStatus.ACTIVE : types_1.UserStatus.INACTIVE;
            await user.save();
        }
        // Send notification
        await notification_service_1.default.createNotification({
            userId: profile.userId.toString(),
            type: isApproved ? 'interviewer_approved' : 'interviewer_rejected',
            title: isApproved ? 'Profile Approved!' : 'Profile Not Approved',
            message: isApproved
                ? 'Congratulations! Your interviewer profile has been approved. You can now conduct mock interviews.'
                : `Your interviewer profile was not approved. ${rejectionReason || 'Please contact support for more details.'}`,
        });
        logger_1.default.info(`Interviewer ${isApproved ? 'approved' : 'rejected'}: ${interviewerId} by admin: ${adminId}`);
        return profile;
    }
    async getInterviewAnalytics(startDate, endDate) {
        const match = {};
        if (startDate) {
            match.createdAt = { $gte: startDate };
        }
        if (endDate) {
            match.createdAt = { ...match.createdAt, $lte: endDate };
        }
        const analytics = await models_1.Interview.aggregate([
            { $match: match },
            {
                $group: {
                    _id: {
                        date: { $dateToString: { format: '%Y-%m-%d', date: '$scheduledAt' } },
                        status: '$status',
                    },
                    count: { $sum: 1 },
                },
            },
            { $sort: { '_id.date': 1 } },
        ]);
        return analytics;
    }
    async getRevenueAnalytics(startDate, endDate) {
        const match = { status: types_1.PaymentStatus.COMPLETED };
        if (startDate) {
            match.createdAt = { $gte: startDate };
        }
        if (endDate) {
            match.createdAt = { ...match.createdAt, $lte: endDate };
        }
        const analytics = await models_1.Payment.aggregate([
            { $match: match },
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                    total: { $sum: '$amount' },
                    count: { $sum: 1 },
                },
            },
            { $sort: { _id: 1 } },
        ]);
        return analytics.map((item) => ({
            date: item._id,
            revenue: item.total / 100,
            transactions: item.count,
        }));
    }
    async getTopInterviewers(limit = 10) {
        const interviewers = await models_1.InterviewerProfile.find({ isApproved: true })
            .populate('userId', 'firstName lastName email avatar')
            .sort({ interviewsCompleted: -1 })
            .limit(limit);
        return interviewers;
    }
    async getSystemHealth() {
        const [dbStatus, cacheStatus] = await Promise.all([
            this.checkDatabaseHealth(),
            this.checkCacheHealth(),
        ]);
        return {
            database: dbStatus,
            cache: cacheStatus,
            uptime: process.uptime(),
            memoryUsage: process.memoryUsage(),
        };
    }
    async checkDatabaseHealth() {
        const start = Date.now();
        try {
            await models_1.User.findOne().limit(1);
            return {
                status: 'healthy',
                responseTime: Date.now() - start,
            };
        }
        catch {
            return {
                status: 'unhealthy',
                responseTime: Date.now() - start,
            };
        }
    }
    async checkCacheHealth() {
        const start = Date.now();
        try {
            await redis_1.default.set('health-check', 'ok', 10);
            const value = await redis_1.default.get('health-check');
            return {
                status: value === 'ok' ? 'healthy' : 'unhealthy',
                responseTime: Date.now() - start,
            };
        }
        catch {
            return {
                status: 'unhealthy',
                responseTime: Date.now() - start,
            };
        }
    }
}
exports.default = new AdminService();
//# sourceMappingURL=admin.service.js.map