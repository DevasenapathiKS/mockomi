import { Response } from 'express';
import { interviewService, paymentService } from '../services';
import { AuthRequest, InterviewStatus, UserRole } from '../types';
import { asyncHandler } from '../middlewares/errorHandler';
import config from '../config';

export const scheduleInterview = asyncHandler(async (req: AuthRequest, res: Response) => {
  // Check if payment is required
  const paymentCheck = await interviewService.checkPaymentRequired(req.user!.id);

  if (paymentCheck.required && !req.body.paymentId) {
    return res.status(402).json({
      success: false,
      message: 'Payment required for this interview',
      data: {
        pricePerInterview: paymentCheck.pricePerInterview,
      },
    });
  }

  const interview = await interviewService.scheduleInterview({
    jobSeekerId: req.user!.id,
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

export const getInterviewById = asyncHandler(async (req: AuthRequest, res: Response) => {
  const interview = await interviewService.getInterviewById(
    req.params.id,
    req.user!.id
  );

  res.status(200).json({
    success: true,
    data: interview,
  });
});

export const getMyInterviews = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { page, limit, sort, order, status } = req.query as any;
  const isInterviewer = req.user!.role === UserRole.INTERVIEWER;

  const result = isInterviewer
    ? await interviewService.getInterviewerInterviews(
        req.user!.id,
        status as InterviewStatus,
        { page: Number(page) || 1, limit: Number(limit) || 10, sort, order }
      )
    : await interviewService.getJobSeekerInterviews(
        req.user!.id,
        status as InterviewStatus,
        { page: Number(page) || 1, limit: Number(limit) || 10, sort, order }
      );

  res.status(200).json({
    success: true,
    data: result.interviews,
    pagination: result.pagination,
  });
});

export const startInterview = asyncHandler(async (req: AuthRequest, res: Response) => {
  const interview = await interviewService.startInterview(
    req.params.id,
    req.user!.id
  );

  res.status(200).json({
    success: true,
    message: 'Interview started',
    data: interview,
  });
});

export const completeInterview = asyncHandler(async (req: AuthRequest, res: Response) => {
  const interview = await interviewService.completeInterview(
    req.params.id,
    req.user!.id
  );

  res.status(200).json({
    success: true,
    message: 'Interview completed',
    data: interview,
  });
});

export const cancelInterview = asyncHandler(async (req: AuthRequest, res: Response) => {
  const interview = await interviewService.cancelInterview(
    req.params.id,
    req.user!.id,
    req.body.reason
  );

  res.status(200).json({
    success: true,
    message: 'Interview cancelled',
    data: interview,
  });
});

export const submitFeedback = asyncHandler(async (req: AuthRequest, res: Response) => {
  const interview = await interviewService.submitFeedback(
    req.params.id,
    req.user!.id,
    req.body
  );

  res.status(200).json({
    success: true,
    message: 'Feedback submitted successfully',
    data: interview,
  });
});

export const uploadRecording = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'No video file uploaded',
    });
  }

  const interview = await interviewService.uploadRecording(
    req.params.id,
    req.user!.id,
    req.file.buffer,
    req.file.originalname,
    req.file.mimetype
  );

  res.status(200).json({
    success: true,
    message: 'Recording uploaded successfully',
    data: interview,
  });
});

export const getRecordingUrl = asyncHandler(async (req: AuthRequest, res: Response) => {
  const url = await interviewService.getRecordingUrl(
    req.params.id,
    req.user!.id
  );

  res.status(200).json({
    success: true,
    data: { url },
  });
});

export const checkPaymentRequired = asyncHandler(async (req: AuthRequest, res: Response) => {
  const result = await interviewService.checkPaymentRequired(req.user!.id);

  res.status(200).json({
    success: true,
    data: result,
  });
});

export const getAvailableInterviewers = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { expertise, date } = req.query as any;

  const interviewers = await interviewService.getAvailableInterviewers(
    expertise ? expertise.split(',') : undefined,
    date ? new Date(date) : undefined
  );

  res.status(200).json({
    success: true,
    data: interviewers,
  });
});

export const getInterviewerEarnings = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { period } = req.query as any;

  const result = await interviewService.getInterviewerEarnings(req.user!.id, period);

  res.status(200).json({
    success: true,
    data: result,
  });
});

export const createPaymentOrder = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { order, payment } = await paymentService.createOrder({
    userId: req.user!.id,
    interviewId: req.body.interviewId,
    amount: config.interview.pricePaise,
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

export const verifyPayment = asyncHandler(async (req: AuthRequest, res: Response) => {
  const payment = await paymentService.verifyPayment(req.body);

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
export const createInterviewRequest = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { requestedSkills, preferredDuration, notes, paymentId, couponCode } = req.body;

  // Validate that either payment or coupon is provided
  if (!paymentId && !couponCode) {
    return res.status(402).json({
      success: false,
      message: 'Payment or coupon code is required for this interview',
      data: {
        pricePerInterview: (await interviewService.checkPaymentRequired(req.user!.id)).pricePerInterview,
      },
    });
  }

  const interview = await interviewService.createInterviewRequest({
    jobSeekerId: req.user!.id,
    requestedSkills,
    preferredDuration,
    notes,
    paymentId,
    couponCode,
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
export const getMyInterviewRequests = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { page, limit, sort, order } = req.query as any;

  const result = await interviewService.getJobSeekerRequests(
    req.user!.id,
    { page: Number(page) || 1, limit: Number(limit) || 10, sort, order }
  );

  res.status(200).json({
    success: true,
    data: result.interviews,
    pagination: result.pagination,
  });
});

/**
 * Interviewers get available interview requests matching their expertise.
 */
export const getAvailableInterviewRequests = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { page, limit, sort, order } = req.query as any;

  const result = await interviewService.getAvailableRequests(
    req.user!.id,
    { page: Number(page) || 1, limit: Number(limit) || 10, sort, order }
  );

  res.status(200).json({
    success: true,
    data: result.interviews,
    pagination: result.pagination,
  });
});

/**
 * Interviewer claims an interview request and sets the schedule.
 */
export const claimInterviewRequest = asyncHandler(async (req: AuthRequest, res: Response) => {
  const interview = await interviewService.claimInterview({
    interviewId: req.params.id,
    interviewerId: req.user!.id,
    scheduledAt: new Date(req.body.scheduledAt),
    duration: req.body.duration,
  });

  res.status(200).json({
    success: true,
    message: 'Interview claimed successfully. The job seeker has been notified.',
    data: interview,
  });
});
