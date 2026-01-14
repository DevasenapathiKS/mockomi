import { Response } from 'express';
import { applicationService, profileService } from '../services';
import { AuthRequest, ApplicationStatus } from '../types';
import { asyncHandler } from '../middlewares/errorHandler';

export const applyToJob = asyncHandler(async (req: AuthRequest, res: Response) => {
  // Get resume URL from profile
  const profile = await profileService.getJobSeekerProfile(req.user!.id);

  if (!profile.resume?.url) {
    return res.status(400).json({
      success: false,
      message: 'Please upload your resume before applying',
    });
  }

  const application = await applicationService.applyToJob({
    jobId: req.params.jobId,
    jobSeekerId: req.user!.id,
    coverLetter: req.body.coverLetter,
    resumeUrl: profile.resume.url,
  });

  res.status(201).json({
    success: true,
    message: 'Application submitted successfully',
    data: application,
  });
});

export const getMyApplications = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { page, limit, sort, order, status } = req.query as any;

  const result = await applicationService.getJobSeekerApplications(
    req.user!.id,
    status as ApplicationStatus,
    { page: Number(page) || 1, limit: Number(limit) || 10, sort, order }
  );

  res.status(200).json({
    success: true,
    data: result.applications,
    pagination: result.pagination,
  });
});

export const getApplicationById = asyncHandler(async (req: AuthRequest, res: Response) => {
  const application = await applicationService.getApplicationById(
    req.params.id,
    req.user!.id
  );

  res.status(200).json({
    success: true,
    data: application,
  });
});

export const updateApplicationStatus = asyncHandler(async (req: AuthRequest, res: Response) => {
  const application = await applicationService.updateApplicationStatus(
    req.params.id,
    req.user!.id,
    req.body.status,
    req.body.notes
  );

  res.status(200).json({
    success: true,
    message: 'Application status updated',
    data: application,
  });
});

export const withdrawApplication = asyncHandler(async (req: AuthRequest, res: Response) => {
  await applicationService.withdrawApplication(req.params.id, req.user!.id);

  res.status(200).json({
    success: true,
    message: 'Application withdrawn successfully',
  });
});

export const getApplicationStats = asyncHandler(async (req: AuthRequest, res: Response) => {
  const stats = await applicationService.getApplicationStats(req.user!.id);

  res.status(200).json({
    success: true,
    data: stats,
  });
});
