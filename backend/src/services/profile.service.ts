import { User, JobSeekerProfile, CompanyProfile, InterviewerProfile, Interview, JobApplication } from '../models';
import { IJobSeekerProfile, ICompanyProfile, IInterviewerProfile, CandidateFilters, PaginationQuery, PaginationInfo } from '../types';
import { AppError } from '../utils/errors';
import redis from '../config/redis';
import s3Service from './s3.service';
import config from '../config';
import logger from '../utils/logger';

class ProfileService {
  // Job Seeker Profile Methods
  async getJobSeekerProfile(userId: string): Promise<any> {
    const cached = await redis.getJSON<any>(`profile:jobseeker:${userId}`);
    if (cached) {
      return cached;
    }

    const profile = await JobSeekerProfile.findOne({ userId })
      .populate('userId', 'firstName lastName email phone avatar');

    if (!profile) {
      throw new AppError('Profile not found', 404);
    }

    await redis.setJSON(`profile:jobseeker:${userId}`, profile.toJSON(), 600);

    return profile;
  }

  async updateJobSeekerProfile(userId: string, data: Partial<IJobSeekerProfile>): Promise<any> {
    let profile = await JobSeekerProfile.findOne({ userId });

    if (!profile) {
      profile = await JobSeekerProfile.create({
        userId,
        ...data,
        interviewStats: {
          totalInterviews: 0,
          freeInterviewsUsed: 0,
          averageRating: 0,
        },
      });
    } else {
      Object.assign(profile, data);
      await profile.save();
    }

    await redis.del(`profile:jobseeker:${userId}`);
    await redis.invalidatePattern('candidates:*');

    return profile;
  }

  async uploadResume(
    userId: string,
    file: Buffer,
    fileName: string,
    mimeType: string
  ): Promise<{ url: string; fileName: string }> {
    try {
      const key = `resumes/${userId}/${fileName}`;
      const { url } = await s3Service.uploadFile(file, key, mimeType);

      const profile = await JobSeekerProfile.findOne({ userId });
      if (!profile) {
        throw new AppError('Profile not found', 404);
      }

      profile.resume = {
        url,
        fileName,
        fileSize: file.length,
        mimeType,
        uploadedAt: new Date(),
      };
      await profile.save();

      await redis.del(`profile:jobseeker:${userId}`);

      return { url, fileName };
    } catch (error: any) {
      logger.error('Failed to upload resume', error);
      throw new AppError(
        'Unable to upload resume. Please verify storage credentials/config and try again.',
        500
      );
    }
  }

  // Company Profile Methods
  async getCompanyProfile(userId: string): Promise<any> {
    const cached = await redis.getJSON<any>(`profile:company:${userId}`);
    if (cached) {
      return cached;
    }

    const profile = await CompanyProfile.findOne({ userId })
      .populate('userId', 'firstName lastName email phone avatar');

    if (!profile) {
      throw new AppError('Company profile not found', 404);
    }

    await redis.setJSON(`profile:company:${userId}`, profile.toJSON(), 600);

    return profile;
  }

