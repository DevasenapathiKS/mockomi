"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const models_1 = require("../models");
const errors_1 = require("../utils/errors");
const redis_1 = __importDefault(require("../config/redis"));
const s3_service_1 = __importDefault(require("./s3.service"));
const logger_1 = __importDefault(require("../utils/logger"));
class ProfileService {
    // Job Seeker Profile Methods
    async getJobSeekerProfile(userId) {
        const cached = await redis_1.default.getJSON(`profile:jobseeker:${userId}`);
        if (cached) {
            return cached;
        }
        const profile = await models_1.JobSeekerProfile.findOne({ userId })
            .populate('userId', 'firstName lastName email phone avatar');
        if (!profile) {
            throw new errors_1.AppError('Profile not found', 404);
        }
        await redis_1.default.setJSON(`profile:jobseeker:${userId}`, profile.toJSON(), 600);
        return profile;
    }
    async updateJobSeekerProfile(userId, data) {
        let profile = await models_1.JobSeekerProfile.findOne({ userId });
        if (!profile) {
            profile = await models_1.JobSeekerProfile.create({
                userId,
                ...data,
                interviewStats: {
                    totalInterviews: 0,
                    freeInterviewsUsed: 0,
                    averageRating: 0,
                },
            });
        }
        else {
            Object.assign(profile, data);
            await profile.save();
        }
        await redis_1.default.del(`profile:jobseeker:${userId}`);
        await redis_1.default.invalidatePattern('candidates:*');
        return profile;
    }
    async uploadResume(userId, file, fileName, mimeType) {
        try {
            const key = `resumes/${userId}/${fileName}`;
            const { url } = await s3_service_1.default.uploadFile(file, key, mimeType);
            const profile = await models_1.JobSeekerProfile.findOne({ userId });
            if (!profile) {
                throw new errors_1.AppError('Profile not found', 404);
            }
            profile.resume = {
                url,
                fileName,
                fileSize: file.length,
                mimeType,
                uploadedAt: new Date(),
            };
            await profile.save();
            await redis_1.default.del(`profile:jobseeker:${userId}`);
            return { url, fileName };
        }
        catch (error) {
            logger_1.default.error('Failed to upload resume', error);
            throw new errors_1.AppError('Unable to upload resume. Please verify storage credentials/config and try again.', 500);
        }
    }
    // Company Profile Methods
    async getCompanyProfile(userId) {
        const cached = await redis_1.default.getJSON(`profile:company:${userId}`);
        if (cached) {
            return cached;
        }
        const profile = await models_1.CompanyProfile.findOne({ userId })
            .populate('userId', 'firstName lastName email phone avatar');
        if (!profile) {
            throw new errors_1.AppError('Company profile not found', 404);
        }
        await redis_1.default.setJSON(`profile:company:${userId}`, profile.toJSON(), 600);
        return profile;
    }
    async createCompanyProfile(userId, data) {
        const existing = await models_1.CompanyProfile.findOne({ userId });
        if (existing) {
            throw new errors_1.AppError('Company profile already exists', 409);
        }
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { userId: _, ...profileData } = data;
        const profile = await models_1.CompanyProfile.create({
            userId,
            ...profileData,
        });
        return profile;
    }
    async updateCompanyProfile(userId, data) {
        let profile = await models_1.CompanyProfile.findOne({ userId });
        if (!profile) {
            throw new errors_1.AppError('Company profile not found. Please create one first.', 404);
        }
        Object.assign(profile, data);
        await profile.save();
        await redis_1.default.del(`profile:company:${userId}`);
        return profile;
    }
    async uploadCompanyLogo(userId, file, fileName, mimeType) {
        const key = `logos/${userId}/${fileName}`;
        const { url } = await s3_service_1.default.uploadFile(file, key, mimeType);
        const profile = await models_1.CompanyProfile.findOne({ userId });
        if (!profile) {
            throw new errors_1.AppError('Company profile not found', 404);
        }
        profile.logo = url;
        await profile.save();
        await redis_1.default.del(`profile:company:${userId}`);
        return { url };
    }
    // Interviewer Profile Methods
    async getInterviewerProfile(userId) {
        const cached = await redis_1.default.getJSON(`profile:interviewer:${userId}`);
        if (cached) {
            return cached;
        }
        const profile = await models_1.InterviewerProfile.findOne({ userId })
            .populate('userId', 'firstName lastName email phone avatar');
        if (!profile) {
            throw new errors_1.AppError('Interviewer profile not found', 404);
        }
        await redis_1.default.setJSON(`profile:interviewer:${userId}`, profile.toJSON(), 600);
        return profile;
    }
    async updateInterviewerProfile(userId, data) {
        let profile = await models_1.InterviewerProfile.findOne({ userId });
        if (!profile) {
            throw new errors_1.AppError('Interviewer profile not found', 404);
        }
        // Don't allow updating approval status
        delete data.isApproved;
        delete data.approvedAt;
        delete data.approvedBy;
        Object.assign(profile, data);
        await profile.save();
        await redis_1.default.del(`profile:interviewer:${userId}`);
        return profile;
    }
    // Candidate Search (for Employers)
    async searchCandidates(filters, pagination) {
        const { page = 1, limit = 10, sort = 'interviewStats.averageRating', order = 'desc' } = pagination;
        const query = {};
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
        const total = await models_1.JobSeekerProfile.countDocuments(query);
        const totalPages = Math.ceil(total / limit);
        const candidates = await models_1.JobSeekerProfile.find(query)
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
    async getCandidateDetails(candidateUserId) {
        const profile = await models_1.JobSeekerProfile.findOne({ userId: candidateUserId })
            .populate('userId', 'firstName lastName email avatar');
        if (!profile) {
            throw new errors_1.AppError('Candidate not found', 404);
        }
        // Get public interview feedback
        const interviews = await models_1.Interview.find({
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
    async updateAvatar(userId, file, fileName, mimeType) {
        const key = `avatars/${userId}/${fileName}`;
        const { url } = await s3_service_1.default.uploadFile(file, key, mimeType);
        await models_1.User.findByIdAndUpdate(userId, { avatar: url });
        await redis_1.default.del(`user:${userId}`);
        await redis_1.default.invalidatePattern(`profile:*:${userId}`);
        return { url };
    }
    async updateBasicInfo(userId, data) {
        const user = await models_1.User.findByIdAndUpdate(userId, data, { new: true });
        if (!user) {
            throw new errors_1.AppError('User not found', 404);
        }
        await redis_1.default.del(`user:${userId}`);
        return user;
    }
}
exports.default = new ProfileService();
//# sourceMappingURL=profile.service.js.map