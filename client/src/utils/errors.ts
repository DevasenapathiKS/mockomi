import type { AxiosError } from 'axios';

import type { ApiError } from '@/types/api';

export function extractErrorMessage(error: unknown): string {
  if (typeof error === 'string') return error;
  if (error instanceof Error && error.message) return error.message;

  const axiosError = error as AxiosError<ApiError>;
  const apiMessage = axiosError?.response?.data?.message;
  if (apiMessage) return apiMessage;

  return 'Something went wrong. Please try again.';
}
