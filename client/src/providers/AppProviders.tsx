"use client";

import { Toaster } from 'react-hot-toast';

import { AuthProvider } from '@/context/AuthContext';
import { GlobalLoadingBar } from '@/components/shared/GlobalLoadingBar';

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <GlobalLoadingBar />
      {children}
      <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
    </AuthProvider>
  );
}
