import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { jobService, CreateJobData } from '@/services/jobService';
import { JobFilters, ApplicationStatus } from '@/types';

export const useJobs = (filters: JobFilters = {}, page = 1, limit = 10) => {
  return useQuery({
    queryKey: ['jobs', filters, page, limit],
    queryFn: () => jobService.getJobs(filters, page, limit),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

export const useJob = (id: string) => {
  return useQuery({
    queryKey: ['job', id],
    queryFn: () => jobService.getJob(id),
    enabled: !!id,
  });
};

export const useMyJobs = (page = 1, limit = 10) => {
  return useQuery({
    queryKey: ['my-jobs', page, limit],
    queryFn: () => jobService.getMyJobs(page, limit),
  });
};

export const useJobApplications = (jobId: string, page = 1, limit = 10) => {
  return useQuery({
    queryKey: ['job-applications', jobId, page, limit],
    queryFn: () => jobService.getJobApplications(jobId, page, limit),
    enabled: !!jobId,
  });
};

export const useCreateJob = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateJobData) => jobService.createJob(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-jobs'] });
      toast.success('Job created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create job');
    },
  });
};

export const useUpdateJob = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateJobData> }) =>
      jobService.updateJob(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['job', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['my-jobs'] });
      toast.success('Job updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update job');
    },
  });
};

export const useDeleteJob = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => jobService.deleteJob(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-jobs'] });
      toast.success('Job deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete job');
    },
  });
};

export const usePublishJob = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => jobService.publishJob(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['job', id] });
      queryClient.invalidateQueries({ queryKey: ['my-jobs'] });
      toast.success('Job published successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to publish job');
    },
  });
};

export const useCloseJob = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => jobService.closeJob(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['job', id] });
      queryClient.invalidateQueries({ queryKey: ['my-jobs'] });
      toast.success('Job closed successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to close job');
    },
  });
};

export const useApplyToJob = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ jobId, coverLetter }: { jobId: string; coverLetter?: string }) =>
      jobService.applyToJob(jobId, { coverLetter }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-applications'] });
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      toast.success('Application submitted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to submit application');
    },
  });
};

export const useMyApplications = (page = 1, limit = 10) => {
  return useQuery({
    queryKey: ['my-applications', page, limit],
    queryFn: () => jobService.getMyApplications(page, limit),
  });
};

export const useUpdateApplicationStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      applicationId,
      status,
      notes,
    }: {
      applicationId: string;
      status: ApplicationStatus;
      notes?: string;
    }) => jobService.updateApplicationStatus(applicationId, status, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job-applications'] });
      toast.success('Application status updated');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update application');
    },
  });
};

export const useWithdrawApplication = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (applicationId: string) => jobService.withdrawApplication(applicationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-applications'] });
      toast.success('Application withdrawn');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to withdraw application');
    },
  });
};
