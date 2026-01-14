import { useMemo } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useJobSeekerProfile } from '@/hooks/useProfile';

export interface ProfileCompletion {
  isLoading: boolean;
  isComplete: boolean;
  missing: Array<'name' | 'phone' | 'education' | 'skills'>;
}

export const useProfileCompletion = (): ProfileCompletion => {
  const { user } = useAuthStore();
  const { data: profile, isLoading } = useJobSeekerProfile();

  const { isComplete, missing } = useMemo(() => {
    const gaps: ProfileCompletion['missing'] = [];

    if (!user?.firstName || !user?.lastName) gaps.push('name');
    if (!user?.phone) gaps.push('phone');

    const eduCount = profile?.education?.length || 0;
    const skillsCount = profile?.skills?.length || 0;

    if (eduCount === 0) gaps.push('education');
    if (skillsCount === 0) gaps.push('skills');

    return { isComplete: gaps.length === 0, missing: gaps };
  }, [user?.firstName, user?.lastName, user?.phone, profile?.education, profile?.skills]);

  return { isLoading, isComplete, missing };
};
