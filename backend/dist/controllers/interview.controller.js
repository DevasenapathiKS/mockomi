"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.claimInterviewRequest = exports.getAvailableInterviewRequests = exports.getMyInterviewRequests = exports.createInterviewRequest = exports.verifyPayment = exports.createPaymentOrder = exports.getInterviewerEarnings = exports.getAvailableInterviewers = exports.checkPaymentRequired = exports.getRecordingUrl = exports.uploadRecording = exports.submitFeedback = exports.cancelInterview = exports.completeInterview = exports.startInterview = exports.getMyInterviews = exports.getInterviewById = exports.scheduleInterview = void 0;
const services_1 = require("../services");
const types_1 = require("../types");
const errorHandler_1 = require("../middlewares/errorHandler");
const config_1 = __importDefault(require("../config"));
exports.scheduleInterview = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    // Check if payment is required
    const paymentCheck = await services_1.interviewService.checkPaymentRequired(req.user.id);
    if (paymentCheck.required && !req.body.paymentId) {
        return res.status(402).json({
            success: false,
            message: 'Payment required for this interview',
            data: {
                freeInterviewsRemaining: paymentCheck.freeInterviewsRemaining,
                pricePerInterview: paymentCheck.pricePerInterview,
            },
        });
    }
    const interview = await services_1.interviewService.scheduleInterview({
        jobSeekerId: req.user.id,
        interviewerId: req.body.interviewerId,
        scheduledAt: new Date(req.body.scheduledAt),
        duration: req.body.duration,
        topic: req.body.topic,
        paymentId: req.body.paymentId,
    });
    res.status(201).json({
        success: true,
        message: 'Interview scheduled successfully',
        data: interview,
    });
});
exports.getInterviewById = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const interview = await services_1.interviewService.getInterviewById(req.params.id, req.user.id);
    res.status(200).json({
        success: true,
        data: interview,
    });
});
exports.getMyInterviews = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { page, limit, sort, order, status } = req.query;
    const isInterviewer = req.user.role === types_1.UserRole.INTERVIEWER;
    const result = isInterviewer
        ? await services_1.interviewService.getInterviewerInterviews(req.user.id, status, { page: Number(page) || 1, limit: Number(limit) || 10, sort, order })
        : await services_1.interviewService.getJobSeekerInterviews(req.user.id, status, { page: Number(page) || 1, limit: Number(limit) || 10, sort, order });
    res.status(200).json({
        success: true,
        data: result.interviews,
        pagination: result.pagination,
    });
});
exports.startInterview = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const interview = await services_1.interviewService.startInterview(req.params.id, req.user.id);
    res.status(200).json({
        success: true,
        message: 'Interview started',
        data: interview,
    });
});
exports.completeInterview = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const interview = await services_1.interviewService.completeInterview(req.params.id, req.user.id);
    res.status(200).json({
        success: true,
        message: 'Interview completed',
        data: interview,
    });
});
exports.cancelInterview = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const interview = await services_1.interviewService.cancelInterview(req.params.id, req.user.id, req.body.reason);
    res.status(200).json({
        success: true,
        message: 'Interview cancelled',
        data: interview,
    });
});
exports.submitFeedback = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const interview = await services_1.interviewService.submitFeedback(req.params.id, req.user.id, req.body);
    res.status(200).json({
        success: true,
        message: 'Feedback submitted successfully',
        data: interview,
    });
});
exports.uploadRecording = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    if (!req.file) {
        return res.status(400).json({
            success: false,
            message: 'No video file uploaded',
        });
    }
    const interview = await services_1.interviewService.uploadRecording(req.params.id, req.user.id, req.file.buffer, req.file.originalname, req.file.mimetype);
    res.status(200).json({
        success: true,
        message: 'Recording uploaded successfully',
        data: interview,
    });
});
exports.getRecordingUrl = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const url = await services_1.interviewService.getRecordingUrl(req.params.id, req.user.id);
    res.status(200).json({
        success: true,
        data: { url },
    });
});
exports.checkPaymentRequired = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const result = await services_1.interviewService.checkPaymentRequired(req.user.id);
    res.status(200).json({
        success: true,
        data: result,
    });
});
exports.getAvailableInterviewers = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { expertise, date } = req.query;
    const interviewers = await services_1.interviewService.getAvailableInterviewers(expertise ? expertise.split(',') : undefined, date ? new Date(date) : undefined);
    res.status(200).json({
        success: true,
        data: interviewers,
    });
});
exports.getInterviewerEarnings = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { period } = req.query;
    const result = await services_1.interviewService.getInterviewerEarnings(req.user.id, period);
    res.status(200).json({
        success: true,
        data: result,
    });
});
exports.createPaymentOrder = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { order, payment } = await services_1.paymentService.createOrder({
        userId: req.user.id,
        interviewId: req.body.interviewId,
        amount: config_1.default.interview.pricePaise,
    });
    res.status(201).json({
        success: true,
        data: {
            orderId: order.id,
            amount: order.amount,
            currency: order.currency,
            paymentId: payment._id,
        },
    });
});
exports.verifyPayment = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const payment = await services_1.paymentService.verifyPayment(req.body);
    res.status(200).json({
        success: true,
        message: 'Payment verified successfully',
        data: payment,
    });
});
// ==================== NEW INTERVIEW REQUEST/CLAIM FLOW ====================
/**
 * Job seeker creates an interview request with selected skills only.
 */
exports.createInterviewRequest = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    // Check if payment is required
    const paymentCheck = await services_1.interviewService.checkPaymentRequired(req.user.id);
    if (paymentCheck.required && !req.body.paymentId) {
        return res.status(402).json({
            success: false,
            message: 'Payment required for this interview',
            data: {
                freeInterviewsRemaining: paymentCheck.freeInterviewsRemaining,
                pricePerInterview: paymentCheck.pricePerInterview,
            },
        });
    }
    const interview = await services_1.interviewService.createInterviewRequest({
        jobSeekerId: req.user.id,
        requestedSkills: req.body.requestedSkills,
        preferredDuration: req.body.preferredDuration,
        notes: req.body.notes,
        paymentId: req.body.paymentId,
    });
    res.status(201).json({
        success: true,
        message: 'Interview request created successfully. You will be notified when an interviewer accepts.',
        data: interview,
    });
});
/**
 * Get interview requests for a job seeker (pending/expired).
 */
exports.getMyInterviewRequests = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { page, limit, sort, order } = req.query;
    const result = await services_1.interviewService.getJobSeekerRequests(req.user.id, { page: Number(page) || 1, limit: Number(limit) || 10, sort, order });
    res.status(200).json({
        success: true,
        data: result.interviews,
        pagination: result.pagination,
    });
});
/**
 * Interviewers get available interview requests matching their expertise.
 */
exports.getAvailableInterviewRequests = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { page, limit, sort, order } = req.query;
    const result = await services_1.interviewService.getAvailableRequests(req.user.id, { page: Number(page) || 1, limit: Number(limit) || 10, sort, order });
    res.status(200).json({
        success: true,
        data: result.interviews,
        pagination: result.pagination,
    });
});
/**
 * Interviewer claims an interview request and sets the schedule.
 */
exports.claimInterviewRequest = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const interview = await services_1.interviewService.claimInterview({
        interviewId: req.params.id,
        interviewerId: req.user.id,
        scheduledAt: new Date(req.body.scheduledAt),
        duration: req.body.duration,
    });
    res.status(200).json({
        success: true,
        message: 'Interview claimed successfully. The job seeker has been notified.',
        data: interview,
    });
});
//# sourceMappingURL=interview.controller.js.map