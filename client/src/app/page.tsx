"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { FullScreenLoader } from '@/components/shared/FullScreenLoader';
import { useAuth } from '@/hooks/useAuth';

export default function Home() {
  const { user, isBootstrapping } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isBootstrapping) return;
    if (user) {
      router.replace('/dashboard');
    } else {
      router.replace('/auth/login');
    }
  }, [isBootstrapping, router, user]);

  return <FullScreenLoader label="Redirecting" />;
}
