import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { authService, RegisterData, LoginData } from '@/services/authService';
import { useAuthStore } from '@/store/authStore';

export const useAuth = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { setAuth, logout: logoutStore, isAuthenticated, user } = useAuthStore();

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: (data: RegisterData) => authService.register(data),
    onSuccess: (response) => {
      let tokens = { accessToken: response.accessToken, refreshToken: response.refreshToken };
      setAuth(response.user, tokens);
      toast.success('Registration successful!');
      
      // Redirect based on role
      switch (response.user.role) {
        case 'job_seeker':
          navigate('/dashboard/profile?onboarding=1');
          break;
        case 'employer':
          navigate('/dashboard/company');
          break;
        case 'interviewer':
          navigate('/dashboard/interviewer-profile');
          break;
        default:
          navigate('/dashboard');
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Registration failed');
    },
  });

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: (data: LoginData) => authService.login(data),
    onSuccess: (response) => {
      console.log('Login response:', response);
      const tokens = { accessToken: response.accessToken, refreshToken: response.refreshToken };
      setAuth(response.user, tokens);
      toast.success('Welcome back!');
      
      // Redirect based on role
      switch (response.user.role) {
        case 'admin':
          navigate('/admin');
          break;
        default:
          navigate('/dashboard');
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Login failed');
    },
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: () => authService.logout(),
    onSuccess: () => {
      logoutStore();
      queryClient.clear();
      toast.success('Logged out successfully');
      navigate('/');
    },
    onError: () => {
      // Still logout even if API call fails
      logoutStore();
      queryClient.clear();
      navigate('/');
    },
  });

  // Change password mutation
  const changePasswordMutation = useMutation({
    mutationFn: (data: { currentPassword: string; newPassword: string }) =>
      authService.changePassword(data),
    onSuccess: () => {
      toast.success('Password changed successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to change password');
    },
  });

  return {
    // State
    isAuthenticated,
    user,
    
    // Mutations
    register: registerMutation.mutate,
    isRegistering: registerMutation.isPending,
    
    login: loginMutation.mutate,
    isLoggingIn: loginMutation.isPending,
    
    logout: logoutMutation.mutate,
    isLoggingOut: logoutMutation.isPending,
    
    changePassword: changePasswordMutation.mutate,
    isChangingPassword: changePasswordMutation.isPending,
  };
};
