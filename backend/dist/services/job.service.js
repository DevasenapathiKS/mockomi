"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const models_1 = require("../models");
const types_1 = require("../types");
const errors_1 = require("../utils/errors");
const redis_1 = __importDefault(require("../config/redis"));
const logger_1 = __importDefault(require("../utils/logger"));
class JobService {
    async createJob(data) {
        // Get company profile
        const company = await models_1.CompanyProfile.findOne({ userId: data.employerId });
        if (!company) {
            throw new errors_1.AppError('Please complete your company profile first', 400);
        }
        const job = await models_1.Job.create({
            ...data,
            companyId: company._id,
            status: types_1.JobStatus.DRAFT,
        });
        // Invalidate jobs cache
        await redis_1.default.invalidatePattern('jobs:*');
        logger_1.default.info(`Job created: ${job.title} by employer: ${data.employerId}`);
        return job;
    }
    async updateJob(jobId, employerId, data) {
        const job = await models_1.Job.findOne({ _id: jobId, employerId });
        if (!job) {
            throw new errors_1.AppError('Job not found or unauthorized', 404);
        }
        Object.assign(job, data);
        await job.save();
        // Invalidate cache
        await redis_1.default.del(`job:${jobId}`);
        await redis_1.default.invalidatePattern('jobs:*');
        return job;
    }
    async deleteJob(jobId, employerId) {
        const job = await models_1.Job.findOne({ _id: jobId, employerId });
        if (!job) {
            throw new errors_1.AppError('Job not found or unauthorized', 404);
        }
        await job.deleteOne();
        // Invalidate cache
        await redis_1.default.del(`job:${jobId}`);
        await redis_1.default.invalidatePattern('jobs:*');
        logger_1.default.info(`Job deleted: ${jobId}`);
    }
    async publishJob(jobId, employerId) {
        const job = await models_1.Job.findOne({ _id: jobId, employerId });
        if (!job) {
            throw new errors_1.AppError('Job not found or unauthorized', 404);
        }
        if (job.status === types_1.JobStatus.ACTIVE) {
            throw new errors_1.AppError('Job is already published', 400);
        }
        job.status = types_1.JobStatus.ACTIVE;
        await job.save();
        // Invalidate cache
        await redis_1.default.del(`job:${jobId}`);
        await redis_1.default.invalidatePattern('jobs:*');
        return job;
    }
    async closeJob(jobId, employerId) {
        const job = await models_1.Job.findOne({ _id: jobId, employerId });
        if (!job) {
            throw new errors_1.AppError('Job not found or unauthorized', 404);
        }
        job.status = types_1.JobStatus.CLOSED;
        await job.save();
        // Invalidate cache
        await redis_1.default.del(`job:${jobId}`);
        await redis_1.default.invalidatePattern('jobs:*');
        return job;
    }
    async getJobById(jobId, incrementViews = false) {
        // Try cache first
        const cached = await redis_1.default.getJSON(`job:${jobId}`);
        if (cached && !incrementViews) {
            return cached;
        }
        const job = await models_1.Job.findById(jobId).populate({
            path: 'companyId',
            select: 'companyName logo industry companySize',
        });
        if (!job) {
            throw new errors_1.AppError('Job not found', 404);
        }
        if (incrementViews && job.status === types_1.JobStatus.ACTIVE) {
            job.viewsCount += 1;
            await job.save();
        }
        const result = job.toJSON();
        result.company = job.companyId?.toJSON?.() || job.companyId;
        // Cache for 10 minutes
        await redis_1.default.setJSON(`job:${jobId}`, result, 600);
        return result;
    }
    async searchJobs(filters, pagination) {
        const { page = 1, limit = 10, sort = 'createdAt', order = 'desc' } = pagination;
        // Build query
        const query = { status: types_1.JobStatus.ACTIVE };
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
        const total = await models_1.Job.countDocuments(query);
        const totalPages = Math.ceil(total / limit);
        // Execute query
        const jobs = await models_1.Job.find(query)
            .populate({
            path: 'companyId',
            select: 'companyName logo industry companySize',
        })
            .sort({ [sort]: order === 'asc' ? 1 : -1 })
            .skip((page - 1) * limit)
            .limit(limit);
        const result = jobs.map((job) => {
            const jobJson = job.toJSON();
            jobJson.company = job.companyId?.toJSON?.() || job.companyId;
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
    async getEmployerJobs(employerId, status, pagination = {}) {
        const { page = 1, limit = 10, sort = 'createdAt', order = 'desc' } = pagination;
        const query = { employerId };
        if (status) {
            query.status = status;
        }
        const total = await models_1.Job.countDocuments(query);
        const totalPages = Math.ceil(total / limit);
        const jobs = await models_1.Job.find(query)
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
    async getJobApplications(jobId, employerId, status, pagination = {}) {
        // Verify job ownership
        const job = await models_1.Job.findOne({ _id: jobId, employerId });
        if (!job) {
            throw new errors_1.AppError('Job not found or unauthorized', 404);
        }
        const { page = 1, limit = 10, sort = 'appliedAt', order = 'desc' } = pagination;
        const query = { jobId };
        if (status) {
            query.status = status;
        }
        const total = await models_1.JobApplication.countDocuments(query);
        const totalPages = Math.ceil(total / limit);
        const applications = await models_1.JobApplication.find(query)
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
exports.default = new JobService();
//# sourceMappingURL=job.service.js.map