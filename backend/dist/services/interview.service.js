"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const models_1 = require("../models");
const types_1 = require("../types");
const errors_1 = require("../utils/errors");
const config_1 = __importDefault(require("../config"));
const logger_1 = __importDefault(require("../utils/logger"));
const mongoose_1 = require("mongoose");
// import paymentService from './payment.service';
const s3_service_1 = __importDefault(require("./s3.service"));
const notification_service_1 = __importDefault(require("./notification.service"));
const coupon_service_1 = __importDefault(require("./coupon.service"));
class InterviewService {
    async validateCompletedPayment(paymentId, userId) {
        const payment = await models_1.Payment.findById(paymentId);
        if (!payment) {
            throw new errors_1.AppError('Payment not found', 404);
        }
        if (payment.userId.toString() !== userId) {
            throw new errors_1.AppError('Payment does not belong to this user', 403);
        }
        if (payment.status !== types_1.PaymentStatus.COMPLETED) {
            throw new errors_1.AppError('Payment not completed', 400);
        }
        if (payment.amount < config_1.default.interview.pricePaise) {
            throw new errors_1.AppError('Payment amount is insufficient', 400);
        }
        return payment;
    }
    async scheduleInterview(data) {
        const { jobSeekerId, interviewerId, scheduledAt, duration = 60, topic, paymentId } = data;
        // Check if interviewer is approved
        const interviewer = await models_1.InterviewerProfile.findOne({ userId: interviewerId });
        if (!interviewer || !interviewer.isApproved) {
            throw new errors_1.AppError('Interviewer not found or not approved', 400);
        }
        // Check job seeker's interview stats
        const jobSeekerProfile = await models_1.JobSeekerProfile.findOne({ userId: jobSeekerId });
        if (!jobSeekerProfile) {
            throw new errors_1.AppError('Job seeker profile not found', 404);
        }
        // Check if payment is required
        const freeInterviewsUsed = jobSeekerProfile.interviewStats.freeInterviewsUsed;
        const needsPayment = freeInterviewsUsed >= config_1.default.interview.freeInterviews;
        const payment = needsPayment && paymentId
            ? await this.validateCompletedPayment(paymentId, jobSeekerId)
            : null;
        if (needsPayment && !paymentId) {
            throw new errors_1.AppError('Payment required for this interview', 402);
        }
        // Check for conflicting interviews
        const conflictingInterview = await models_1.Interview.findOne({
            $or: [{ jobSeekerId }, { interviewerId }],
            scheduledAt: {
                $gte: new Date(scheduledAt.getTime() - duration * 60000),
                $lte: new Date(scheduledAt.getTime() + duration * 60000),
            },
            status: { $in: [types_1.InterviewStatus.SCHEDULED, types_1.InterviewStatus.IN_PROGRESS] },
        });
        if (conflictingInterview) {
            throw new errors_1.AppError('Time slot is not available', 409);
        }
        // Create interview
        const interview = await models_1.Interview.create({
            jobSeekerId,
            interviewerId,
            scheduledAt,
            duration,
            topic,
            status: types_1.InterviewStatus.SCHEDULED,
            type: 'mock',
            isPaid: !!payment || !needsPayment,
            payment: payment?._id,
        });
        // Update payment reference and free interview usage
        if (payment) {
            payment.interviewId = interview._id;
            await payment.save();
        }
        else if (!needsPayment) {
            jobSeekerProfile.interviewStats.freeInterviewsUsed += 1;
            await jobSeekerProfile.save();
        }
        // Send notifications
        await notification_service_1.default.createNotification({
            userId: jobSeekerId,
            type: 'interview_scheduled',
            title: 'Interview Scheduled',
            message: `Your mock interview has been scheduled for ${scheduledAt.toLocaleString()}`,
            data: { interviewId: interview._id },
        });
        await notification_service_1.default.createNotification({
            userId: interviewerId,
            type: 'interview_scheduled',
            title: 'New Interview Assigned',
            message: `You have a new mock interview scheduled for ${scheduledAt.toLocaleString()}`,
            data: { interviewId: interview._id },
        });
        logger_1.default.info(`Interview scheduled: ${interview._id}`);
        return interview;
    }
    async getInterviewById(interviewId, userId) {
        const interview = await models_1.Interview.findById(interviewId)
            .populate('jobSeekerId', 'firstName lastName email avatar')
            .populate('interviewerId', 'firstName lastName email avatar');
        if (!interview) {
            throw new errors_1.AppError('Interview not found', 404);
        }
        // Check access
        const isParticipant = interview.jobSeekerId._id.toString() === userId ||
            interview.interviewerId._id.toString() === userId;
        if (!isParticipant) {
            throw new errors_1.AppError('Access denied', 403);
        }
        return interview;
    }
    async getJobSeekerInterviews(jobSeekerId, status, pagination = {}) {
        const { page = 1, limit = 10, sort = 'scheduledAt', order = 'asc' } = pagination;
        const query = { jobSeekerId };
        if (status) {
            query.status = status;
        }
        const total = await models_1.Interview.countDocuments(query);
        const totalPages = Math.ceil(total / limit);
        const interviews = await models_1.Interview.find(query)
            .populate('interviewerId', 'firstName lastName email avatar')
            .sort({ [sort]: order === 'asc' ? 1 : -1 })
            .skip((page - 1) * limit)
            .limit(limit);
        return {
            interviews,
            pagination: {
                page,
                limit,
                total,
                totalPages,
                hasNext: page < totalPages,
                hasPrev: page > 1,
            },
        };
    }
    async getInterviewerInterviews(interviewerId, status, pagination = {}) {
        const { page = 1, limit = 10, sort = 'scheduledAt', order = 'desc' } = pagination;
        const query = { interviewerId };
        if (status) {
            query.status = status;
        }
        const total = await models_1.Interview.countDocuments(query);
        const totalPages = Math.ceil(total / limit);
        const interviews = await models_1.Interview.find(query)
            .populate('jobSeekerId', 'firstName lastName email avatar')
            .sort({ [sort]: order === 'asc' ? 1 : -1 })
            .skip((page - 1) * limit)
            .limit(limit);
        return {
            interviews,
            pagination: {
                page,
                limit,
                total,
                totalPages,
                hasNext: page < totalPages,
                hasPrev: page > 1,
            },
        };
    }
    async getInterviewerEarnings(interviewerId, period) {
        const matchInterview = { interviewerId: new mongoose_1.Types.ObjectId(interviewerId) };
        const now = new Date();
        const startOf = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
        const startOfWeek = (d) => {
            const day = d.getDay();
            const diff = d.getDate() - day + (day === 0 ? -6 : 1);
            return new Date(d.setDate(diff));
        };
        if (period && period !== 'all') {
            switch (period) {
                case 'this_week':
                    matchInterview.createdAt = { $gte: startOfWeek(new Date(now)) };
                    break;
                case 'this_month':
                    matchInterview.createdAt = { $gte: new Date(now.getFullYear(), now.getMonth(), 1) };
                    break;
                case 'last_month':
                    matchInterview.createdAt = {
                        $gte: new Date(now.getFullYear(), now.getMonth() - 1, 1),
                        $lt: new Date(now.getFullYear(), now.getMonth(), 1),
                    };
                    break;
                case 'this_year':
                    matchInterview.createdAt = { $gte: new Date(now.getFullYear(), 0, 1) };
                    break;
                default:
                    break;
            }
        }
        // Join payments with interviews to ensure interviewer match
        const payments = await models_1.Payment.aggregate([
            {
                $lookup: {
                    from: 'interviews',
                    localField: 'interviewId',
                    foreignField: '_id',
                    as: 'interview',
                },
            },
            { $unwind: '$interview' },
            { $match: { 'interview.interviewerId': new mongoose_1.Types.ObjectId(interviewerId), ...(matchInterview.createdAt ? { 'interview.createdAt': matchInterview.createdAt } : {}) } },
            {
                $project: {
                    amount: 1,
                    status: 1,
                    createdAt: 1,
                    interview: 1,
                },
            },
        ]);
        let totalEarnings = 0;
        let pendingAmount = 0;
        let paidAmount = 0;
        const earnings = [];
        for (const p of payments) {
            if (p.status === types_1.PaymentStatus.COMPLETED) {
                paidAmount += p.amount;
                totalEarnings += p.amount;
            }
            else if (p.status === types_1.PaymentStatus.PENDING || p.status === types_1.PaymentStatus.PROCESSING) {
                pendingAmount += p.amount;
            }
            earnings.push({
                id: p._id.toString(),
                interviewId: p.interview._id.toString(),
                candidateName: p.interview.jobSeekerId?.toString?.() || 'Candidate',
                date: p.interview.scheduledAt ? p.interview.scheduledAt.toISOString() : p.createdAt.toISOString(),
                duration: p.interview.duration || 60,
                amount: Math.round(p.amount / 100),
                status: p.status === types_1.PaymentStatus.COMPLETED ? 'paid' : p.status === types_1.PaymentStatus.PENDING ? 'pending' : 'processing',
                type: 'mock',
            });
        }
        const totalInterviews = await models_1.Interview.countDocuments(matchInterview);
        return {
            earnings,
            stats: {
                totalEarnings: Math.round(totalEarnings / 100),
                pendingAmount: Math.round(pendingAmount / 100),
                paidAmount: Math.round(paidAmount / 100),
                totalInterviews,
            },
        };
    }
    async ensureMeetingUrl(interview, creatorId) {
        if (interview.meetingUrl) {
            return interview.meetingUrl;
        }
        try {
            const response = await fetch(`${config_1.default.vc.baseUrl.replace(/\/$/, '')}/meetings`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    createdBy: creatorId,
                    title: `Interview ${interview._id}`,
                }),
            });
            if (!response.ok) {
                throw new Error(`VC service responded ${response.status}`);
            }
            const data = (await response.json());
            console.log('data', data);
            const url = data.meetingUrl || data.url;
            console.log('url', url);
            if (url) {
                interview.meetingUrl = url;
                await interview.save();
                return url;
            }
        }
        catch (err) {
            logger_1.default.warn('Failed to generate meeting URL from VC service', err);
        }
        // Fallback to panel link
        const base = config_1.default.frontend.url.replace(/\/$/, '');
        const fallback = `${base}/dashboard/interviews/${interview._id}/panel`;
        interview.panelUrl = fallback;
        await interview.save();
        return fallback;
    }
    async startInterview(interviewId, interviewerId) {
        const interview = await models_1.Interview.findOne({
            _id: interviewId,
            interviewerId,
            status: types_1.InterviewStatus.SCHEDULED,
        });
        if (!interview) {
            throw new errors_1.AppError('Interview not found or cannot be started', 404);
        }
        await this.ensureMeetingUrl(interview, interviewerId);
        interview.status = types_1.InterviewStatus.IN_PROGRESS;
        await interview.save();
        return interview;
    }
    async completeInterview(interviewId, interviewerId) {
        const interview = await models_1.Interview.findOne({
            _id: interviewId,
            interviewerId,
            status: types_1.InterviewStatus.IN_PROGRESS,
        });
        if (!interview) {
            throw new errors_1.AppError('Interview not found or cannot be completed', 404);
        }
        interview.status = types_1.InterviewStatus.COMPLETED;
        await interview.save();
        // Update interviewer stats
        await models_1.InterviewerProfile.findOneAndUpdate({ userId: interviewerId }, { $inc: { interviewsCompleted: 1 } });
        // Update job seeker stats
        await models_1.JobSeekerProfile.findOneAndUpdate({ userId: interview.jobSeekerId }, { $inc: { 'interviewStats.totalInterviews': 1 } });
        // Send notification
        await notification_service_1.default.createNotification({
            userId: interview.jobSeekerId.toString(),
            type: 'interview_completed',
            title: 'Interview Completed',
            message: 'Your mock interview has been completed. Feedback will be available soon.',
            data: { interviewId: interview._id },
        });
        return interview;
    }
    async cancelInterview(interviewId, userId, reason) {
        const interview = await models_1.Interview.findOne({
            _id: interviewId,
            $or: [{ jobSeekerId: userId }, { interviewerId: userId }],
            status: types_1.InterviewStatus.SCHEDULED,
        });
        if (!interview) {
            throw new errors_1.AppError('Interview not found or cannot be cancelled', 404);
        }
        interview.status = types_1.InterviewStatus.CANCELLED;
        await interview.save();
        // Notify the other party
        const notifyUserId = interview.jobSeekerId.toString() === userId
            ? interview.interviewerId.toString()
            : interview.jobSeekerId.toString();
        const scheduledInfo = interview.scheduledAt
            ? `scheduled for ${interview.scheduledAt.toLocaleString()}`
            : '';
        await notification_service_1.default.createNotification({
            userId: notifyUserId,
            type: 'interview_cancelled',
            title: 'Interview Cancelled',
            message: `The mock interview ${scheduledInfo} has been cancelled.`.replace('  ', ' '),
            data: { interviewId: interview._id, reason },
        });
        return interview;
    }
    async submitFeedback(interviewId, interviewerId, feedback) {
        const interview = await models_1.Interview.findOne({
            _id: interviewId,
            interviewerId,
            status: { $in: [types_1.InterviewStatus.IN_PROGRESS, types_1.InterviewStatus.COMPLETED] },
        });
        if (!interview) {
            throw new errors_1.AppError('Interview not found or feedback cannot be submitted', 404);
        }
        if (interview.feedback) {
            throw new errors_1.AppError('Feedback has already been submitted', 400);
        }
        interview.feedback = {
            ...feedback,
            submittedAt: new Date(),
        };
        // If still in progress, mark as completed upon feedback submission
        if (interview.status === types_1.InterviewStatus.IN_PROGRESS) {
            interview.status = types_1.InterviewStatus.COMPLETED;
        }
        await interview.save();
        // Update job seeker's average rating
        const jobSeekerInterviews = await models_1.Interview.find({
            jobSeekerId: interview.jobSeekerId,
            status: types_1.InterviewStatus.COMPLETED,
            'feedback.rating': { $exists: true },
        });
        const totalRating = jobSeekerInterviews.reduce((sum, i) => sum + (i.feedback?.rating || 0), 0);
        const averageRating = totalRating / jobSeekerInterviews.length;
        await models_1.JobSeekerProfile.findOneAndUpdate({ userId: interview.jobSeekerId }, { 'interviewStats.averageRating': averageRating });
        // Update interviewer's rating
        const interviewerInterviews = await models_1.Interview.find({
            interviewerId,
            status: types_1.InterviewStatus.COMPLETED,
            'feedback.rating': { $exists: true },
        });
        // This is actually candidate's rating, but we track it for the interviewer too
        await models_1.InterviewerProfile.findOneAndUpdate({ userId: interviewerId }, {
            'rating.count': interviewerInterviews.length,
        });
        // Notify job seeker
        await notification_service_1.default.createNotification({
            userId: interview.jobSeekerId.toString(),
            type: 'feedback_received',
            title: 'Feedback Received',
            message: `You received feedback for your mock interview. Rating: ${feedback.rating}/5`,
            data: { interviewId: interview._id },
        });
        return interview;
    }
    async uploadRecording(interviewId, interviewerId, file, fileName, mimeType) {
        const interview = await models_1.Interview.findOne({
            _id: interviewId,
            interviewerId,
        });
        if (!interview) {
            throw new errors_1.AppError('Interview not found', 404);
        }
        // Upload to S3
        const s3Key = `interviews/${interviewId}/${fileName}`;
        const { url } = await s3_service_1.default.uploadFile(file, s3Key, mimeType, config_1.default.aws.s3VideoBucket);
        interview.videoRecording = {
            url,
            s3Key,
            duration: 0, // Will be updated later
            size: file.length,
            uploadedAt: new Date(),
        };
        await interview.save();
        return interview;
    }
    async getRecordingUrl(interviewId, userId) {
        const interview = await models_1.Interview.findById(interviewId);
        if (!interview) {
            throw new errors_1.AppError('Interview not found', 404);
        }
        // Check access
        const isParticipant = interview.jobSeekerId.toString() === userId ||
            interview.interviewerId.toString() === userId;
        if (!isParticipant) {
            throw new errors_1.AppError('Access denied', 403);
        }
        if (!interview.videoRecording?.s3Key) {
            throw new errors_1.AppError('No recording available', 404);
        }
        // Generate signed URL (valid for 1 hour)
        const signedUrl = await s3_service_1.default.getSignedUrl(interview.videoRecording.s3Key, config_1.default.aws.s3VideoBucket, 3600);
        return signedUrl;
    }
    async checkPaymentRequired(jobSeekerId) {
        // Payment is always required unless a valid coupon is used
        // Coupon validation happens during interview creation
        return {
            required: true,
            pricePerInterview: config_1.default.interview.pricePaise / 100, // Convert to rupees
        };
    }
    async getAvailableInterviewers(expertise, date) {
        const query = { isApproved: true };
        if (expertise && expertise.length > 0) {
            query.expertise = { $in: expertise };
        }
        const interviewers = await models_1.InterviewerProfile.find(query)
            .populate('userId', 'firstName lastName email avatar')
            .sort({ 'rating.average': -1 });
        return interviewers;
    }
    // ==================== NEW INTERVIEW REQUEST/CLAIM FLOW ====================
    /**
     * Job seeker creates an interview request with required skills only.
     * No interviewer or time is selected at this stage.
     * Supports coupon-based free interviews.
     */
    async createInterviewRequest(data) {
        const { jobSeekerId, requestedSkills, preferredDuration = 60, notes, paymentId, couponCode } = data;
        if (!requestedSkills || requestedSkills.length === 0) {
            throw new errors_1.AppError('At least one skill must be selected', 400);
        }
        // Check job seeker profile exists
        const jobSeekerProfile = await models_1.JobSeekerProfile.findOne({ userId: jobSeekerId });
        if (!jobSeekerProfile) {
            throw new errors_1.AppError('Job seeker profile not found', 404);
        }
        let payment = null;
        let couponApplied = false;
        // Handle coupon if provided
        if (couponCode) {
            try {
                // Apply coupon (this validates and increments usage atomically)
                await coupon_service_1.default.applyCoupon(couponCode, jobSeekerId);
                couponApplied = true;
                logger_1.default.info(`Coupon ${couponCode} applied for interview request by user ${jobSeekerId}`);
            }
            catch (error) {
                throw new errors_1.AppError(error.message || 'Invalid or expired coupon', 400);
            }
        }
        // If no coupon, payment is required
        if (!couponApplied) {
            if (!paymentId) {
                throw new errors_1.AppError('Payment required for this interview. Apply a coupon or complete payment.', 402);
            }
            payment = await this.validateCompletedPayment(paymentId, jobSeekerId);
        }
        // Set expiry date (e.g., 7 days from now)
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);
        // Create interview request
        const interview = await models_1.Interview.create({
            jobSeekerId,
            interviewerId: null,
            scheduledAt: null,
            duration: preferredDuration,
            requestedSkills,
            preferredDuration,
            notes,
            status: types_1.InterviewStatus.REQUESTED,
            type: 'mock',
            isPaid: !!payment || couponApplied,
            payment: payment?._id,
            expiresAt,
        });
        logger_1.default.info(`Interview request created: ${interview._id} with skills: ${requestedSkills.join(', ')}${couponApplied ? ` (Coupon: ${couponCode})` : ''}`);
        // Update payment reference if payment was made
        if (payment) {
            payment.interviewId = interview._id;
            await payment.save();
        }
        // Notify matching interviewers
        const matchingInterviewers = await models_1.InterviewerProfile.find({
            isApproved: true,
            expertise: { $in: requestedSkills },
        });
        for (const interviewer of matchingInterviewers) {
            await notification_service_1.default.createNotification({
                userId: interviewer.userId.toString(),
                type: 'new_interview_request',
                title: 'New Interview Request Available',
                message: `A new interview request matching your expertise (${requestedSkills.join(', ')}) is available.`,
                data: { interviewId: interview._id },
            });
        }
        return interview;
    }
    /**
     * Get available interview requests for an interviewer based on their expertise.
     * Only returns unclaimed (REQUESTED) interviews that match interviewer's skills.
     */
    async getAvailableRequests(interviewerId, pagination = {}) {
        const { page = 1, limit = 10, sort = 'createdAt', order = 'desc' } = pagination;
        // Get interviewer's expertise
        const interviewer = await models_1.InterviewerProfile.findOne({ userId: interviewerId });
        if (!interviewer || !interviewer.isApproved) {
            throw new errors_1.AppError('Interviewer not found or not approved', 400);
        }
        const interviewerExpertise = interviewer.expertise || [];
        if (interviewerExpertise.length === 0) {
            return {
                interviews: [],
                pagination: {
                    page,
                    limit,
                    total: 0,
                    totalPages: 0,
                    hasNext: false,
                    hasPrev: false,
                },
            };
        }
        // Find unclaimed requests matching interviewer's expertise
        const query = {
            status: types_1.InterviewStatus.REQUESTED,
            interviewerId: null,
            requestedSkills: { $in: interviewerExpertise },
            expiresAt: { $gt: new Date() }, // Not expired
        };
        const total = await models_1.Interview.countDocuments(query);
        const totalPages = Math.ceil(total / limit);
        const interviews = await models_1.Interview.find(query)
            .populate('jobSeekerId', 'firstName lastName email avatar')
            .sort({ [sort]: order === 'asc' ? 1 : -1 })
            .skip((page - 1) * limit)
            .limit(limit);
        return {
            interviews,
            pagination: {
                page,
                limit,
                total,
                totalPages,
                hasNext: page < totalPages,
                hasPrev: page > 1,
            },
        };
    }
    /**
     * Interviewer claims an interview request and sets the schedule.
     * This transitions the interview from REQUESTED to SCHEDULED.
     */
    async claimInterview(data) {
        const { interviewId, interviewerId, scheduledAt, duration } = data;
        // Check if interviewer is approved
        const interviewer = await models_1.InterviewerProfile.findOne({ userId: interviewerId });
        if (!interviewer || !interviewer.isApproved) {
            throw new errors_1.AppError('Interviewer not found or not approved', 400);
        }
        // Find the interview request
        const interview = await models_1.Interview.findOne({
            _id: interviewId,
            status: types_1.InterviewStatus.REQUESTED,
            interviewerId: null,
        });
        if (!interview) {
            throw new errors_1.AppError('Interview request not found or already claimed', 404);
        }
        // Check if expired
        if (interview.expiresAt && new Date() > interview.expiresAt) {
            interview.status = types_1.InterviewStatus.EXPIRED;
            await interview.save();
            throw new errors_1.AppError('Interview request has expired', 400);
        }
        // Verify interviewer has matching expertise
        const interviewerExpertise = interviewer.expertise || [];
        const hasMatchingSkill = interview.requestedSkills.some(skill => interviewerExpertise.includes(skill));
        if (!hasMatchingSkill) {
            throw new errors_1.AppError('Your expertise does not match the requested skills', 400);
        }
        // Check for conflicting interviews for the interviewer
        const interviewDuration = duration || interview.preferredDuration || 60;
        const conflictingInterview = await models_1.Interview.findOne({
            interviewerId,
            scheduledAt: {
                $gte: new Date(scheduledAt.getTime() - interviewDuration * 60000),
                $lte: new Date(scheduledAt.getTime() + interviewDuration * 60000),
            },
            status: { $in: [types_1.InterviewStatus.SCHEDULED, types_1.InterviewStatus.IN_PROGRESS] },
        });
        if (conflictingInterview) {
            throw new errors_1.AppError('You have a conflicting interview at this time', 409);
        }
        // Claim the interview
        interview.interviewerId = interviewerId;
        interview.scheduledAt = scheduledAt;
        interview.duration = interviewDuration;
        interview.claimedAt = new Date();
        await this.ensureMeetingUrl(interview, interviewerId);
        interview.status = types_1.InterviewStatus.SCHEDULED;
        await interview.save();
        // Update free interviews count if applicable
        if (!interview.isPaid) {
            await models_1.JobSeekerProfile.findOneAndUpdate({ userId: interview.jobSeekerId }, { $inc: { 'interviewStats.freeInterviewsUsed': 1 } });
        }
        // Notify the job seeker
        await notification_service_1.default.createNotification({
            userId: interview.jobSeekerId.toString(),
            type: 'interview_scheduled',
            title: 'Interview Scheduled!',
            message: `Great news! An interviewer has accepted your request. Your mock interview is scheduled for ${scheduledAt.toLocaleString()}.`,
            data: { interviewId: interview._id },
        });
        logger_1.default.info(`Interview ${interviewId} claimed by interviewer ${interviewerId}`);
        return interview;
    }
    /**
     * Get all interview requests made by a job seeker (including unclaimed ones).
     */
    async getJobSeekerRequests(jobSeekerId, pagination = {}) {
        const { page = 1, limit = 10, sort = 'createdAt', order = 'desc' } = pagination;
        const query = {
            jobSeekerId,
            status: { $in: [types_1.InterviewStatus.REQUESTED, types_1.InterviewStatus.EXPIRED] }
        };
        const total = await models_1.Interview.countDocuments(query);
        const totalPages = Math.ceil(total / limit);
        const interviews = await models_1.Interview.find(query)
            .populate('interviewerId', 'firstName lastName email avatar')
            .sort({ [sort]: order === 'asc' ? 1 : -1 })
            .skip((page - 1) * limit)
            .limit(limit);
        return {
            interviews,
            pagination: {
                page,
                limit,
                total,
                totalPages,
                hasNext: page < totalPages,
                hasPrev: page > 1,
            },
        };
    }
    /**
     * Expire old interview requests (to be called by a cron job).
     */
    async expireOldRequests() {
        const result = await models_1.Interview.updateMany({
            status: types_1.InterviewStatus.REQUESTED,
            expiresAt: { $lte: new Date() },
        }, {
            status: types_1.InterviewStatus.EXPIRED,
        });
        if (result.modifiedCount > 0) {
            logger_1.default.info(`Expired ${result.modifiedCount} interview requests`);
        }
        return result.modifiedCount;
    }
}
exports.default = new InterviewService();
//# sourceMappingURL=interview.service.js.map