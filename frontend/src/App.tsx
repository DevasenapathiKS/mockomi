import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { UserRole } from '@/types';

// Lazy load pages for better performance
const HomePage = React.lazy(() => import('@/pages/HomePage'));
const LoginPage = React.lazy(() => import('@/pages/auth/LoginPage'));
const RegisterPage = React.lazy(() => import('@/pages/auth/RegisterPage'));
const ForgotPasswordPage = React.lazy(() => import('@/pages/auth/ForgotPasswordPage'));
const ResetPasswordPage = React.lazy(() => import('@/pages/auth/ResetPasswordPage'));
const OAuthCallbackPage = React.lazy(() => import('@/pages/auth/OAuthCallbackPage'));
const DashboardPage = React.lazy(() => import('@/pages/dashboard/DashboardPage'));

// Jobs Pages
const JobsPage = React.lazy(() => import('@/pages/jobs/JobsPage'));
const JobDetailPage = React.lazy(() => import('@/pages/jobs/JobDetailPage'));

// Dashboard Pages
const ProfilePage = React.lazy(() => import('@/pages/dashboard/ProfilePage'));
const ApplicationsPage = React.lazy(() => import('@/pages/dashboard/ApplicationsPage'));
const InterviewsPage = React.lazy(() => import('@/pages/dashboard/InterviewsPage'));
const ScheduleInterviewPage = React.lazy(() => import('@/pages/dashboard/ScheduleInterviewPage'));
const NotificationsPage = React.lazy(() => import('@/pages/dashboard/NotificationsPage'));
const SettingsPage = React.lazy(() => import('@/pages/dashboard/SettingsPage'));

// Employer Pages
const CompanyProfilePage = React.lazy(() => import('@/pages/dashboard/CompanyProfilePage'));
const MyJobsPage = React.lazy(() => import('@/pages/dashboard/MyJobsPage'));
const CreateJobPage = React.lazy(() => import('@/pages/dashboard/CreateJobPage'));
const JobApplicationsPage = React.lazy(() => import('@/pages/dashboard/JobApplicationsPage'));
const EmployerPage = React.lazy(() => import('@/pages/dashboard/EmployerPage'));

// Interviewer Pages
const InterviewerProfilePage = React.lazy(() => import('@/pages/dashboard/InterviewerProfilePage'));
const EarningsPage = React.lazy(() => import('@/pages/dashboard/EarningsPage'));
const InterviewRequestsPage = React.lazy(() => import('@/pages/dashboard/InterviewRequestsPage'));
const InterviewPanelPage = React.lazy(() => import('@/pages/dashboard/InterviewPanelPage'));


// Protected Route component
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { LoadingState } from '@/components/ui/Spinner';
import ProfileCompletionGate from '@/components/auth/ProfileCompletionGate';

const App: React.FC = () => {
  const { setLoading, isLoading, isAuthenticated } = useAuthStore();

  useEffect(() => {
    // Check if we have stored auth on app load
    const checkAuth = () => {
      // The zustand persist middleware will restore the state
      // We just need to set loading to false after a short delay
      setTimeout(() => {
        setLoading(false);
      }, 100);
    };

    checkAuth();
  }, [setLoading]);

  if (isLoading) {
    return <LoadingState fullScreen message="Loading..." />;
  }

  return (
    <React.Suspense fallback={<LoadingState fullScreen />}>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <HomePage />} />
        <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />} />
        <Route path="/register" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <RegisterPage />} />
        <Route path="/forgot-password" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <ForgotPasswordPage />} />
        <Route path="/reset-password" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <ResetPasswordPage />} />
        <Route path="/auth/callback" element={<OAuthCallbackPage />} />
        {/* Jobs public listing */}
        <Route path="/jobs" element={<JobsPage />} />
        <Route path="/jobs/:id" element={<JobDetailPage />} />

        {/* Protected routes - All authenticated users */}
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/dashboard/notifications" element={<NotificationsPage />} />
          <Route path="/dashboard/settings" element={<SettingsPage />} />
        </Route>

        {/* Protected routes - Job Seekers only */}
        <Route element={<ProtectedRoute allowedRoles={[UserRole.JOB_SEEKER]} />}> 
          <Route path="/dashboard/profile" element={<ProfilePage />} />
          <Route element={<ProfileCompletionGate />}> 
            <Route path="/dashboard/applications" element={<ApplicationsPage />} />
            <Route path="/dashboard/interviews/schedule" element={<ScheduleInterviewPage />} />
          </Route>
        </Route>

        {/* Protected routes - Job Seekers and Interviewers */}
        <Route element={<ProtectedRoute allowedRoles={[UserRole.JOB_SEEKER, UserRole.INTERVIEWER]} />}> 
          {/* <Route element={<ProfileCompletionGate />}>  */}
            <Route path="/dashboard/interviews" element={<InterviewsPage />} />
            <Route path="/dashboard/interviews/:id/panel" element={<InterviewPanelPage />} />
          {/* </Route> */}
        </Route>

        {/* Protected routes - Employers only */}
        <Route element={<ProtectedRoute allowedRoles={[UserRole.EMPLOYER]} />}> 
          <Route path="/dashboard/company" element={<CompanyProfilePage />} />
          <Route path="/dashboard/employer-profile" element={<EmployerPage />} />
          <Route path="/dashboard/my-jobs" element={<MyJobsPage />} />
          <Route path="/dashboard/my-jobs/create" element={<CreateJobPage />} />
          <Route path="/dashboard/my-jobs/:id/edit" element={<CreateJobPage />} />
          <Route path="/dashboard/my-jobs/:jobId/applications" element={<JobApplicationsPage />} />
        </Route>

        {/* Protected routes - Interviewers only */}
        <Route element={<ProtectedRoute allowedRoles={[UserRole.INTERVIEWER]} />}>
          <Route path="/dashboard/interviewer-profile" element={<InterviewerProfilePage />} />
          <Route path="/dashboard/earnings" element={<EarningsPage />} />
          <Route path="/dashboard/interview-requests" element={<InterviewRequestsPage />} />
        </Route>
        {/* Catch all - redirect to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </React.Suspense>
  );
};

export default App;
