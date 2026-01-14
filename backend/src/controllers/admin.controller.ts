import { Response } from 'express';
import { adminService, paymentService } from '../services';
import { AuthRequest, UserRole, UserStatus, PaymentStatus } from '../types';
import { asyncHandler } from '../middlewares/errorHandler';

export const getDashboard = asyncHandler(async (req: AuthRequest, res: Response) => {
  const stats = await adminService.getDashboardStats();

  res.status(200).json({
    success: true,
    data: stats,
  });
});

export const getAllUsers = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { page, limit, role, status } = req.query as any;

  const result = await adminService.getAllUsers(
    role as UserRole,
    status as UserStatus,
    Number(page) || 1,
    Number(limit) || 10
  );

  res.status(200).json({
    success: true,
    data: result.users,
    total: result.total,
    totalPages: result.totalPages,
  });
});

export const updateUserStatus = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = await adminService.updateUserStatus(
    req.params.id,
    req.body.status,
    req.user!.id
  );

  res.status(200).json({
    success: true,
    message: 'User status updated',
    data: user,
  });
});

export const getPendingInterviewers = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { page, limit } = req.query as any;

  const result = await adminService.getPendingInterviewers(
    Number(page) || 1,
    Number(limit) || 10
  );

  res.status(200).json({
    success: true,
    data: result.interviewers,
    total: result.total,
    totalPages: result.totalPages,
  });
});

export const approveInterviewer = asyncHandler(async (req: AuthRequest, res: Response) => {
  const profile = await adminService.approveInterviewer(
    req.params.id,
    req.user!.id,
    req.body.isApproved,
    req.body.rejectionReason
  );

  res.status(200).json({
    success: true,
    message: req.body.isApproved ? 'Interviewer approved' : 'Interviewer rejected',
    data: profile,
  });
});

export const getAllPayments = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { page, limit, status } = req.query as any;

  const result = await paymentService.getAllPayments(
    status as PaymentStatus,
    { page: Number(page) || 1, limit: Number(limit) || 10 }
  );

  res.status(200).json({
    success: true,
    data: result.payments,
    pagination: result.pagination,
  });
});

export const getPaymentStats = asyncHandler(async (req: AuthRequest, res: Response) => {
  const stats = await paymentService.getPaymentStats();

  res.status(200).json({
    success: true,
    data: stats,
  });
});

export const initiateRefund = asyncHandler(async (req: AuthRequest, res: Response) => {
  const refund = await paymentService.initiateRefund(req.params.id, req.user!.id);

  res.status(200).json({
    success: true,
    message: 'Refund initiated',
    data: refund,
  });
});

export const getInterviewAnalytics = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { startDate, endDate } = req.query as any;

  const analytics = await adminService.getInterviewAnalytics(
    startDate ? new Date(startDate) : undefined,
    endDate ? new Date(endDate) : undefined
  );

  res.status(200).json({
    success: true,
    data: analytics,
  });
});

export const getRevenueAnalytics = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { startDate, endDate } = req.query as any;

  const analytics = await adminService.getRevenueAnalytics(
    startDate ? new Date(startDate) : undefined,
    endDate ? new Date(endDate) : undefined
  );

  res.status(200).json({
    success: true,
    data: analytics,
  });
});

export const getTopInterviewers = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { limit } = req.query as any;

  const interviewers = await adminService.getTopInterviewers(Number(limit) || 10);

  res.status(200).json({
    success: true,
    data: interviewers,
  });
});

export const getSystemHealth = asyncHandler(async (req: AuthRequest, res: Response) => {
  const health = await adminService.getSystemHealth();

  res.status(200).json({
    success: true,
    data: health,
  });
});
