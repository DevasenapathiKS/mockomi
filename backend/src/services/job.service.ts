import { Job, JobApplication, CompanyProfile } from '../models';
import { IJobDocument } from '../models/Job';
import { JobStatus, ApplicationStatus, JobFilters, PaginationQuery, PaginationInfo } from '../types';
import { AppError } from '../utils/errors';
import redis from '../config/redis';
import logger from '../utils/logger';

interface CreateJobData {
  employerId: string;
  title: string;
  description: string;
  requirements?: string[];
  responsibilities?: string[];
  skills: string[];
  experienceLevel: string;
  // experienceYears: { min: number; max: number };
  employmentType: string;
  salary?: {
    min?: number;
    max?: number;
    currency?: string;
    isNegotiable?: boolean;
    showOnListing?: boolean;
  };
  location: {
    city: string;
    state?: string;
    country: string;
    isRemote?: boolean;
    isHybrid?: boolean;
  };
  benefits?: string[];
  applicationDeadline?: Date;
}

interface JobWithCompany extends IJobDocument {
  company?: {
    companyName: string;
    logo?: string;
    industry?: string;
    companySize?: string;
  };
}

class JobService {
  async createJob(data: CreateJobData): Promise<IJobDocument> {
    // Get company profile
    const company = await CompanyProfile.findOne({ userId: data.employerId });
    if (!company) {
      throw new AppError('Please complete your company profile first', 400);
    }

    const job = await Job.create({
      ...data,
      companyId: company._id,
      status: JobStatus.DRAFT,
    });

    // Invalidate jobs cache
    await redis.invalidatePattern('jobs:*');

    logger.info(`Job created: ${job.title} by employer: ${data.employerId}`);

    return job;
  }

  async updateJob(
    jobId: string,
    employerId: string,
    data: Partial<CreateJobData>
  ): Promise<IJobDocument> {
    const job = await Job.findOne({ _id: jobId, employerId });
    if (!job) {
      throw new AppError('Job not found or unauthorized', 404);
    }

    Object.assign(job, data);
    await job.save();

    // Invalidate cache
    await redis.del(`job:${jobId}`);
    await redis.invalidatePattern('jobs:*');

    return job;
  }

  async deleteJob(jobId: string, employerId: string): Promise<void> {
    const job = await Job.findOne({ _id: jobId, employerId });
    if (!job) {
      throw new AppError('Job not found or unauthorized', 404);
    }

    await job.deleteOne();

    // Invalidate cache
    await redis.del(`job:${jobId}`);
    await redis.invalidatePattern('jobs:*');

    logger.info(`Job deleted: ${jobId}`);
  }

  async publishJob(jobId: string, employerId: string): Promise<IJobDocument> {
    const job = await Job.findOne({ _id: jobId, employerId });
    if (!job) {
      throw new AppError('Job not found or unauthorized', 404);
    }

    if (job.status === JobStatus.ACTIVE) {
      throw new AppError('Job is already published', 400);
    }

    job.status = JobStatus.ACTIVE;
    await job.save();

    // Invalidate cache
    await redis.del(`job:${jobId}`);
    await redis.invalidatePattern('jobs:*');

    return job;
  }

  async closeJob(jobId: string, employerId: string): Promise<IJobDocument> {
    const job = await Job.findOne({ _id: jobId, employerId });
    if (!job) {
      throw new AppError('Job not found or unauthorized', 404);
    }

    job.status = JobStatus.CLOSED;
    await job.save();

    // Invalidate cache
    await redis.del(`job:${jobId}`);
    await redis.invalidatePattern('jobs:*');

    return job;
  }

