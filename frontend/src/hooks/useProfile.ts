import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  profileService,
  UpdateJobSeekerProfileData,
  UpdateCompanyProfileData,
  CreateCompanyProfileData,
  UpdateInterviewerProfileData,
} from '@/services/profileService';
import { CandidateFilters } from '@/types';
import { authService } from '@/services/authService';
import { useAuthStore } from '@/store/authStore';

// Job Seeker Profile hooks
export const useJobSeekerProfile = () => {
  return useQuery({
    queryKey: ['job-seeker-profile'],
    queryFn: () => profileService.getJobSeekerProfile(),
  });
};

export const useUpdateJobSeekerProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateJobSeekerProfileData) => profileService.updateJobSeekerProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job-seeker-profile'] });
      toast.success('Profile updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update profile');
    },
  });
};

export const useUploadResume = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (file: File) => profileService.uploadResume(file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job-seeker-profile'] });
      toast.success('Resume uploaded successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to upload resume');
    },
  });
};

// Company Profile hooks
export const useCompanyProfile = () => {
  return useQuery({
    queryKey: ['company-profile'],
    queryFn: () => profileService.getCompanyProfile(),
  });
};

export const useCreateCompanyProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateCompanyProfileData) => profileService.createCompanyProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-profile'] });
      toast.success('Company profile created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create company profile');
    },
  });
};

export const useUpdateCompanyProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateCompanyProfileData) => profileService.updateCompanyProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-profile'] });
      toast.success('Company profile updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update company profile');
    },
  });
};

export const useUploadCompanyLogo = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (file: File) => profileService.uploadCompanyLogo(file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-profile'] });
      toast.success('Logo uploaded successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to upload logo');
    },
  });
};

// Interviewer Profile hooks
export const useInterviewerProfile = () => {
  return useQuery({
    queryKey: ['interviewer-profile'],
    queryFn: () => profileService.getInterviewerProfile(),
  });
};

export const useUpdateInterviewerProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateInterviewerProfileData) => profileService.updateInterviewerProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['interviewer-profile'] });
      toast.success('Profile updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update profile');
    },
  });
};

// Avatar upload hook
export const useUploadAvatar = () => {
  const queryClient = useQueryClient();
  const updateUser = useAuthStore((state) => state.updateUser);
  const setUser = useAuthStore((state) => state.setUser);

  return useMutation({
    mutationFn: (file: File) => profileService.uploadAvatar(file),
    onSuccess: (data) => {
      updateUser({ avatar: data.url });
      // Refresh full user object from backend to keep store in sync
      authService
        .getCurrentUser()
        .then((freshUser) => setUser(freshUser))
        .catch(() => {/* non-blocking */});
      queryClient.invalidateQueries({ queryKey: ['job-seeker-profile'] });
      queryClient.invalidateQueries({ queryKey: ['company-profile'] });
      queryClient.invalidateQueries({ queryKey: ['interviewer-profile'] });
      toast.success('Avatar uploaded successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to upload avatar');
    },
  });
};

// Update basic info hook (firstName, lastName, phone)
export const useUpdateBasicInfo = () => {
  const queryClient = useQueryClient();
  const updateUser = useAuthStore((state) => state.updateUser);

  return useMutation({
    mutationFn: (data: { firstName?: string; lastName?: string; phone?: string }) =>
      profileService.updateBasicInfo(data),
    onSuccess: (data) => {
      updateUser({ firstName: data.firstName, lastName: data.lastName, phone: data.phone });
      queryClient.invalidateQueries({ queryKey: ['job-seeker-profile'] });
      queryClient.invalidateQueries({ queryKey: ['company-profile'] });
      queryClient.invalidateQueries({ queryKey: ['interviewer-profile'] });
      toast.success('Profile updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update profile');
    },
  });
};

// Candidate search hooks
export const useCandidates = (filters: CandidateFilters = {}, page = 1, limit = 10) => {
  return useQuery({
    queryKey: ['candidates', filters, page, limit],
    queryFn: () => profileService.searchCandidates(filters, page, limit),
  });
};

export const useCandidateDetails = (id: string) => {
  return useQuery({
    queryKey: ['candidate', id],
    queryFn: () => profileService.getCandidateDetails(id),
    enabled: !!id,
  });
};
