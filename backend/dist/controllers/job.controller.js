"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getJobApplications = exports.getEmployerJobs = exports.searchJobs = exports.getJobById = exports.closeJob = exports.publishJob = exports.deleteJob = exports.updateJob = exports.createJob = void 0;
const services_1 = require("../services");
const errorHandler_1 = require("../middlewares/errorHandler");
exports.createJob = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const job = await services_1.jobService.createJob({
        ...req.body,
        employerId: req.user.id,
    });
    res.status(201).json({
        success: true,
        message: 'Job created successfully',
        data: job,
    });
});
exports.updateJob = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const job = await services_1.jobService.updateJob(req.params.id, req.user.id, req.body);
    res.status(200).json({
        success: true,
        message: 'Job updated successfully',
        data: job,
    });
});
exports.deleteJob = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    await services_1.jobService.deleteJob(req.params.id, req.user.id);
    res.status(200).json({
        success: true,
        message: 'Job deleted successfully',
    });
});
exports.publishJob = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const job = await services_1.jobService.publishJob(req.params.id, req.user.id);
    res.status(200).json({
        success: true,
        message: 'Job published successfully',
        data: job,
    });
});
exports.closeJob = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const job = await services_1.jobService.closeJob(req.params.id, req.user.id);
    res.status(200).json({
        success: true,
        message: 'Job closed successfully',
        data: job,
    });
});
exports.getJobById = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const job = await services_1.jobService.getJobById(req.params.id, true);
    res.status(200).json({
        success: true,
        data: job,
    });
});
exports.searchJobs = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { page, limit, sort, order, ...filters } = req.query;
    const result = await services_1.jobService.searchJobs({
        search: filters.search,
        skills: filters.skills ? filters.skills.split(',') : undefined,
        experienceLevel: filters.experienceLevel ? [filters.experienceLevel] : undefined,
        employmentType: filters.employmentType ? [filters.employmentType] : undefined,
        location: filters.location,
        isRemote: filters.isRemote === 'true',
        salaryMin: filters.salaryMin ? Number(filters.salaryMin) : undefined,
        salaryMax: filters.salaryMax ? Number(filters.salaryMax) : undefined,
    }, { page: Number(page) || 1, limit: Number(limit) || 10, sort, order });
    res.status(200).json({
        success: true,
        data: result.jobs,
        pagination: result.pagination,
    });
});
exports.getEmployerJobs = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { page, limit, sort, order, status } = req.query;
    const result = await services_1.jobService.getEmployerJobs(req.user.id, status, { page: Number(page) || 1, limit: Number(limit) || 10, sort, order });
    res.status(200).json({
        success: true,
        data: result.jobs,
        pagination: result.pagination,
    });
});
exports.getJobApplications = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { page, limit, sort, order, status } = req.query;
    const result = await services_1.jobService.getJobApplications(req.params.id, req.user.id, status, { page: Number(page) || 1, limit: Number(limit) || 10, sort, order });
    res.status(200).json({
        success: true,
        data: result.applications,
        pagination: result.pagination,
    });
});
//# sourceMappingURL=job.controller.js.map