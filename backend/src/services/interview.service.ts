import { Interview, JobSeekerProfile, InterviewerProfile, Payment } from '../models';
import { IInterviewDocument } from '../models/Interview';
import { InterviewStatus, PaymentStatus, IInterviewFeedback, PaginationQuery, PaginationInfo } from '../types';
import { AppError } from '../utils/errors';
import config from '../config';
import logger from '../utils/logger';
import { Types } from 'mongoose';
import mongoose from 'mongoose';
// import paymentService from './payment.service';
import s3Service from './s3.service';
import notificationService from './notification.service';
import couponService from './coupon.service';

interface ScheduleInterviewData {
  jobSeekerId: string;
  interviewerId: string;
  scheduledAt: Date;
  duration?: number;
  topic?: string;
  paymentId?: string;
}

class InterviewService {
  private async validateCompletedPayment(paymentId: string, userId: string) {
    const payment = await Payment.findById(paymentId);
    if (!payment) {
      throw new AppError('Payment not found', 404);
    }

    if (payment.userId.toString() !== userId) {
      throw new AppError('Payment does not belong to this user', 403);
    }

    if (payment.status !== PaymentStatus.COMPLETED) {
      throw new AppError('Payment not completed', 400);
    }

    if (payment.amount < config.interview.pricePaise) {
      throw new AppError('Payment amount is insufficient', 400);
    }

    return payment;
  }

  async scheduleInterview(data: ScheduleInterviewData): Promise<IInterviewDocument> {
    const { jobSeekerId, interviewerId, scheduledAt, duration = 60, topic, paymentId } = data;

    // Check if interviewer is approved
    const interviewer = await InterviewerProfile.findOne({ userId: interviewerId });
    if (!interviewer || !interviewer.isApproved) {
      throw new AppError('Interviewer not found or not approved', 400);
    }

    // Check job seeker's interview stats
    const jobSeekerProfile = await JobSeekerProfile.findOne({ userId: jobSeekerId });
    if (!jobSeekerProfile) {
      throw new AppError('Job seeker profile not found', 404);
    }

    // Check if payment is required
    const freeInterviewsUsed = jobSeekerProfile.interviewStats.freeInterviewsUsed;
    const needsPayment = freeInterviewsUsed >= config.interview.freeInterviews;
    const payment = needsPayment && paymentId
      ? await this.validateCompletedPayment(paymentId, jobSeekerId)
      : null;

    if (needsPayment && !paymentId) {
      throw new AppError('Payment required for this interview', 402);
    }

    // Check for conflicting interviews
    const conflictingInterview = await Interview.findOne({
      $or: [{ jobSeekerId }, { interviewerId }],
      scheduledAt: {
        $gte: new Date(scheduledAt.getTime() - duration * 60000),
        $lte: new Date(scheduledAt.getTime() + duration * 60000),
      },
      status: { $in: [InterviewStatus.SCHEDULED, InterviewStatus.IN_PROGRESS] },
    });

    if (conflictingInterview) {
      throw new AppError('Time slot is not available', 409);
    }

    // Create interview
    const interview = await Interview.create({
      jobSeekerId,
      interviewerId,
      scheduledAt,
      duration,
      topic,
      status: InterviewStatus.SCHEDULED,
      type: 'mock',
      isPaid: !!payment || !needsPayment,
      payment: payment?._id,
    });

    // Update payment reference and free interview usage
    if (payment) {
      payment.interviewId = interview._id as any;
      await payment.save();
    } else if (!needsPayment) {
      jobSeekerProfile.interviewStats.freeInterviewsUsed += 1;
      await jobSeekerProfile.save();
    }

    // Send notifications
    await notificationService.createNotification({
      userId: jobSeekerId,
      type: 'interview_scheduled',
      title: 'Interview Scheduled',
      message: `Your mock interview has been scheduled for ${scheduledAt.toLocaleString()}`,
      data: { interviewId: interview._id },
    });

    await notificationService.createNotification({
      userId: interviewerId,
      type: 'interview_scheduled',
      title: 'New Interview Assigned',
      message: `You have a new mock interview scheduled for ${scheduledAt.toLocaleString()}`,
      data: { interviewId: interview._id },
    });

    logger.info(`Interview scheduled: ${interview._id}`);

    return interview;
  }

