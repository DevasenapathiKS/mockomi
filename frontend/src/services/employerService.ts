import { ApiResponse, CompanyProfile } from '../types';
import api from './api';

export const getEmployerProfile = async (): Promise<ApiResponse<CompanyProfile>> => {
  return api.get('/profile/employer');
};

export const updateEmployerProfile = async (data: Partial<CompanyProfile>): Promise<ApiResponse<CompanyProfile>> => {
  return api.put('/profile/employer', data);
};

// Add more employer-related API functions as needed
