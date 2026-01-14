import { Job, JobApplication, JobSeekerProfile } from '../models';
import { IJobApplicationDocument } from '../models/JobApplication';
import { ApplicationStatus, JobStatus, PaginationQuery, PaginationInfo } from '../types';
import { AppError } from '../utils/errors';
import redis from '../config/redis';
import logger from '../utils/logger';
import notificationService from './notification.service';

interface CreateApplicationData {
  jobId: string;
  jobSeekerId: string;
  coverLetter?: string;
  resumeUrl: string;
}

class ApplicationService {
  async applyToJob(data: CreateApplicationData): Promise<IJobApplicationDocument> {
    const { jobId, jobSeekerId, coverLetter, resumeUrl } = data;

    // Check if job exists and is active
    const job = await Job.findById(jobId);
    if (!job) {
      throw new AppError('Job not found', 404);
    }

    if (job.status !== JobStatus.ACTIVE) {
      throw new AppError('This job is no longer accepting applications', 400);
    }

    if (job.applicationDeadline && new Date() > job.applicationDeadline) {
      throw new AppError('Application deadline has passed', 400);
    }

    // Check for duplicate application
    const existingApplication = await JobApplication.findOne({ jobId, jobSeekerId });
    if (existingApplication) {
      throw new AppError('You have already applied to this job', 409);
    }

    // Create application
    const application = await JobApplication.create({
      jobId,
      jobSeekerId,
      coverLetter,
      resumeUrl,
      status: ApplicationStatus.APPLIED,
    });

    // Update job application count
    job.applicationsCount += 1;
    await job.save();

    // Notify employer
    await notificationService.createNotification({
      userId: job.employerId.toString(),
      type: 'application_received',
      title: 'New Application Received',
      message: `A candidate has applied for ${job.title}`,
      data: { jobId, applicationId: application._id },
    });

    logger.info(`Application created: ${application._id} for job: ${jobId}`);

    return application;
  }

  async getApplicationById(applicationId: string, userId: string): Promise<IJobApplicationDocument> {
    const application = await JobApplication.findById(applicationId)
      .populate('jobId', 'title employerId companyId')
      .populate('jobSeekerId', 'firstName lastName email avatar');

    if (!application) {
      throw new AppError('Application not found', 404);
    }

    // Check access (job seeker or employer)
    const job = application.jobId as any;
    if (
      application.jobSeekerId._id.toString() !== userId &&
      job.employerId.toString() !== userId
    ) {
      throw new AppError('Access denied', 403);
    }

    return application;
  }

  async getJobSeekerApplications(
    jobSeekerId: string,
    status?: ApplicationStatus,
    pagination: PaginationQuery = {}
  ): Promise<{ applications: IJobApplicationDocument[]; pagination: PaginationInfo }> {
    const { page = 1, limit = 10, sort = 'appliedAt', order = 'desc' } = pagination;

    const query: any = { jobSeekerId };
    if (status) {
      query.status = status;
    }

    const total = await JobApplication.countDocuments(query);
    const totalPages = Math.ceil(total / limit);

    const applications = await JobApplication.find(query)
      .populate({
        path: 'jobId',
        select: 'title companyId location employmentType salary status',
        populate: {
          path: 'companyId',
          select: 'companyName logo',
        },
      })
      .sort({ [sort]: order === 'asc' ? 1 : -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    return {
      applications,
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

  async updateApplicationStatus(
    applicationId: string,
    employerId: string,
    status: ApplicationStatus,
    notes?: string
  ): Promise<IJobApplicationDocument> {
    const application = await JobApplication.findById(applicationId).populate('jobId');
    if (!application) {
      throw new AppError('Application not found', 404);
    }

    // Verify employer owns the job
    const job = application.jobId as any;
    if (job.employerId.toString() !== employerId) {
      throw new AppError('Access denied', 403);
    }

    application.status = status;
    application.reviewedAt = new Date();
    application.reviewedBy = employerId as any;
    if (notes) {
      application.notes = notes;
    }
    await application.save();

    // Notify job seeker
    let notificationType = 'application_reviewed';
    let message = `Your application for ${job.title} has been reviewed.`;

    if (status === ApplicationStatus.SHORTLISTED) {
      notificationType = 'application_shortlisted';
      message = `Congratulations! You've been shortlisted for ${job.title}.`;
    } else if (status === ApplicationStatus.REJECTED) {
      notificationType = 'application_rejected';
      message = `Your application for ${job.title} was not selected.`;
    } else if (status === ApplicationStatus.INTERVIEW) {
      message = `You've been selected for an interview for ${job.title}.`;
    } else if (status === ApplicationStatus.OFFERED) {
      message = `Congratulations! You've received an offer for ${job.title}.`;
    }

    await notificationService.createNotification({
      userId: application.jobSeekerId.toString(),
      type: notificationType,
      title: 'Application Update',
      message,
      data: { applicationId, jobId: job._id },
    });

    return application;
  }

  async withdrawApplication(applicationId: string, jobSeekerId: string): Promise<void> {
    const application = await JobApplication.findOne({ _id: applicationId, jobSeekerId });
    if (!application) {
      throw new AppError('Application not found', 404);
    }

    if (application.status === ApplicationStatus.WITHDRAWN) {
      throw new AppError('Application already withdrawn', 400);
    }

    application.status = ApplicationStatus.WITHDRAWN;
    await application.save();

    // Decrease application count
    await Job.findByIdAndUpdate(application.jobId, {
      $inc: { applicationsCount: -1 },
    });

    logger.info(`Application withdrawn: ${applicationId}`);
  }

  async getApplicationStats(employerId: string): Promise<{
    total: number;
    byStatus: Record<string, number>;
    recentApplications: number;
  }> {
    // Get all jobs by employer
    const jobs = await Job.find({ employerId }).select('_id');
    const jobIds = jobs.map((j) => j._id);

    const [total, statusStats, recentCount] = await Promise.all([
      JobApplication.countDocuments({ jobId: { $in: jobIds } }),
      JobApplication.aggregate([
        { $match: { jobId: { $in: jobIds } } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      JobApplication.countDocuments({
        jobId: { $in: jobIds },
        appliedAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      }),
    ]);

    const byStatus: Record<string, number> = {};
    statusStats.forEach((stat) => {
      byStatus[stat._id] = stat.count;
    });

    return {
      total,
      byStatus,
      recentApplications: recentCount,
    };
  }
}

export default new ApplicationService();
