import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { UserRole } from '@/types';
import { LoadingState } from '@/components/ui/Spinner';

interface ProtectedRouteProps {
  allowedRoles?: UserRole[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles }) => {
  const location = useLocation();
  const { isAuthenticated, isLoading, user } = useAuthStore();

  if (isLoading) {
    return <LoadingState fullScreen message="Checking authentication..." />;
  }

  if (!isAuthenticated) {
    // Redirect to login, but save the attempted URL
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check role-based access
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    // Redirect to dashboard if user doesn't have permission
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
