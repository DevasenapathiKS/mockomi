import { User } from '../../auth/models/User';
import { InterviewerProfile } from '../../interviewer/models/InterviewerProfile';
import { InterviewSession } from '../../interview/models/InterviewSession';
import { PaymentRecord } from '../../payment/models/PaymentRecord';
import { SessionRating } from '../../rating/models/SessionRating';

export type AdminDashboard = {
  totalUsers: number;
  totalInterviewers: number;
  verifiedInterviewers: number;
  totalSessions: number;
  completedSessions: number;
  scheduledSessions: number;
  platformRevenueTotal: number;
  interviewerPayoutTotal: number;
  averageRating: number;
  flaggedInterviewers: Array<{
    userId: string;
    ratingAverage: number;
    totalRatings: number;
    totalInterviews: number;
  }>;
};

export class AdminService {
  public async getDashboard(): Promise<AdminDashboard> {
    const [
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
    ] = await Promise.all([
      User.countDocuments({ role: 'candidate' }).exec(),
      User.countDocuments({ role: 'interviewer' }).exec(),
      InterviewerProfile.countDocuments({ isVerified: true }).exec(),
      InterviewSession.countDocuments({}).exec(),
      InterviewSession.countDocuments({ status: 'completed' }).exec(),
      InterviewSession.countDocuments({ status: 'scheduled' }).exec(),
      PaymentRecord.aggregate<{ total: number }>([
        { $match: { status: 'paid' } },
        { $group: { _id: null, total: { $sum: '$platformShare' } } },
      ]).then((r) => r[0]?.total ?? 0),
      PaymentRecord.aggregate<{ total: number }>([
        { $match: { status: 'paid' } },
        { $group: { _id: null, total: { $sum: '$interviewerShare' } } },
      ]).then((r) => r[0]?.total ?? 0),
      SessionRating.aggregate<{ avg: number }>([
        { $group: { _id: null, avg: { $avg: '$rating' } } },
      ]).then((r) => r[0]?.avg ?? 0),
      InterviewerProfile.find({
        isVerified: true,
        isActive: true,
        ratingAverage: { $lt: 3 },
      })
        .sort({ ratingAverage: 1 })
        .limit(10)
        .select('userId ratingAverage totalRatings totalInterviews')
        .lean()
        .exec()
        .then((items) =>
          items.map((i) => ({
            userId: String(i.userId),
            ratingAverage: i.ratingAverage,
            totalRatings: i.totalRatings,
            totalInterviews: i.totalInterviews,
          })),
        ),
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

