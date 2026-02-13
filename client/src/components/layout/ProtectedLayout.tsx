"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';
import { FullScreenLoader } from '@/components/shared/FullScreenLoader';
import { useAuth } from '@/hooks/useAuth';

export function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { user, isBootstrapping } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isBootstrapping && !user) {
      router.replace('/auth/login');
    }
  }, [isBootstrapping, router, user]);

  if (isBootstrapping || !user) {
    return <FullScreenLoader label="Securing workspace" />;
  }

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100">
      <Sidebar />
      <div className="flex-1">
        <Topbar />
        <main className="bg-[radial-gradient(circle_at_top,_rgba(255,_153,_0,_0.08),_transparent)] px-6 py-8">
          <div className="mx-auto max-w-6xl space-y-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
