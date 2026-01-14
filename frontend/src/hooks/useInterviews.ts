import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { interviewService, ScheduleInterviewData, InterviewFeedbackData } from '@/services/interviewService';
import { InterviewType } from '@/types';

export const useInterviewers = (type?: InterviewType, page = 1, limit = 10) => {
  return useQuery({
    queryKey: ['interviewers', type, page, limit],
    queryFn: () => interviewService.getInterviewers(type, page, limit),
  });
};

export const usePaymentCheck = () => {
  return useQuery({
    queryKey: ['payment-check'],
    queryFn: () => interviewService.checkPaymentRequirement(),
  });
};

export const useMyInterviews = (status?: string, page = 1, limit = 10) => {
  return useQuery({
    queryKey: ['my-interviews', status, page, limit],
    queryFn: () => interviewService.getMyInterviews(status, page, limit),
  });
};

export const useInterview = (id: string) => {
  return useQuery({
    queryKey: ['interview', id],
    queryFn: () => interviewService.getInterview(id),
    enabled: !!id,
  });
};

export const useScheduleInterview = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ScheduleInterviewData) => interviewService.scheduleInterview(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-interviews'] });
      queryClient.invalidateQueries({ queryKey: ['payment-check'] });
      toast.success('Interview scheduled successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to schedule interview');
    },
  });
};

export const useStartInterview = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => interviewService.startInterview(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['interview', id] });
      queryClient.invalidateQueries({ queryKey: ['my-interviews'] });
      toast.success('Interview started');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to start interview');
    },
  });
};

export const useCompleteInterview = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => interviewService.completeInterview(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['interview', id] });
      queryClient.invalidateQueries({ queryKey: ['my-interviews'] });
      toast.success('Interview completed');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to complete interview');
    },
  });
};

export const useCancelInterview = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      interviewService.cancelInterview(id, reason),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['interview', id] });
      queryClient.invalidateQueries({ queryKey: ['my-interviews'] });
      toast.success('Interview cancelled');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to cancel interview');
    },
  });
};

export const useSubmitFeedback = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, feedback }: { id: string; feedback: InterviewFeedbackData }) =>
      interviewService.submitFeedback(id, feedback),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['interview', id] });
      queryClient.invalidateQueries({ queryKey: ['my-interviews'] });
      toast.success('Feedback submitted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to submit feedback');
    },
  });
};

export const useUploadRecording = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, file }: { id: string; file: File }) =>
      interviewService.uploadRecording(id, file),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['interview', id] });
      toast.success('Recording uploaded successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to upload recording');
    },
  });
};

export const useRecordingUrl = (id: string, enabled = false) => {
  return useQuery({
    queryKey: ['recording-url', id],
    queryFn: () => interviewService.getRecordingUrl(id),
    enabled,
    staleTime: 1000 * 60 * 55, // 55 minutes (URLs expire after 1 hour)
  });
};

export const useCreatePaymentOrder = () => {
  return useMutation({
    mutationFn: (interviewId: string) => interviewService.createPaymentOrder(interviewId),
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create payment order');
    },
  });
};

export const useVerifyPayment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      razorpayOrderId: string;
      razorpayPaymentId: string;
      razorpaySignature: string;
    }) => interviewService.verifyPayment(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-interviews'] });
      queryClient.invalidateQueries({ queryKey: ['payment-check'] });
      toast.success('Payment successful!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Payment verification failed');
    },
  });
};
