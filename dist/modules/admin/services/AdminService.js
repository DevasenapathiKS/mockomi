"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminService = void 0;
const User_1 = require("../../auth/models/User");
const InterviewerProfile_1 = require("../../interviewer/models/InterviewerProfile");
const InterviewSession_1 = require("../../interview/models/InterviewSession");
const PaymentRecord_1 = require("../../payment/models/PaymentRecord");
const SessionRating_1 = require("../../rating/models/SessionRating");
class AdminService {
    async getDashboard() {
        const [totalUsers, totalInterviewers, verifiedInterviewers, totalSessions, completedSessions, scheduledSessions, platformRevenueTotal, interviewerPayoutTotal, averageRating, flaggedInterviewers,] = await Promise.all([
            User_1.User.countDocuments({ role: 'candidate' }).exec(),
            User_1.User.countDocuments({ role: 'interviewer' }).exec(),
            InterviewerProfile_1.InterviewerProfile.countDocuments({ isVerified: true }).exec(),
            InterviewSession_1.InterviewSession.countDocuments({}).exec(),
            InterviewSession_1.InterviewSession.countDocuments({ status: 'completed' }).exec(),
            InterviewSession_1.InterviewSession.countDocuments({ status: 'scheduled' }).exec(),
            PaymentRecord_1.PaymentRecord.aggregate([
                { $match: { status: 'paid' } },
                { $group: { _id: null, total: { $sum: '$platformShare' } } },
            ]).then((r) => r[0]?.total ?? 0),
            PaymentRecord_1.PaymentRecord.aggregate([
                { $match: { status: 'paid' } },
                { $group: { _id: null, total: { $sum: '$interviewerShare' } } },
            ]).then((r) => r[0]?.total ?? 0),
            SessionRating_1.SessionRating.aggregate([
                { $group: { _id: null, avg: { $avg: '$rating' } } },
            ]).then((r) => r[0]?.avg ?? 0),
            InterviewerProfile_1.InterviewerProfile.find({
                isVerified: true,
                isActive: true,
                ratingAverage: { $lt: 3 },
            })
                .sort({ ratingAverage: 1 })
                .limit(10)
                .select('userId ratingAverage totalRatings totalInterviews')
                .lean()
                .exec()
                .then((items) => items.map((i) => ({
                userId: String(i.userId),
                ratingAverage: i.ratingAverage,
                totalRatings: i.totalRatings,
                totalInterviews: i.totalInterviews,
            }))),
        ]);
        return {
            totalUsers,
            totalInterviewers,
            verifiedInterviewers,
            totalSessions,
            completedSessions,
            scheduledSessions,
            platformRevenueTotal,
            interviewerPayoutTotal,
            averageRating,
            flaggedInterviewers,
        };
    }
}
exports.AdminService = AdminService;
