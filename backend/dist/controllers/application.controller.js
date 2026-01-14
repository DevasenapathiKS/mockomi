"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getApplicationStats = exports.withdrawApplication = exports.updateApplicationStatus = exports.getApplicationById = exports.getMyApplications = exports.applyToJob = void 0;
const services_1 = require("../services");
const errorHandler_1 = require("../middlewares/errorHandler");
exports.applyToJob = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    // Get resume URL from profile
    const profile = await services_1.profileService.getJobSeekerProfile(req.user.id);
    if (!profile.resume?.url) {
        return res.status(400).json({
            success: false,
            message: 'Please upload your resume before applying',
        });
    }
    const application = await services_1.applicationService.applyToJob({
        jobId: req.params.jobId,
        jobSeekerId: req.user.id,
        coverLetter: req.body.coverLetter,
        resumeUrl: profile.resume.url,
    });
    res.status(201).json({
        success: true,
        message: 'Application submitted successfully',
        data: application,
    });
});
exports.getMyApplications = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { page, limit, sort, order, status } = req.query;
    const result = await services_1.applicationService.getJobSeekerApplications(req.user.id, status, { page: Number(page) || 1, limit: Number(limit) || 10, sort, order });
    res.status(200).json({
        success: true,
        data: result.applications,
        pagination: result.pagination,
    });
});
exports.getApplicationById = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const application = await services_1.applicationService.getApplicationById(req.params.id, req.user.id);
    res.status(200).json({
        success: true,
        data: application,
    });
});
exports.updateApplicationStatus = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const application = await services_1.applicationService.updateApplicationStatus(req.params.id, req.user.id, req.body.status, req.body.notes);
    res.status(200).json({
        success: true,
        message: 'Application status updated',
        data: application,
    });
});
exports.withdrawApplication = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    await services_1.applicationService.withdrawApplication(req.params.id, req.user.id);
    res.status(200).json({
        success: true,
        message: 'Application withdrawn successfully',
    });
});
exports.getApplicationStats = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const stats = await services_1.applicationService.getApplicationStats(req.user.id);
    res.status(200).json({
        success: true,
        data: stats,
    });
});
//# sourceMappingURL=application.controller.js.map