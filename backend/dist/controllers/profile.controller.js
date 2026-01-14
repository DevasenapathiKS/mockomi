"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateBasicInfo = exports.uploadAvatar = exports.getCandidateDetails = exports.searchCandidates = exports.updateInterviewerProfile = exports.getInterviewerProfile = exports.uploadCompanyLogo = exports.updateCompanyProfile = exports.createCompanyProfile = exports.getCompanyProfile = exports.uploadResume = exports.updateJobSeekerProfile = exports.getJobSeekerProfile = void 0;
const services_1 = require("../services");
const errorHandler_1 = require("../middlewares/errorHandler");
// Job Seeker Profile
exports.getJobSeekerProfile = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const profile = await services_1.profileService.getJobSeekerProfile(req.user.id);
    res.status(200).json({
        success: true,
        data: profile,
    });
});
exports.updateJobSeekerProfile = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const profile = await services_1.profileService.updateJobSeekerProfile(req.user.id, req.body);
    res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        data: profile,
    });
});
exports.uploadResume = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    if (!req.file) {
        return res.status(400).json({
            success: false,
            message: 'No file uploaded',
        });
    }
    const result = await services_1.profileService.uploadResume(req.user.id, req.file.buffer, req.file.originalname, req.file.mimetype);
    res.status(200).json({
        success: true,
        message: 'Resume uploaded successfully',
        data: result,
    });
});
// Company Profile
exports.getCompanyProfile = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const profile = await services_1.profileService.getCompanyProfile(req.user.id);
    res.status(200).json({
        success: true,
        data: profile,
    });
});
exports.createCompanyProfile = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const profile = await services_1.profileService.createCompanyProfile(req.user.id, req.body);
    res.status(201).json({
        success: true,
        message: 'Company profile created successfully',
        data: profile,
    });
});
exports.updateCompanyProfile = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const profile = await services_1.profileService.updateCompanyProfile(req.user.id, req.body);
    res.status(200).json({
        success: true,
        message: 'Company profile updated successfully',
        data: profile,
    });
});
exports.uploadCompanyLogo = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    if (!req.file) {
        return res.status(400).json({
            success: false,
            message: 'No file uploaded',
        });
    }
    const result = await services_1.profileService.uploadCompanyLogo(req.user.id, req.file.buffer, req.file.originalname, req.file.mimetype);
    res.status(200).json({
        success: true,
        message: 'Logo uploaded successfully',
        data: result,
    });
});
// Interviewer Profile
exports.getInterviewerProfile = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const profile = await services_1.profileService.getInterviewerProfile(req.user.id);
    res.status(200).json({
        success: true,
        data: profile,
    });
});
exports.updateInterviewerProfile = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const profile = await services_1.profileService.updateInterviewerProfile(req.user.id, req.body);
    res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        data: profile,
    });
});
// Candidate Search (for Employers)
exports.searchCandidates = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { page, limit, sort, order, ...filters } = req.query;
    const result = await services_1.profileService.searchCandidates({
        search: filters.search,
        skills: filters.skills ? filters.skills.split(',') : undefined,
        experienceYears: {
            min: filters.experienceMin ? Number(filters.experienceMin) : undefined,
            max: filters.experienceMax ? Number(filters.experienceMax) : undefined,
        },
        location: filters.location,
        interviewRating: filters.interviewRating ? Number(filters.interviewRating) : undefined,
        hasCertifications: filters.hasCertifications === 'true',
        isActivelyLooking: filters.isActivelyLooking === 'true',
    }, { page: Number(page) || 1, limit: Number(limit) || 10, sort, order });
    res.status(200).json({
        success: true,
        data: result.candidates,
        pagination: result.pagination,
    });
});
exports.getCandidateDetails = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const result = await services_1.profileService.getCandidateDetails(req.params.id);
    res.status(200).json({
        success: true,
        data: result,
    });
});
// Common
exports.uploadAvatar = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    if (!req.file) {
        return res.status(400).json({
            success: false,
            message: 'No file uploaded',
        });
    }
    const result = await services_1.profileService.updateAvatar(req.user.id, req.file.buffer, req.file.originalname, req.file.mimetype);
    res.status(200).json({
        success: true,
        message: 'Avatar uploaded successfully',
        data: result,
    });
});
exports.updateBasicInfo = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const result = await services_1.profileService.updateBasicInfo(req.user.id, req.body);
    res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        data: result,
    });
});
//# sourceMappingURL=profile.controller.js.map