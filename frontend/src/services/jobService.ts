import api, { handleApiError } from './api';
import { Job, JobFilters, ApiResponse, PaginatedResponse, JobApplication, ApplicationStatus } from '@/types';

export interface CreateJobData {
  title: string;
  description: string;
  requirements: string[];
  responsibilities: string[];
  skills: string[];
  jobType: string;
  experienceLevel: string;
  location: {
    city?: string;
    state?: string;
    country: string;
    remote: boolean;
  };
  salary?: {
    min?: number;
    max?: number;
    currency: string;
    period: string;
  };
  benefits?: string[];
  applicationDeadline?: string;
}

export const jobService = {
  // Get jobs with filters and pagination
  getJobs: async (
    filters: JobFilters = {},
    page = 1,
    limit = 10
  ): Promise<PaginatedResponse<Job>> => {
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      });

      if (filters.search) params.append('search', filters.search);
      if (filters.jobType?.length) params.append('jobType', filters.jobType.join(','));
      if (filters.experienceLevel?.length) params.append('experienceLevel', filters.experienceLevel.join(','));
      if (filters.location) params.append('location', filters.location);
      if (filters.remote !== undefined) params.append('remote', String(filters.remote));
      if (filters.salaryMin) params.append('salaryMin', String(filters.salaryMin));
      if (filters.salaryMax) params.append('salaryMax', String(filters.salaryMax));
      if (filters.skills?.length) params.append('skills', filters.skills.join(','));
      if (filters.postedAfter) params.append('postedAfter', filters.postedAfter);

      const response = await api.get<PaginatedResponse<Job>>(`/jobs?${params.toString()}`);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error as Parameters<typeof handleApiError>[0]));
    }
  },

  // Get single job by ID
  getJob: async (id: string): Promise<Job> => {
    try {
      const response = await api.get<ApiResponse<Job>>(`/jobs/${id}`);
      return response.data.data!;
    } catch (error) {
      throw new Error(handleApiError(error as Parameters<typeof handleApiError>[0]));
    }
  },

  // Create new job (employer only)
  createJob: async (data: CreateJobData): Promise<Job> => {
    try {
      const response = await api.post<ApiResponse<Job>>('/jobs', data);
      return response.data.data!;
    } catch (error) {
      throw new Error(handleApiError(error as Parameters<typeof handleApiError>[0]));
    }
  },

  // Update job
  updateJob: async (id: string, data: Partial<CreateJobData>): Promise<Job> => {
    try {
      const response = await api.put<ApiResponse<Job>>(`/jobs/${id}`, data);
      return response.data.data!;
    } catch (error) {
      throw new Error(handleApiError(error as Parameters<typeof handleApiError>[0]));
    }
  },

  // Delete job
  deleteJob: async (id: string): Promise<void> => {
    try {
      await api.delete(`/jobs/${id}`);
    } catch (error) {
      throw new Error(handleApiError(error as Parameters<typeof handleApiError>[0]));
    }
  },

  // Publish job
  publishJob: async (id: string): Promise<Job> => {
    try {
      const response = await api.patch<ApiResponse<Job>>(`/jobs/${id}/publish`);
      return response.data.data!;
    } catch (error) {
      throw new Error(handleApiError(error as Parameters<typeof handleApiError>[0]));
    }
  },

  // Close job
  closeJob: async (id: string): Promise<Job> => {
    try {
      const response = await api.patch<ApiResponse<Job>>(`/jobs/${id}/close`);
      return response.data.data!;
    } catch (error) {
      throw new Error(handleApiError(error as Parameters<typeof handleApiError>[0]));
    }
  },

  // Get employer's jobs
  getMyJobs: async (page = 1, limit = 10): Promise<PaginatedResponse<Job>> => {
    try {
      const response = await api.get<PaginatedResponse<Job>>(
        `/jobs/employer/my-jobs?page=${page}&limit=${limit}`
      );
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error as Parameters<typeof handleApiError>[0]));
    }
  },

  // Get job applications (employer)
  getJobApplications: async (
    jobId: string,
    page = 1,
    limit = 10
  ): Promise<PaginatedResponse<JobApplication>> => {
    try {
      const response = await api.get<PaginatedResponse<JobApplication>>(
        `/jobs/${jobId}/applications?page=${page}&limit=${limit}`
      );
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error as Parameters<typeof handleApiError>[0]));
    }
  },

  // Apply to job
  applyToJob: async (jobId: string, data: { coverLetter?: string }): Promise<JobApplication> => {
    try {
      const response = await api.post<ApiResponse<JobApplication>>(`/applications/job/${jobId}`, data);
      return response.data.data!;
    } catch (error) {
      throw new Error(handleApiError(error as Parameters<typeof handleApiError>[0]));
    }
  },

  // Get my applications
  getMyApplications: async (page = 1, limit = 10): Promise<PaginatedResponse<JobApplication>> => {
    try {
      const response = await api.get<PaginatedResponse<JobApplication>>(
        `/applications/my-applications?page=${page}&limit=${limit}`
      );
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error as Parameters<typeof handleApiError>[0]));
    }
  },

  // Update application status (employer)
  updateApplicationStatus: async (
    applicationId: string,
    status: ApplicationStatus,
    notes?: string
  ): Promise<JobApplication> => {
    try {
      const response = await api.patch<ApiResponse<JobApplication>>(
        `/applications/${applicationId}/status`,
        { status, notes }
      );
      return response.data.data!;
    } catch (error) {
      throw new Error(handleApiError(error as Parameters<typeof handleApiError>[0]));
    }
  },

  // Withdraw application
  withdrawApplication: async (applicationId: string): Promise<void> => {
    try {
      await api.patch(`/applications/${applicationId}/withdraw`);
    } catch (error) {
      throw new Error(handleApiError(error as Parameters<typeof handleApiError>[0]));
    }
  },

  // Search jobs with query params
  searchJobs: async (params: {
    search?: string;
    type?: string;
    experience?: string;
    remote?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<Job>> => {
    try {
      const queryParams = new URLSearchParams();
      if (params.search) queryParams.append('search', params.search);
      if (params.type && params.type !== 'all') queryParams.append('jobType', params.type);
      if (params.experience && params.experience !== 'all') queryParams.append('experienceLevel', params.experience);
      if (params.remote === 'true') queryParams.append('remote', 'true');
      queryParams.append('page', String(params.page || 1));
      queryParams.append('limit', String(params.limit || 10));

      const response = await api.get<PaginatedResponse<Job>>(`/jobs?${queryParams.toString()}`);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error as Parameters<typeof handleApiError>[0]));
    }
  },

  // Get employer jobs (alias for getMyJobs)
  getEmployerJobs: async (page = 1, limit = 10): Promise<PaginatedResponse<Job>> => {
    try {
      const response = await api.get<PaginatedResponse<Job>>(
        `/jobs/employer/my-jobs?page=${page}&limit=${limit}`
      );
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error as Parameters<typeof handleApiError>[0]));
    }
  },
};
