import api, { handleApiError } from './api';
import {
  JobSeekerProfile,
  CompanyProfile,
  InterviewerProfile,
  ApiResponse,
  PaginatedResponse,
  CandidateFilters,
} from '@/types';

export interface UpdateJobSeekerProfileData {
  headline?: string;
  summary?: string;
  skills?: string[];
  education?: JobSeekerProfile['education'];
  experience?: JobSeekerProfile['experience'];
  projects?: JobSeekerProfile['projects'];
  certifications?: JobSeekerProfile['certifications'];
  socialLinks?: JobSeekerProfile['socialLinks'];
  preferences?: JobSeekerProfile['preferences'];
}

interface CompanyProfilePayload {
  companyName: string;
  companyEmail: string;
  companyPhone?: string;
  website?: string;
  industry?: string;
  companySize?: string;
  founded?: number;
  headquarters?: {
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    pincode?: string;
  };
  description?: string;
  socialLinks?: {
    linkedin?: string;
    github?: string;
    portfolio?: string;
    twitter?: string;
    other?: string[];
  };
}

export interface CreateCompanyProfileData extends CompanyProfilePayload {}
export type UpdateCompanyProfileData = Partial<CompanyProfilePayload>;

export interface UpdateInterviewerProfileData {
  expertise?: string[];
  experience?: number;
  currentCompany?: string;
  currentPosition?: string;
  bio?: string;
  availability?: InterviewerProfile['availability'];
  hourlyRate?: number;
  interviewTypes?: InterviewerProfile['interviewTypes'];
  languages?: string[];
  linkedinUrl?: string;
  bankDetails?: {
    accountHolderName: string;
    accountNumber: string;
    ifscCode: string;
    bankName: string;
    branchName?: string;
    upiId?: string;
  };
}

export const profileService = {
  // Job Seeker Profile
  getJobSeekerProfile: async (): Promise<JobSeekerProfile> => {
    try {
      const response = await api.get<ApiResponse<JobSeekerProfile>>('/profile/job-seeker');
      return response.data.data!;
    } catch (error) {
      throw new Error(handleApiError(error as Parameters<typeof handleApiError>[0]));
    }
  },

  updateJobSeekerProfile: async (data: UpdateJobSeekerProfileData): Promise<JobSeekerProfile> => {
    try {
      const response = await api.put<ApiResponse<JobSeekerProfile>>('/profile/job-seeker', data);
      return response.data.data!;
    } catch (error) {
      throw new Error(handleApiError(error as Parameters<typeof handleApiError>[0]));
    }
  },

  uploadResume: async (file: File): Promise<{ url: string; filename: string }> => {
    try {
      const formData = new FormData();
      formData.append('resume', file);

      const response = await api.post<ApiResponse<{ resume: { url: string; filename: string } }>>(
        '/profile/job-seeker/resume',
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      return response.data.data!.resume;
    } catch (error) {
      throw new Error(handleApiError(error as Parameters<typeof handleApiError>[0]));
    }
  },

  // Company Profile
  getCompanyProfile: async (): Promise<CompanyProfile> => {
    try {
      const response = await api.get<ApiResponse<CompanyProfile>>('/profile/company');
      return response.data.data!;
    } catch (error) {
      throw new Error(handleApiError(error as Parameters<typeof handleApiError>[0]));
    }
  },

  createCompanyProfile: async (data: CreateCompanyProfileData): Promise<CompanyProfile> => {
    try {
      const response = await api.post<ApiResponse<CompanyProfile>>('/profile/company', data);
      return response.data.data!;
    } catch (error) {
      throw new Error(handleApiError(error as Parameters<typeof handleApiError>[0]));
    }
  },

  updateCompanyProfile: async (data: UpdateCompanyProfileData): Promise<CompanyProfile> => {
    try {
      const response = await api.put<ApiResponse<CompanyProfile>>('/profile/company', data);
      return response.data.data!;
    } catch (error) {
      throw new Error(handleApiError(error as Parameters<typeof handleApiError>[0]));
    }
  },

  uploadCompanyLogo: async (file: File): Promise<{ logo: string }> => {
    try {
      const formData = new FormData();
      formData.append('logo', file);

      const response = await api.post<ApiResponse<{ logo: string }>>(
        '/profile/company/logo',
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      return response.data.data!;
    } catch (error) {
      throw new Error(handleApiError(error as Parameters<typeof handleApiError>[0]));
    }
  },

  // Interviewer Profile
  getInterviewerProfile: async (): Promise<InterviewerProfile> => {
    try {
      const response = await api.get<ApiResponse<InterviewerProfile>>('/profile/interviewer');
      return response.data.data!;
    } catch (error) {
      throw new Error(handleApiError(error as Parameters<typeof handleApiError>[0]));
    }
  },

  updateInterviewerProfile: async (data: UpdateInterviewerProfileData): Promise<InterviewerProfile> => {
    try {
      const response = await api.put<ApiResponse<InterviewerProfile>>('/profile/interviewer', data);
      return response.data.data!;
    } catch (error) {
      throw new Error(handleApiError(error as Parameters<typeof handleApiError>[0]));
    }
  },

  // Avatar upload (all users)
  uploadAvatar: async (file: File): Promise<{ url: string }> => {
    try {
      const formData = new FormData();
      formData.append('avatar', file);

      const response = await api.post<ApiResponse<{ url: string }>>(
        '/profile/avatar',
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      return response.data.data!;
    } catch (error) {
      throw new Error(handleApiError(error as Parameters<typeof handleApiError>[0]));
    }
  },

  // Update basic info (firstName, lastName, phone)
  updateBasicInfo: async (data: { firstName?: string; lastName?: string; phone?: string }): Promise<any> => {
    try {
      const response = await api.put<ApiResponse<any>>('/profile/basic-info', data);
      return response.data.data!;
    } catch (error) {
      throw new Error(handleApiError(error as Parameters<typeof handleApiError>[0]));
    }
  },

  // Candidate search (for employers)
  searchCandidates: async (
    filters: CandidateFilters = {},
    page = 1,
    limit = 10
  ): Promise<PaginatedResponse<JobSeekerProfile & { user: { firstName: string; lastName: string; email: string; avatar?: string } }>> => {
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      });

      if (filters.search) params.append('search', filters.search);
      if (filters.skills?.length) params.append('skills', filters.skills.join(','));
      if (filters.experienceMin) params.append('experienceMin', String(filters.experienceMin));
      if (filters.experienceMax) params.append('experienceMax', String(filters.experienceMax));
      if (filters.location) params.append('location', filters.location);

      const response = await api.get<PaginatedResponse<JobSeekerProfile & { user: { firstName: string; lastName: string; email: string; avatar?: string } }>>(
        `/profile/candidates?${params.toString()}`
      );
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error as Parameters<typeof handleApiError>[0]));
    }
  },

  // Get candidate details
  getCandidateDetails: async (id: string): Promise<JobSeekerProfile & { user: { firstName: string; lastName: string; email: string; avatar?: string } }> => {
    try {
      const response = await api.get<ApiResponse<JobSeekerProfile & { user: { firstName: string; lastName: string; email: string; avatar?: string } }>>(
        `/profile/candidates/${id}`
      );
      return response.data.data!;
    } catch (error) {
      throw new Error(handleApiError(error as Parameters<typeof handleApiError>[0]));
    }
  },
};