  async createCompanyProfile(userId: string, data: ICompanyProfile): Promise<any> {
    const existing = await CompanyProfile.findOne({ userId });
    if (existing) {
      throw new AppError('Company profile already exists', 409);
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { userId: _, ...profileData } = data as any;
    const profile = await CompanyProfile.create({
      userId,
      ...profileData,
    });

    return profile;
  }

  async updateCompanyProfile(userId: string, data: Partial<ICompanyProfile>): Promise<any> {
    let profile = await CompanyProfile.findOne({ userId });

    if (!profile) {
      throw new AppError('Company profile not found. Please create one first.', 404);
    }

    Object.assign(profile, data);
    await profile.save();

    await redis.del(`profile:company:${userId}`);

    return profile;
  }

  async uploadCompanyLogo(
    userId: string,
    file: Buffer,
    fileName: string,
    mimeType: string
  ): Promise<{ url: string }> {
    const key = `logos/${userId}/${fileName}`;
    const { url } = await s3Service.uploadFile(file, key, mimeType);

    const profile = await CompanyProfile.findOne({ userId });
    if (!profile) {
      throw new AppError('Company profile not found', 404);
    }

    profile.logo = url;
    await profile.save();

    await redis.del(`profile:company:${userId}`);

    return { url };
  }

  // Interviewer Profile Methods
  async getInterviewerProfile(userId: string): Promise<any> {
    const cached = await redis.getJSON<any>(`profile:interviewer:${userId}`);
    if (cached) {
      return cached;
    }

    const profile = await InterviewerProfile.findOne({ userId })
      .populate('userId', 'firstName lastName email phone avatar');

    if (!profile) {
      throw new AppError('Interviewer profile not found', 404);
    }

    await redis.setJSON(`profile:interviewer:${userId}`, profile.toJSON(), 600);

    return profile;
  }

  async updateInterviewerProfile(userId: string, data: Partial<IInterviewerProfile>): Promise<any> {
    let profile = await InterviewerProfile.findOne({ userId });

    if (!profile) {
      throw new AppError('Interviewer profile not found', 404);
    }

    // Don't allow updating approval status
    delete (data as any).isApproved;
    delete (data as any).approvedAt;
    delete (data as any).approvedBy;

    Object.assign(profile, data);
    await profile.save();

    await redis.del(`profile:interviewer:${userId}`);

    return profile;
  }

  // Candidate Search (for Employers)
  async searchCandidates(
    filters: CandidateFilters,
    pagination: PaginationQuery
  ): Promise<{ candidates: any[]; pagination: PaginationInfo }> {
    const { page = 1, limit = 10, sort = 'interviewStats.averageRating', order = 'desc' } = pagination;

    const query: any = {};

    if (filters.search) {
      query.$text = { $search: filters.search };
    }

    if (filters.skills && filters.skills.length > 0) {
      query['skills.name'] = { $in: filters.skills.map((s) => new RegExp(s, 'i')) };
    }

    if (filters.experienceYears) {
      if (filters.experienceYears.min !== undefined) {
        // Calculate total experience from work history would be more complex
        // For simplicity, we'll use skill years
      }
    }

    if (filters.location) {
      query.$or = [
        { 'location.city': new RegExp(filters.location, 'i') },
        { 'location.state': new RegExp(filters.location, 'i') },
      ];
    }

    if (filters.interviewRating !== undefined) {
      query['interviewStats.averageRating'] = { $gte: filters.interviewRating };
    }

    if (filters.hasCertifications) {
      query['certifications.0'] = { $exists: true };
    }

    if (filters.isActivelyLooking !== undefined) {
      query['preferences.isActivelyLooking'] = filters.isActivelyLooking;
    }

    const total = await JobSeekerProfile.countDocuments(query);
    const totalPages = Math.ceil(total / limit);

    const candidates = await JobSeekerProfile.find(query)
      .populate('userId', 'firstName lastName email avatar')
      .sort({ [sort]: order === 'asc' ? 1 : -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    return {
      candidates,
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

  // Get candidate details with interview feedback (for employers)
  async getCandidateDetails(candidateUserId: string): Promise<any> {
    const profile = await JobSeekerProfile.findOne({ userId: candidateUserId })
      .populate('userId', 'firstName lastName email avatar');

    if (!profile) {
      throw new AppError('Candidate not found', 404);
    }

    // Get public interview feedback
    const interviews = await Interview.find({
      jobSeekerId: candidateUserId,
      status: 'completed',
      'feedback.isPublic': true,
    })
      .select('scheduledAt feedback topic')
      .sort({ scheduledAt: -1 })
      .limit(5);

    return {
      profile,
      interviews,
    };
  }

  // User Profile (common methods)
  async updateAvatar(userId: string, file: Buffer, fileName: string, mimeType: string): Promise<{ url: string }> {
    const key = `avatars/${userId}/${fileName}`;
    const { url } = await s3Service.uploadFile(file, key, mimeType);

    await User.findByIdAndUpdate(userId, { avatar: url });

    await redis.del(`user:${userId}`);
    await redis.invalidatePattern(`profile:*:${userId}`);

    return { url };
  }

  async updateBasicInfo(
    userId: string,
    data: { firstName?: string; lastName?: string; phone?: string }
  ): Promise<any> {
    const user = await User.findByIdAndUpdate(userId, data, { new: true });
    if (!user) {
      throw new AppError('User not found', 404);
    }

    await redis.del(`user:${userId}`);

    return user;
  }
}

export default new ProfileService();
