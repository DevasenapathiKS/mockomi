import { Response } from 'express';
import { profileService } from '../services';
import { AuthRequest, UserRole } from '../types';
import { asyncHandler } from '../middlewares/errorHandler';

// Job Seeker Profile
export const getJobSeekerProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
  const profile = await profileService.getJobSeekerProfile(req.user!.id);

  res.status(200).json({
    success: true,
    data: profile,
  });
});

export const updateJobSeekerProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
  const profile = await profileService.updateJobSeekerProfile(req.user!.id, req.body);

  res.status(200).json({
    success: true,
    message: 'Profile updated successfully',
    data: profile,
  });
});

export const uploadResume = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'No file uploaded',
    });
  }

  const result = await profileService.uploadResume(
    req.user!.id,
    req.file.buffer,
    req.file.originalname,
    req.file.mimetype
  );

  res.status(200).json({
    success: true,
    message: 'Resume uploaded successfully',
    data: result,
  });
});

// Company Profile
export const getCompanyProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
  const profile = await profileService.getCompanyProfile(req.user!.id);

  res.status(200).json({
    success: true,
    data: profile,
  });
});

export const createCompanyProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
  const profile = await profileService.createCompanyProfile(req.user!.id, req.body);

  res.status(201).json({
    success: true,
    message: 'Company profile created successfully',
    data: profile,
  });
});

export const updateCompanyProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
  const profile = await profileService.updateCompanyProfile(req.user!.id, req.body);

  res.status(200).json({
    success: true,
    message: 'Company profile updated successfully',
    data: profile,
  });
});

export const uploadCompanyLogo = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'No file uploaded',
    });
  }

  const result = await profileService.uploadCompanyLogo(
    req.user!.id,
    req.file.buffer,
    req.file.originalname,
    req.file.mimetype
  );

  res.status(200).json({
    success: true,
    message: 'Logo uploaded successfully',
    data: result,
  });
});

// Interviewer Profile
export const getInterviewerProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
  const profile = await profileService.getInterviewerProfile(req.user!.id);

  res.status(200).json({
    success: true,
    data: profile,
  });
});

export const updateInterviewerProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
  const profile = await profileService.updateInterviewerProfile(req.user!.id, req.body);

  res.status(200).json({
    success: true,
    message: 'Profile updated successfully',
    data: profile,
  });
});

// Candidate Search (for Employers)
export const searchCandidates = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { page, limit, sort, order, ...filters } = req.query as any;

  const result = await profileService.searchCandidates(
    {
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
    },
    { page: Number(page) || 1, limit: Number(limit) || 10, sort, order }
  );

  res.status(200).json({
    success: true,
    data: result.candidates,
    pagination: result.pagination,
  });
});

export const getCandidateDetails = asyncHandler(async (req: AuthRequest, res: Response) => {
  const result = await profileService.getCandidateDetails(req.params.id);

  res.status(200).json({
    success: true,
    data: result,
  });
});

// Common
export const uploadAvatar = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'No file uploaded',
    });
  }

  const result = await profileService.updateAvatar(
    req.user!.id,
    req.file.buffer,
    req.file.originalname,
    req.file.mimetype
  );

  res.status(200).json({
    success: true,
    message: 'Avatar uploaded successfully',
    data: result,
  });
});

export const updateBasicInfo = asyncHandler(async (req: AuthRequest, res: Response) => {
  const result = await profileService.updateBasicInfo(req.user!.id, req.body);

  res.status(200).json({
    success: true,
    message: 'Profile updated successfully',
    data: result,
  });
});
