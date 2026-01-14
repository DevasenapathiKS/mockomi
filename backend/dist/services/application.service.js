"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const models_1 = require("../models");
const types_1 = require("../types");
const errors_1 = require("../utils/errors");
const logger_1 = __importDefault(require("../utils/logger"));
const notification_service_1 = __importDefault(require("./notification.service"));
class ApplicationService {
    async applyToJob(data) {
        const { jobId, jobSeekerId, coverLetter, resumeUrl } = data;
        // Check if job exists and is active
        const job = await models_1.Job.findById(jobId);
        if (!job) {
            throw new errors_1.AppError('Job not found', 404);
        }
        if (job.status !== types_1.JobStatus.ACTIVE) {
            throw new errors_1.AppError('This job is no longer accepting applications', 400);
        }
        if (job.applicationDeadline && new Date() > job.applicationDeadline) {
            throw new errors_1.AppError('Application deadline has passed', 400);
        }
        // Check for duplicate application
        const existingApplication = await models_1.JobApplication.findOne({ jobId, jobSeekerId });
        if (existingApplication) {
            throw new errors_1.AppError('You have already applied to this job', 409);
        }
        // Create application
        const application = await models_1.JobApplication.create({
            jobId,
            jobSeekerId,
            coverLetter,
            resumeUrl,
            status: types_1.ApplicationStatus.APPLIED,
        });
        // Update job application count
        job.applicationsCount += 1;
        await job.save();
        // Notify employer
        await notification_service_1.default.createNotification({
            userId: job.employerId.toString(),
            type: 'application_received',
            title: 'New Application Received',
            message: `A candidate has applied for ${job.title}`,
            data: { jobId, applicationId: application._id },
        });
        logger_1.default.info(`Application created: ${application._id} for job: ${jobId}`);
        return application;
    }
    async getApplicationById(applicationId, userId) {
        const application = await models_1.JobApplication.findById(applicationId)
            .populate('jobId', 'title employerId companyId')
            .populate('jobSeekerId', 'firstName lastName email avatar');
        if (!application) {
            throw new errors_1.AppError('Application not found', 404);
        }
        // Check access (job seeker or employer)
        const job = application.jobId;
        if (application.jobSeekerId._id.toString() !== userId &&
            job.employerId.toString() !== userId) {
            throw new errors_1.AppError('Access denied', 403);
        }
        return application;
    }
    async getJobSeekerApplications(jobSeekerId, status, pagination = {}) {
        const { page = 1, limit = 10, sort = 'appliedAt', order = 'desc' } = pagination;
        const query = { jobSeekerId };
        if (status) {
            query.status = status;
        }
        const total = await models_1.JobApplication.countDocuments(query);
        const totalPages = Math.ceil(total / limit);
        const applications = await models_1.JobApplication.find(query)
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
    async updateApplicationStatus(applicationId, employerId, status, notes) {
        const application = await models_1.JobApplication.findById(applicationId).populate('jobId');
        if (!application) {
            throw new errors_1.AppError('Application not found', 404);
        }
        // Verify employer owns the job
        const job = application.jobId;
        if (job.employerId.toString() !== employerId) {
            throw new errors_1.AppError('Access denied', 403);
        }
        application.status = status;
        application.reviewedAt = new Date();
        application.reviewedBy = employerId;
        if (notes) {
            application.notes = notes;
        }
        await application.save();
        // Notify job seeker
        let notificationType = 'application_reviewed';
        let message = `Your application for ${job.title} has been reviewed.`;
        if (status === types_1.ApplicationStatus.SHORTLISTED) {
            notificationType = 'application_shortlisted';
            message = `Congratulations! You've been shortlisted for ${job.title}.`;
        }
        else if (status === types_1.ApplicationStatus.REJECTED) {
            notificationType = 'application_rejected';
            message = `Your application for ${job.title} was not selected.`;
        }
        else if (status === types_1.ApplicationStatus.INTERVIEW) {
            message = `You've been selected for an interview for ${job.title}.`;
        }
        else if (status === types_1.ApplicationStatus.OFFERED) {
            message = `Congratulations! You've received an offer for ${job.title}.`;
        }
        await notification_service_1.default.createNotification({
            userId: application.jobSeekerId.toString(),
            type: notificationType,
            title: 'Application Update',
            message,
            data: { applicationId, jobId: job._id },
        });
        return application;
    }
    async withdrawApplication(applicationId, jobSeekerId) {
        const application = await models_1.JobApplication.findOne({ _id: applicationId, jobSeekerId });
        if (!application) {
            throw new errors_1.AppError('Application not found', 404);
        }
        if (application.status === types_1.ApplicationStatus.WITHDRAWN) {
            throw new errors_1.AppError('Application already withdrawn', 400);
        }
        application.status = types_1.ApplicationStatus.WITHDRAWN;
        await application.save();
        // Decrease application count
        await models_1.Job.findByIdAndUpdate(application.jobId, {
            $inc: { applicationsCount: -1 },
        });
        logger_1.default.info(`Application withdrawn: ${applicationId}`);
    }
    async getApplicationStats(employerId) {
        // Get all jobs by employer
        const jobs = await models_1.Job.find({ employerId }).select('_id');
        const jobIds = jobs.map((j) => j._id);
        const [total, statusStats, recentCount] = await Promise.all([
            models_1.JobApplication.countDocuments({ jobId: { $in: jobIds } }),
            models_1.JobApplication.aggregate([
                { $match: { jobId: { $in: jobIds } } },
                { $group: { _id: '$status', count: { $sum: 1 } } },
            ]),
            models_1.JobApplication.countDocuments({
                jobId: { $in: jobIds },
                appliedAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
            }),
        ]);
        const byStatus = {};
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
exports.default = new ApplicationService();
//# sourceMappingURL=application.service.js.map