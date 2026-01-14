import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useProfileCompletion } from '@/hooks/useProfileCompletion';
import { LoadingState } from '@/components/ui/Spinner';

const ProfileCompletionGate: React.FC = () => {
  const location = useLocation();
  const { isLoading, isComplete, missing } = useProfileCompletion();

  if (isLoading) return <LoadingState fullScreen message="Checking profile..." />;

  if (!isComplete) {
    return (
      <Navigate
        to="/dashboard/profile?onboarding=1"
        replace
        state={{ from: location, onboarding: true, missing }}
      />
    );
  }

  return <Outlet />;
};

export default ProfileCompletionGate;
