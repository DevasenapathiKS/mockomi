import { Response } from 'express';
import { jobService } from '../services';
import { AuthRequest, JobStatus } from '../types';
import { asyncHandler } from '../middlewares/errorHandler';

export const createJob = asyncHandler(async (req: AuthRequest, res: Response) => {
  const job = await jobService.createJob({
    ...req.body,
    employerId: req.user!.id,
  });

  res.status(201).json({
    success: true,
    message: 'Job created successfully',
    data: job,
  });
});

export const updateJob = asyncHandler(async (req: AuthRequest, res: Response) => {
  const job = await jobService.updateJob(
    req.params.id,
    req.user!.id,
    req.body
  );

  res.status(200).json({
    success: true,
    message: 'Job updated successfully',
    data: job,
  });
});

export const deleteJob = asyncHandler(async (req: AuthRequest, res: Response) => {
  await jobService.deleteJob(req.params.id, req.user!.id);

  res.status(200).json({
    success: true,
    message: 'Job deleted successfully',
  });
});

export const publishJob = asyncHandler(async (req: AuthRequest, res: Response) => {
  const job = await jobService.publishJob(req.params.id, req.user!.id);

  res.status(200).json({
    success: true,
    message: 'Job published successfully',
    data: job,
  });
});

export const closeJob = asyncHandler(async (req: AuthRequest, res: Response) => {
  const job = await jobService.closeJob(req.params.id, req.user!.id);

  res.status(200).json({
    success: true,
    message: 'Job closed successfully',
    data: job,
  });
});

export const getJobById = asyncHandler(async (req: AuthRequest, res: Response) => {
  const job = await jobService.getJobById(req.params.id, true);

  res.status(200).json({
    success: true,
    data: job,
  });
});

export const searchJobs = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { page, limit, sort, order, ...filters } = req.query as any;

  const result = await jobService.searchJobs(
    {
      search: filters.search,
      skills: filters.skills ? filters.skills.split(',') : undefined,
      experienceLevel: filters.experienceLevel ? [filters.experienceLevel] : undefined,
      employmentType: filters.employmentType ? [filters.employmentType] : undefined,
      location: filters.location,
      isRemote: filters.isRemote === 'true',
      salaryMin: filters.salaryMin ? Number(filters.salaryMin) : undefined,
      salaryMax: filters.salaryMax ? Number(filters.salaryMax) : undefined,
    },
    { page: Number(page) || 1, limit: Number(limit) || 10, sort, order }
  );

  res.status(200).json({
    success: true,
    data: result.jobs,
    pagination: result.pagination,
  });
});

export const getEmployerJobs = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { page, limit, sort, order, status } = req.query as any;

  const result = await jobService.getEmployerJobs(
    req.user!.id,
    status as JobStatus,
    { page: Number(page) || 1, limit: Number(limit) || 10, sort, order }
  );

  res.status(200).json({
    success: true,
    data: result.jobs,
    pagination: result.pagination,
  });
});

export const getJobApplications = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { page, limit, sort, order, status } = req.query as any;

  const result = await jobService.getJobApplications(
    req.params.id,
    req.user!.id,
    status,
    { page: Number(page) || 1, limit: Number(limit) || 10, sort, order }
  );

  res.status(200).json({
    success: true,
    data: result.applications,
    pagination: result.pagination,
  });
});