  async getJobById(jobId: string, incrementViews: boolean = false): Promise<JobWithCompany> {
    // Try cache first
    const cached = await redis.getJSON<JobWithCompany>(`job:${jobId}`);
    if (cached && !incrementViews) {
      return cached;
    }

    const job = await Job.findById(jobId).populate({
      path: 'companyId',
      select: 'companyName logo industry companySize',
    });

    if (!job) {
      throw new AppError('Job not found', 404);
    }

    if (incrementViews && job.status === JobStatus.ACTIVE) {
      job.viewsCount += 1;
      await job.save();
    }

    const result = job.toJSON() as unknown as JobWithCompany;
    result.company = (job.companyId as any)?.toJSON?.() || job.companyId;

    // Cache for 10 minutes
    await redis.setJSON(`job:${jobId}`, result, 600);

    return result;
  }

  async searchJobs(
    filters: JobFilters,
    pagination: PaginationQuery
  ): Promise<{ jobs: JobWithCompany[]; pagination: PaginationInfo }> {
    const { page = 1, limit = 10, sort = 'createdAt', order = 'desc' } = pagination;

    // Build query
    const query: any = { status: JobStatus.ACTIVE };

    if (filters.search) {
      query.$text = { $search: filters.search };
    }

    if (filters.skills && filters.skills.length > 0) {
      query.skills = { $in: filters.skills.map((s) => new RegExp(s, 'i')) };
    }

    if (filters.experienceLevel && filters.experienceLevel.length > 0) {
      query.experienceLevel = { $in: filters.experienceLevel };
    }

    if (filters.employmentType && filters.employmentType.length > 0) {
      query.employmentType = { $in: filters.employmentType };
    }

    if (filters.location) {
      query.$or = [
        { 'location.city': new RegExp(filters.location, 'i') },
        { 'location.state': new RegExp(filters.location, 'i') },
        { 'location.country': new RegExp(filters.location, 'i') },
      ];
    }

    if (filters.isRemote !== undefined) {
      query['location.isRemote'] = filters.isRemote;
    }

    if (filters.salaryMin !== undefined) {
      query['salary.min'] = { $gte: filters.salaryMin };
    }

    if (filters.salaryMax !== undefined) {
      query['salary.max'] = { $lte: filters.salaryMax };
    }

    if (filters.postedAfter) {
      query.createdAt = { $gte: filters.postedAfter };
    }

    // Count total
    const total = await Job.countDocuments(query);
    const totalPages = Math.ceil(total / limit);

    // Execute query
    const jobs = await Job.find(query)
      .populate({
        path: 'companyId',
        select: 'companyName logo industry companySize',
      })
      .sort({ [sort]: order === 'asc' ? 1 : -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const result = jobs.map((job) => {
      const jobJson = job.toJSON() as unknown as JobWithCompany;
      jobJson.company = (job.companyId as any)?.toJSON?.() || job.companyId;
      return jobJson;
    });

    return {
      jobs: result,
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

  async getEmployerJobs(
    employerId: string,
    status?: JobStatus,
    pagination: PaginationQuery = {}
  ): Promise<{ jobs: IJobDocument[]; pagination: PaginationInfo }> {
    const { page = 1, limit = 10, sort = 'createdAt', order = 'desc' } = pagination;

    const query: any = { employerId };
    if (status) {
      query.status = status;
    }

    const total = await Job.countDocuments(query);
    const totalPages = Math.ceil(total / limit);

    const jobs = await Job.find(query)
      .sort({ [sort]: order === 'asc' ? 1 : -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    return {
      jobs,
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

  async getJobApplications(
    jobId: string,
    employerId: string,
    status?: ApplicationStatus,
    pagination: PaginationQuery = {}
  ): Promise<{ applications: any[]; pagination: PaginationInfo }> {
    // Verify job ownership
    const job = await Job.findOne({ _id: jobId, employerId });
    if (!job) {
      throw new AppError('Job not found or unauthorized', 404);
    }

    const { page = 1, limit = 10, sort = 'appliedAt', order = 'desc' } = pagination;

    const query: any = { jobId };
    if (status) {
      query.status = status;
    }

    const total = await JobApplication.countDocuments(query);
    const totalPages = Math.ceil(total / limit);

    const applications = await JobApplication.find(query)
      .populate({
        path: 'jobSeekerId',
        select: 'firstName lastName email avatar',
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
}

export default new JobService();
