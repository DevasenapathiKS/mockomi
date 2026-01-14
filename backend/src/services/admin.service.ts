import { User, JobSeekerProfile, CompanyProfile, InterviewerProfile, Interview, Payment, Job, JobApplication } from '../models';
import { IUserDocument } from '../types';
import { UserStatus, UserRole, InterviewStatus, PaymentStatus, JobStatus } from '../types';
import { AppError } from '../utils/errors';
import redis from '../config/redis';
import logger from '../utils/logger';
import notificationService from './notification.service';

interface DashboardStats {
  totalUsers: number;
  activeJobSeekers: number;
  activeEmployers: number;
  activeInterviewers: number;
  pendingInterviewers: number;
  totalInterviews: number;
  completedInterviews: number;
  totalJobs: number;
  activeJobs: number;
  totalRevenue: number;
  monthlyRevenue: number;
}

class AdminService {
  async getDashboardStats(): Promise<DashboardStats> {
    // Try cache first
    const cached = await redis.getJSON<DashboardStats>('admin:dashboard');
    if (cached) {
      return cached;
    }

    const [
      totalUsers,
      activeJobSeekers,
      activeEmployers,
      activeInterviewers,
      pendingInterviewers,
      totalInterviews,
      completedInterviews,
      totalJobs,
      activeJobs,
      revenueStats,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: UserRole.JOB_SEEKER, status: UserStatus.ACTIVE }),
      User.countDocuments({ role: UserRole.EMPLOYER, status: UserStatus.ACTIVE }),
      InterviewerProfile.countDocuments({ isApproved: true }),
      InterviewerProfile.countDocuments({ isApproved: false }),
      Interview.countDocuments(),
      Interview.countDocuments({ status: InterviewStatus.COMPLETED }),
      Job.countDocuments(),
      Job.countDocuments({ status: JobStatus.ACTIVE }),
      this.getRevenueStats(),
    ]);

    const stats: DashboardStats = {
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
    await redis.setJSON('admin:dashboard', stats, 300);

    return stats;
  }

  private async getRevenueStats(): Promise<{ totalRevenue: number; monthlyRevenue: number }> {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const [totalResult, monthlyResult] = await Promise.all([
      Payment.aggregate([
        { $match: { status: PaymentStatus.COMPLETED } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      Payment.aggregate([
        {
          $match: {
            status: PaymentStatus.COMPLETED,
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

  async getAllUsers(
    role?: UserRole,
    status?: UserStatus,
    page: number = 1,
    limit: number = 10
  ): Promise<{ users: IUserDocument[]; total: number; totalPages: number }> {
    const query: any = {};
    if (role) query.role = role;
    if (status) query.status = status;

    const [users, total] = await Promise.all([
      User.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      User.countDocuments(query),
    ]);

    return {
      users,
      total,
      totalPages: Math.ceil(total / limit),
    };
  }

  async updateUserStatus(userId: string, status: UserStatus, adminId: string): Promise<IUserDocument> {
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Prevent modifying admin users
    if (user.role === UserRole.ADMIN) {
      throw new AppError('Cannot modify admin users', 403);
    }

    user.status = status;
    await user.save();

    // Clear cache
    await redis.del(`user:${userId}`);

    // Send notification
    let message = '';
    if (status === UserStatus.ACTIVE) {
      message = 'Your account has been activated.';
    } else if (status === UserStatus.SUSPENDED) {
      message = 'Your account has been suspended. Please contact support.';
    } else if (status === UserStatus.INACTIVE) {
      message = 'Your account has been deactivated.';
    }

    if (message) {
      await notificationService.createNotification({
        userId,
        type: 'system',
        title: 'Account Status Update',
        message,
      });
    }

    logger.info(`User status updated: ${userId} to ${status} by admin: ${adminId}`);

    return user;
  }

  async getPendingInterviewers(
    page: number = 1,
    limit: number = 10
  ): Promise<{ interviewers: any[]; total: number; totalPages: number }> {
    const [interviewers, total] = await Promise.all([
      InterviewerProfile.find({ isApproved: false })
        .populate('userId', 'firstName lastName email avatar createdAt')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      InterviewerProfile.countDocuments({ isApproved: false }),
    ]);

    return {
      interviewers,
      total,
      totalPages: Math.ceil(total / limit),
    };
  }

  async approveInterviewer(
    interviewerId: string,
    adminId: string,
    isApproved: boolean,
    rejectionReason?: string
  ): Promise<any> {
    const profile = await InterviewerProfile.findById(interviewerId);
    if (!profile) {
      throw new AppError('Interviewer profile not found', 404);
    }

    profile.isApproved = isApproved;
    profile.approvedAt = isApproved ? new Date() : undefined;
    profile.approvedBy = isApproved ? adminId as any : undefined;
    profile.rejectionReason = !isApproved ? rejectionReason : undefined;
    await profile.save();

    // Update user status
    const user = await User.findById(profile.userId);
    if (user) {
      user.status = isApproved ? UserStatus.ACTIVE : UserStatus.INACTIVE;
      await user.save();
    }

    // Send notification
    await notificationService.createNotification({
      userId: profile.userId.toString(),
      type: isApproved ? 'interviewer_approved' : 'interviewer_rejected',
      title: isApproved ? 'Profile Approved!' : 'Profile Not Approved',
      message: isApproved
        ? 'Congratulations! Your interviewer profile has been approved. You can now conduct mock interviews.'
        : `Your interviewer profile was not approved. ${rejectionReason || 'Please contact support for more details.'}`,
    });

    logger.info(
      `Interviewer ${isApproved ? 'approved' : 'rejected'}: ${interviewerId} by admin: ${adminId}`
    );

    return profile;
  }

  async getInterviewAnalytics(startDate?: Date, endDate?: Date): Promise<any> {
    const match: any = {};
    if (startDate) {
      match.createdAt = { $gte: startDate };
    }
    if (endDate) {
      match.createdAt = { ...match.createdAt, $lte: endDate };
    }

    const analytics = await Interview.aggregate([
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

  async getRevenueAnalytics(startDate?: Date, endDate?: Date): Promise<any> {
    const match: any = { status: PaymentStatus.COMPLETED };
    if (startDate) {
      match.createdAt = { $gte: startDate };
    }
    if (endDate) {
      match.createdAt = { ...match.createdAt, $lte: endDate };
    }

    const analytics = await Payment.aggregate([
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

  async getTopInterviewers(limit: number = 10): Promise<any[]> {
    const interviewers = await InterviewerProfile.find({ isApproved: true })
      .populate('userId', 'firstName lastName email avatar')
      .sort({ interviewsCompleted: -1 })
      .limit(limit);

    return interviewers;
  }

  async getSystemHealth(): Promise<any> {
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

  private async checkDatabaseHealth(): Promise<{ status: string; responseTime: number }> {
    const start = Date.now();
    try {
      await User.findOne().limit(1);
      return {
        status: 'healthy',
        responseTime: Date.now() - start,
      };
    } catch {
      return {
        status: 'unhealthy',
        responseTime: Date.now() - start,
      };
    }
  }

  private async checkCacheHealth(): Promise<{ status: string; responseTime: number }> {
    const start = Date.now();
    try {
      await redis.set('health-check', 'ok', 10);
      const value = await redis.get('health-check');
      return {
        status: value === 'ok' ? 'healthy' : 'unhealthy',
        responseTime: Date.now() - start,
      };
    } catch {
      return {
        status: 'unhealthy',
        responseTime: Date.now() - start,
      };
    }
  }
}

export default new AdminService();