  async getInterviewById(interviewId: string, userId: string): Promise<IInterviewDocument> {
    const interview = await Interview.findById(interviewId)
      .populate('jobSeekerId', 'firstName lastName email avatar')
      .populate('interviewerId', 'firstName lastName email avatar');

    if (!interview) {
      throw new AppError('Interview not found', 404);
    }

    // Check access
    const isParticipant =
      interview.jobSeekerId._id.toString() === userId ||
      interview.interviewerId._id.toString() === userId;

    if (!isParticipant) {
      throw new AppError('Access denied', 403);
    }

    return interview;
  }

  async getJobSeekerInterviews(
    jobSeekerId: string,
    status?: InterviewStatus,
    pagination: PaginationQuery = {}
  ): Promise<{ interviews: IInterviewDocument[]; pagination: PaginationInfo }> {
    const { page = 1, limit = 10, sort = 'scheduledAt', order = 'asc' } = pagination;

    const query: any = { jobSeekerId };
    if (status) {
      query.status = status;
    }

    const total = await Interview.countDocuments(query);
    const totalPages = Math.ceil(total / limit);

    const interviews = await Interview.find(query)
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

  async getInterviewerInterviews(
    interviewerId: string,
    status?: InterviewStatus,
    pagination: PaginationQuery = {}
  ): Promise<{ interviews: IInterviewDocument[]; pagination: PaginationInfo }> {
    const { page = 1, limit = 10, sort = 'scheduledAt', order = 'desc' } = pagination;

    const query: any = { interviewerId };
    if (status) {
      query.status = status;
    }

    const total = await Interview.countDocuments(query);
    const totalPages = Math.ceil(total / limit);

    const interviews = await Interview.find(query)
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

  async getInterviewerEarnings(
    interviewerId: string,
    period?: string
  ): Promise<{
    earnings: Array<{
      id: string;
      interviewId: string;
      candidateName: string;
      date: string;
      duration: number;
      amount: number;
      status: 'pending' | 'paid' | 'processing';
      type: string;
    }>;
    stats: {
      totalEarnings: number;
      pendingAmount: number;
      paidAmount: number;
      totalInterviews: number;
    };
  }> {
    const matchInterview: any = { interviewerId: new Types.ObjectId(interviewerId) };

    const now = new Date();
    const startOfWeek = (d: Date) => {
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
    const payments = await Payment.aggregate([
      {
        $lookup: {
          from: 'interviews',
          localField: 'interviewId',
          foreignField: '_id',
          as: 'interview',
        },
      },
      { $unwind: '$interview' },
      { $match: { 'interview.interviewerId': new Types.ObjectId(interviewerId), ...(matchInterview.createdAt ? { 'interview.createdAt': matchInterview.createdAt } : {}) } },
      // Lookup user (job seeker) to get candidate name
      {
        $lookup: {
          from: 'users',
          localField: 'interview.jobSeekerId',
          foreignField: '_id',
          as: 'candidate',
        },
      },
      { $unwind: { path: '$candidate', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          amount: 1,
          status: 1,
          createdAt: 1,
          interview: 1,
          candidateName: {
            $concat: [
              { $ifNull: ['$candidate.firstName', ''] },
              ' ',
              { $ifNull: ['$candidate.lastName', ''] }
            ]
          },
        },
      },
    ]);

    let totalEarnings = 0;
    let pendingAmount = 0;
    let paidAmount = 0;
    const earnings: any[] = [];

    for (const p of payments) {
      if (p.status === PaymentStatus.COMPLETED) {
        paidAmount += p.amount;
        totalEarnings += p.amount;
      } else if (p.status === PaymentStatus.PENDING || p.status === PaymentStatus.PROCESSING) {
        pendingAmount += p.amount;
      }

      // Use candidateName from aggregation or fallback
      const candidateName = p.candidateName?.trim() || 'Candidate';

      earnings.push({
        id: p._id.toString(),
        interviewId: p.interview._id.toString(),
        candidateName: candidateName || 'Candidate',
        date: p.interview.scheduledAt ? p.interview.scheduledAt.toISOString() : p.createdAt.toISOString(),
        duration: p.interview.duration || 60,
        amount: Math.round(p.amount / 100),
        status: p.status === PaymentStatus.COMPLETED ? 'paid' : p.status === PaymentStatus.PENDING ? 'pending' : 'processing',
        type: 'mock',
      });
    }

    const totalInterviews = await Interview.countDocuments(matchInterview);

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

  private async ensureMeetingUrl(interview: any, creatorId: string): Promise<string> {
    if (interview.meetingUrl) {
      return interview.meetingUrl;
    }

    try {
      const response = await fetch(`${config.vc.baseUrl.replace(/\/$/, '')}/meetings`, {
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

      const data = (await response.json()) as { meetingUrl?: string; url?: string };
      console.log('data', data);
      const url = data.meetingUrl || (data as any).url;

      console.log('url', url);

      if (url) {
        interview.meetingUrl = url;
        await interview.save();
        return url;
      }
    } catch (err) {
      logger.warn('Failed to generate meeting URL from VC service', err);
    }

    // Fallback to panel link
    const base = config.frontend.url.replace(/\/$/, '');
    const fallback = `${base}/dashboard/interviews/${interview._id}/panel`;
    interview.panelUrl = fallback;
    await interview.save();
    return fallback;
  }

  async startInterview(interviewId: string, interviewerId: string): Promise<IInterviewDocument> {
    const interview = await Interview.findOne({
      _id: interviewId,
      interviewerId,
      status: InterviewStatus.SCHEDULED,
    });

    if (!interview) {
      throw new AppError('Interview not found or cannot be started', 404);
    }

    await this.ensureMeetingUrl(interview, interviewerId);

    interview.status = InterviewStatus.IN_PROGRESS;
    await interview.save();

    return interview;
  }

  async completeInterview(interviewId: string, interviewerId: string): Promise<IInterviewDocument> {
    const interview = await Interview.findOne({
      _id: interviewId,
      interviewerId,
      status: InterviewStatus.IN_PROGRESS,
    });

    if (!interview) {
      throw new AppError('Interview not found or cannot be completed', 404);
    }

    interview.status = InterviewStatus.COMPLETED;
    await interview.save();

    // Get current interviewer profile to check completed interviews count
    const interviewerProfile = await InterviewerProfile.findOne({ userId: interviewerId });
    if (!interviewerProfile) {
      throw new AppError('Interviewer profile not found', 404);
    }

    const currentCompletedCount = interviewerProfile.interviewsCompleted || 0;
    const isFirstInterview = currentCompletedCount === 0;

    // Update interviewer earnings only from second interview onwards
    // First interview is free (no earnings)
    if (!isFirstInterview && interview.payment) {
      const payment = await Payment.findById(interview.payment);
      if (payment && payment.status === PaymentStatus.COMPLETED) {
        // Payment amount is in paise, convert to rupees for earnings
        const earningsAmount = payment.amount / 100;
        
        await InterviewerProfile.findOneAndUpdate(
          { userId: interviewerId },
          { $inc: { earnings: earningsAmount } }
        );
        
        logger.info(`Earnings updated for interviewer ${interviewerId}: +₹${earningsAmount} (from interview ${interviewId})`);
      }
    } else if (isFirstInterview) {
      logger.info(`First interview completed for interviewer ${interviewerId} - no earnings (free interview)`);
    }

    // Always increment completed interviews count (for tracking)
    await InterviewerProfile.findOneAndUpdate(
      { userId: interviewerId },
      { $inc: { interviewsCompleted: 1 } }
    );

    // Update job seeker stats
    await JobSeekerProfile.findOneAndUpdate(
      { userId: interview.jobSeekerId },
      { $inc: { 'interviewStats.totalInterviews': 1 } }
    );

    // Send notification
    await notificationService.createNotification({
      userId: interview.jobSeekerId.toString(),
      type: 'interview_completed',
      title: 'Interview Completed',
      message: 'Your mock interview has been completed. Feedback will be available soon.',
      data: { interviewId: interview._id },
    });

    return interview;
  }

  async cancelInterview(interviewId: string, userId: string, reason?: string): Promise<IInterviewDocument> {
    const interview = await Interview.findOne({
      _id: interviewId,
      $or: [{ jobSeekerId: userId }, { interviewerId: userId }],
      status: InterviewStatus.SCHEDULED,
    });

    if (!interview) {
      throw new AppError('Interview not found or cannot be cancelled', 404);
    }

    interview.status = InterviewStatus.CANCELLED;
    await interview.save();

    // Notify the other party
    const notifyUserId =
      interview.jobSeekerId.toString() === userId
        ? interview.interviewerId.toString()
        : interview.jobSeekerId.toString();

    const scheduledInfo = interview.scheduledAt 
      ? `scheduled for ${interview.scheduledAt.toLocaleString()}` 
      : '';

    await notificationService.createNotification({
      userId: notifyUserId,
      type: 'interview_cancelled',
      title: 'Interview Cancelled',
      message: `The mock interview ${scheduledInfo} has been cancelled.`.replace('  ', ' '),
      data: { interviewId: interview._id, reason },
    });

    return interview;
  }

  async submitFeedback(
    interviewId: string,
    interviewerId: string,
    feedback: Omit<IInterviewFeedback, 'submittedAt'>
  ): Promise<IInterviewDocument> {
    const interview = await Interview.findOne({
      _id: interviewId,
      interviewerId,
      status: { $in: [InterviewStatus.IN_PROGRESS, InterviewStatus.COMPLETED] },
    });

    if (!interview) {
      throw new AppError('Interview not found or feedback cannot be submitted', 404);
    }

    if (interview.feedback) {
      throw new AppError('Feedback has already been submitted', 400);
    }

    interview.feedback = {
      ...feedback,
      submittedAt: new Date(),
    };

    // If still in progress, mark as completed upon feedback submission
    if (interview.status === InterviewStatus.IN_PROGRESS) {
      interview.status = InterviewStatus.COMPLETED;
    }

    await interview.save();

    // Update job seeker's average rating
    const jobSeekerInterviews = await Interview.find({
      jobSeekerId: interview.jobSeekerId,
      status: InterviewStatus.COMPLETED,
      'feedback.rating': { $exists: true },
    });

    const totalRating = jobSeekerInterviews.reduce(
      (sum, i) => sum + (i.feedback?.rating || 0),
      0
    );
    const averageRating = totalRating / jobSeekerInterviews.length;

    await JobSeekerProfile.findOneAndUpdate(
      { userId: interview.jobSeekerId },
      { 'interviewStats.averageRating': averageRating }
    );

    // Update interviewer's rating
    const interviewerInterviews = await Interview.find({
      interviewerId,
      status: InterviewStatus.COMPLETED,
      'feedback.rating': { $exists: true },
    });

    // This is actually candidate's rating, but we track it for the interviewer too
    await InterviewerProfile.findOneAndUpdate(
      { userId: interviewerId },
      {
        'rating.count': interviewerInterviews.length,
      }
    );

    // Notify job seeker
    await notificationService.createNotification({
      userId: interview.jobSeekerId.toString(),
      type: 'feedback_received',
      title: 'Feedback Received',
      message: `You received feedback for your mock interview. Rating: ${feedback.rating}/5`,
      data: { interviewId: interview._id },
    });

    return interview;
  }

  async uploadRecording(
    interviewId: string,
    interviewerId: string,
    file: Buffer,
    fileName: string,
    mimeType: string
  ): Promise<IInterviewDocument> {
    const interview = await Interview.findOne({
      _id: interviewId,
      interviewerId,
    });

    if (!interview) {
      throw new AppError('Interview not found', 404);
    }

    // Upload to S3
    const s3Key = `interviews/${interviewId}/${fileName}`;
    const { url } = await s3Service.uploadFile(
      file,
      s3Key,
      mimeType,
      config.aws.s3VideoBucket
    );

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

  async getRecordingUrl(interviewId: string, userId: string): Promise<string> {
    const interview = await Interview.findById(interviewId);

    if (!interview) {
      throw new AppError('Interview not found', 404);
    }

    // Check access
    const isParticipant =
      interview.jobSeekerId.toString() === userId ||
      interview.interviewerId.toString() === userId;

    if (!isParticipant) {
      throw new AppError('Access denied', 403);
    }

    if (!interview.videoRecording?.s3Key) {
      throw new AppError('No recording available', 404);
    }

    // Generate signed URL (valid for 1 hour)
    const signedUrl = await s3Service.getSignedUrl(
      interview.videoRecording.s3Key,
      config.aws.s3VideoBucket,
      3600
    );

    return signedUrl;
  }

  async checkPaymentRequired(_jobSeekerId: string): Promise<{
    required: boolean;
    pricePerInterview: number;
  }> {
    // Payment is always required unless a valid coupon is used
    // Coupon validation happens during interview creation
    return {
      required: true,
      pricePerInterview: config.interview.pricePaise / 100, // Convert to rupees
    };
  }

  async getAvailableInterviewers(
    expertise?: string[],
    _date?: Date
  ): Promise<any[]> {
    const query: any = { isApproved: true };

    if (expertise && expertise.length > 0) {
      query.expertise = { $in: expertise };
    }

    const interviewers = await InterviewerProfile.find(query)
      .populate('userId', 'firstName lastName email avatar')
      .sort({ 'rating.average': -1 });

    return interviewers;
  }

  // ==================== NEW INTERVIEW REQUEST/CLAIM FLOW ====================

  /**
   * Job seeker creates an interview request with required skills only.
   * No interviewer or time is selected at this stage.
   * Supports coupon-based free interviews.
   * Uses MongoDB transactions to ensure atomicity.
   */
  async createInterviewRequest(data: {
    jobSeekerId: string;
    requestedSkills: string[];
    preferredDuration?: number;
    notes?: string;
    paymentId?: string;
    couponCode?: string;
  }): Promise<IInterviewDocument> {
    const { jobSeekerId, requestedSkills, preferredDuration = 60, notes, paymentId, couponCode } = data;

    if (!requestedSkills || requestedSkills.length === 0) {
      throw new AppError('At least one skill must be selected', 400);
    }

    // Start MongoDB transaction
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Check job seeker profile exists
      const jobSeekerProfile = await JobSeekerProfile.findOne({ userId: jobSeekerId }).session(session);
      if (!jobSeekerProfile) {
        throw new AppError('Job seeker profile not found', 404);
      }

      let payment = null;
      let couponApplied = false;

      // Handle coupon if provided
      if (couponCode) {
        try {
          // Validate coupon first (don't apply yet if payment is also provided)
          const validation = await couponService.validateCoupon(couponCode, jobSeekerId);
          if (!validation.valid) {
            throw new AppError(validation.message || 'Invalid or expired coupon', 400);
          }
          
          // If payment is also provided, it means user paid discounted amount
          // If no payment, coupon makes it free (100% discount or flat discount covering full amount)
          if (!paymentId) {
            // Apply coupon within transaction (this validates and increments usage atomically)
            await couponService.applyCoupon(couponCode, jobSeekerId, { session });
            couponApplied = true;
            logger.info(`Coupon ${couponCode} applied for free interview request by user ${jobSeekerId}`);
          } else {
            // Payment + coupon: validate coupon but don't apply yet
            // We'll apply it after payment validation
            couponApplied = true;
            logger.info(`Coupon ${couponCode} validated for discounted payment by user ${jobSeekerId}`);
          }
        } catch (error: any) {
          throw new AppError(error.message || 'Invalid or expired coupon', 400);
        }
      }

      // If no coupon, payment is required
      if (!couponApplied) {
        if (!paymentId) {
          throw new AppError('Payment required for this interview. Apply a coupon or complete payment.', 402);
        }
        payment = await this.validateCompletedPayment(paymentId, jobSeekerId);
      } else if (paymentId) {
        // Coupon + payment: validate payment and apply coupon
        payment = await this.validateCompletedPayment(paymentId, jobSeekerId);
        // Apply coupon after payment validation (within transaction)
        await couponService.applyCoupon(couponCode!, jobSeekerId, { session });
        logger.info(`Coupon ${couponCode} applied after payment validation for user ${jobSeekerId}`);
      }

      // Set expiry date (e.g., 7 days from now)
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      // Create interview request within transaction
      const [interview] = await Interview.create([{
        jobSeekerId,
        interviewerId: null,
        scheduledAt: null,
        duration: preferredDuration,
        requestedSkills,
        preferredDuration,
        notes,
        status: InterviewStatus.REQUESTED,
        type: 'mock',
        isPaid: !!payment || couponApplied,
        payment: payment?._id,
        expiresAt,
      }], { session });

      logger.info(`Interview request created: ${interview._id} with skills: ${requestedSkills.join(', ')}${couponApplied ? ` (Coupon: ${couponCode})` : ''}`);

      // Update payment reference if payment was made (within transaction)
      if (payment) {
        payment.interviewId = interview._id as any;
        await payment.save({ session });
      }

      // Commit transaction
      await session.commitTransaction();

      // Notify matching interviewers (outside transaction - these are fire-and-forget)
      const matchingInterviewers = await InterviewerProfile.find({
        isApproved: true,
        expertise: { $in: requestedSkills },
      });

      for (const interviewer of matchingInterviewers) {
        await notificationService.createNotification({
          userId: interviewer.userId.toString(),
          type: 'new_interview_request',
          title: 'New Interview Request Available',
          message: `A new interview request matching your expertise (${requestedSkills.join(', ')}) is available.`,
          data: { interviewId: interview._id },
        });
      }

      return interview;
    } catch (error) {
      // Rollback transaction on error
      await session.abortTransaction();
      throw error;
    } finally {
      // End session
      session.endSession();
    }
  }

  /**
   * Get available interview requests for an interviewer based on their expertise.
   * Only returns unclaimed (REQUESTED) interviews that match interviewer's skills.
   */
  async getAvailableRequests(
    interviewerId: string,
    pagination: PaginationQuery = {}
  ): Promise<{ interviews: IInterviewDocument[]; pagination: PaginationInfo }> {
    const { page = 1, limit = 10, sort = 'createdAt', order = 'desc' } = pagination;

    // Get interviewer's expertise
    const interviewer = await InterviewerProfile.findOne({ userId: interviewerId });
    if (!interviewer || !interviewer.isApproved) {
      throw new AppError('Interviewer not found or not approved', 400);
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
      status: InterviewStatus.REQUESTED,
      interviewerId: null,
      requestedSkills: { $in: interviewerExpertise },
      expiresAt: { $gt: new Date() }, // Not expired
    };

    const total = await Interview.countDocuments(query);
    const totalPages = Math.ceil(total / limit);

    const interviews = await Interview.find(query)
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
  async claimInterview(data: {
    interviewId: string;
    interviewerId: string;
    scheduledAt: Date;
    duration?: number;
  }): Promise<IInterviewDocument> {
    const { interviewId, interviewerId, scheduledAt, duration } = data;

    // Check if interviewer is approved
    const interviewer = await InterviewerProfile.findOne({ userId: interviewerId });
    if (!interviewer || !interviewer.isApproved) {
      throw new AppError('Interviewer not found or not approved', 400);
    }

    // Find the interview request
    const interview = await Interview.findOne({
      _id: interviewId,
      status: InterviewStatus.REQUESTED,
      interviewerId: null,
    });

    if (!interview) {
      throw new AppError('Interview request not found or already claimed', 404);
    }

    // Check if expired
    if (interview.expiresAt && new Date() > interview.expiresAt) {
      interview.status = InterviewStatus.EXPIRED;
      await interview.save();
      throw new AppError('Interview request has expired', 400);
    }

    // Verify interviewer has matching expertise
    const interviewerExpertise = interviewer.expertise || [];
    const hasMatchingSkill = interview.requestedSkills.some(skill => 
      interviewerExpertise.includes(skill)
    );

    if (!hasMatchingSkill) {
      throw new AppError('Your expertise does not match the requested skills', 400);
    }

    // Check for conflicting interviews for the interviewer
    const interviewDuration = duration || interview.preferredDuration || 60;
    const conflictingInterview = await Interview.findOne({
      interviewerId,
      scheduledAt: {
        $gte: new Date(scheduledAt.getTime() - interviewDuration * 60000),
        $lte: new Date(scheduledAt.getTime() + interviewDuration * 60000),
      },
      status: { $in: [InterviewStatus.SCHEDULED, InterviewStatus.IN_PROGRESS] },
    });

    if (conflictingInterview) {
      throw new AppError('You have a conflicting interview at this time', 409);
    }

    // Claim the interview
    interview.interviewerId = interviewerId as any;
    interview.scheduledAt = scheduledAt;
    interview.duration = interviewDuration;
    interview.claimedAt = new Date();
    await this.ensureMeetingUrl(interview, interviewerId);
    interview.status = InterviewStatus.SCHEDULED;
    await interview.save();

    // Update free interviews count if applicable
    if (!interview.isPaid) {
      await JobSeekerProfile.findOneAndUpdate(
        { userId: interview.jobSeekerId },
        { $inc: { 'interviewStats.freeInterviewsUsed': 1 } }
      );
    }

    // Notify the job seeker
    await notificationService.createNotification({
      userId: interview.jobSeekerId.toString(),
      type: 'interview_scheduled',
      title: 'Interview Scheduled!',
      message: `Great news! An interviewer has accepted your request. Your mock interview is scheduled for ${scheduledAt.toLocaleString()}.`,
      data: { interviewId: interview._id },
    });

    logger.info(`Interview ${interviewId} claimed by interviewer ${interviewerId}`);

    return interview;
  }

  /**
   * Get all interview requests made by a job seeker (including unclaimed ones).
   */
  async getJobSeekerRequests(
    jobSeekerId: string,
    pagination: PaginationQuery = {}
  ): Promise<{ interviews: IInterviewDocument[]; pagination: PaginationInfo }> {
    const { page = 1, limit = 10, sort = 'createdAt', order = 'desc' } = pagination;

    const query = { 
      jobSeekerId,
      status: { $in: [InterviewStatus.REQUESTED, InterviewStatus.EXPIRED] }
    };

    const total = await Interview.countDocuments(query);
    const totalPages = Math.ceil(total / limit);

    const interviews = await Interview.find(query)
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
  async expireOldRequests(): Promise<number> {
    const result = await Interview.updateMany(
      {
        status: InterviewStatus.REQUESTED,
        expiresAt: { $lte: new Date() },
      },
      {
        status: InterviewStatus.EXPIRED,
      }
    );

    if (result.modifiedCount > 0) {
      logger.info(`Expired ${result.modifiedCount} interview requests`);
    }

    return result.modifiedCount;
  }
}

export default new InterviewService();
